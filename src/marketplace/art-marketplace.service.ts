import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';
import { OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class ArtMarketplaceService {
  private readonly logger = new Logger(ArtMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async purchaseArt(dto: CreateArtOrderDto): Promise<ArtOrderResponseDto> {
    const { artPieceId, buyerWallet, buyerId, messageToArtist } = dto;

    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    const artPiece = await this.prisma.artPiece.findUnique({
      where: { id: artPieceId },
      include: { 
        sourceAsset: {
          select: {
            brand: true,
            model: true,
          }
        }
      },
    });

    if (!artPiece) {
      throw new NotFoundException('Obra de arte no encontrada');
    }

    if (!artPiece.isAvailable) {
      throw new BadRequestException('Esta obra no está disponible para venta');
    }

    if (!artPiece.tokenId) {
      throw new BadRequestException('Esta obra no tiene token en blockchain');
    }

    if (buyerId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: buyerId },
      });
      if (!userExists) {
        throw new BadRequestException('Usuario comprador no encontrado');
      }
    }

    const order = await this.prisma.artOrder.create({
      data: {
        artPieceId,
        buyerId: buyerId || null,
        buyerWallet,
        price: artPiece.price,
        messageToArtist,
        status: OrderStatus.PROCESSING,
      },
    });

    let txHash: string | null = null;

    try {
      txHash = await this.blockchainService.transferArt(
        artPiece.tokenId,
        buyerWallet,
      );

      await this.prisma.artPiece.update({
        where: { id: artPieceId },
        data: {
          isAvailable: false,
          soldAt: new Date(),
          buyerWallet,
        },
      });

      await this.prisma.artOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          blockchainTxHash: txHash,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Art piece ${artPieceId} sold to ${buyerWallet}. TxHash: ${txHash}`);

    } catch (error) {
      this.logger.error(`Error transferring art ${artPieceId}:`, error);
      
      await this.prisma.artOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      throw new BadRequestException('Error al transferir la obra en blockchain');
    }

    return {
      success: true,
      message: 'Obra de arte comprada exitosamente. NFT transferido a tu wallet.',
      order: {
        id: order.id,
        artPieceId,
        tokenId: artPiece.tokenId,
        title: artPiece.title,
        artist: artPiece.artist,
        price: artPiece.price,
        blockchainTxHash: txHash,
      },
    };
  }

  async getAvailableArt() {
    return this.prisma.artPiece.findMany({
      where: { 
        isAvailable: true,
        tokenId: { not: null },
      },
      include: {
        sourceAsset: {
          select: {
            brand: true,
            model: true,
            qrCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtDetails(artPieceId: string) {
    const artPiece = await this.prisma.artPiece.findUnique({
      where: { id: artPieceId },
      include: { 
        sourceAsset: true,
        orders: {
          include: {
            buyer: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        }
      },
    });

    if (!artPiece) {
      throw new NotFoundException('Obra de arte no encontrada');
    }

    return artPiece;
  }

  async getArtOrderHistory(buyerId?: string) {
    const where = buyerId ? { buyerId } : {};

    return this.prisma.artOrder.findMany({
      where,
      include: {
        artPiece: {
          select: {
            title: true,
            artist: true,
            tokenId: true,
            imageUrl: true,
          },
        },
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtMarketplaceStats() {
    const totalAvailable = await this.prisma.artPiece.count({
      where: { isAvailable: true },
    });

    const totalSold = await this.prisma.artPiece.count({
      where: { isAvailable: false, soldAt: { not: null } },
    });

    const totalRevenue = await this.prisma.artOrder.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { price: true },
    });

    const averagePrice = await this.prisma.artOrder.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _avg: { price: true },
    });

    const artByCategory = await this.prisma.artPiece.groupBy({
      by: ['category'],
      _count: true,
      where: { isAvailable: true },
    });

    return {
      totalAvailable,
      totalSold,
      totalRevenue: totalRevenue._sum.price || 0,
      averagePrice: averagePrice._avg.price || 0,
      artByCategory: artByCategory.map(item => ({
        category: item.category,
        count: item._count,
      })),
    };
  }
}
