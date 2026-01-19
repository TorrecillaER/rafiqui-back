import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaterialsBlockchainService, MaterialTokenId } from '../blockchain/materials-blockchain.service';
import { CreateMaterialOrderDto, MaterialOrderResponseDto, MaterialAvailabilityDto } from './dto/material-order.dto';
import { MaterialType, OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

const TOKENS_PER_KG = 10;

const MATERIAL_NAMES: Record<string, string> = {
  ALUMINUM: 'Aluminio Reciclado',
  GLASS: 'Vidrio Solar Premium',
  SILICON: 'Silicio Purificado',
  COPPER: 'Cobre Recuperado',
};

// Mapeo entre MaterialType de Prisma y MaterialTokenId de blockchain
const MATERIAL_TYPE_TO_TOKEN_ID: Record<MaterialType, MaterialTokenId> = {
  ALUMINUM: MaterialTokenId.ALUMINUM,
  GLASS: MaterialTokenId.GLASS,
  SILICON: MaterialTokenId.SILICON,
  COPPER: MaterialTokenId.COPPER,
};

@Injectable()
export class MaterialsMarketplaceService {
  private readonly logger = new Logger(MaterialsMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private materialsBlockchain: MaterialsBlockchainService,
  ) {}

  /**
   * Obtiene disponibilidad de materiales para compra
   */
  async getAvailability(): Promise<MaterialAvailabilityDto[]> {
    const stocks = await this.prisma.materialStock.findMany({
      orderBy: { type: 'asc' },
    });

    let blockchainBalances: any = null;
    if (this.materialsBlockchain.isConnected()) {
      try {
        blockchainBalances = await this.materialsBlockchain.getTreasuryBalances();
      } catch (error) {
        this.logger.warn('Could not fetch blockchain balances, using DB only');
      }
    }

    return stocks.map(stock => {
      const blockchainKg = blockchainBalances 
        ? blockchainBalances[stock.type.toLowerCase() as keyof typeof blockchainBalances] 
        : stock.availableKg;
      
      const availableKg = Math.min(stock.availableKg, blockchainKg || stock.availableKg);

      return {
        type: stock.type,
        name: stock.name,
        availableKg,
        availableTokens: Math.floor(availableKg * TOKENS_PER_KG),
        pricePerKg: stock.pricePerKg,
        totalValue: availableKg * stock.pricePerKg,
      };
    });
  }

  /**
   * Crea una orden de compra y transfiere tokens
   */
  async createOrder(dto: CreateMaterialOrderDto): Promise<MaterialOrderResponseDto> {
    const { buyerId, materialType, quantityKg, buyerWallet, destination, destinationNotes } = dto;

    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    const validTypes = ['ALUMINUM', 'GLASS', 'SILICON', 'COPPER'];
    if (!validTypes.includes(materialType.toUpperCase())) {
      throw new BadRequestException('Tipo de material inválido');
    }

    const materialTypeEnum = materialType.toUpperCase() as MaterialType;

    const stock = await this.prisma.materialStock.findUnique({
      where: { type: materialTypeEnum },
    });

    if (!stock) {
      throw new NotFoundException('Material no encontrado');
    }

    if (stock.availableKg < quantityKg) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${stock.availableKg} kg, Solicitado: ${quantityKg} kg`
      );
    }

    const totalPrice = quantityKg * stock.pricePerKg;
    const tokensToTransfer = Math.round(quantityKg * TOKENS_PER_KG);

    const order = await this.prisma.materialOrder.create({
      data: {
        buyerId: buyerId && buyerId !== 'demo-buyer-id' ? buyerId : null,
        materialType: materialTypeEnum,
        quantityKg,
        pricePerKg: stock.pricePerKg,
        totalPrice,
        buyerWallet,
        destination: destination || 'OTHER',
        destinationNotes: destinationNotes || null,
        status: OrderStatus.PROCESSING,
      },
    });

    this.logger.log(`Order created: ${order.id} for ${quantityKg}kg of ${materialType}`);

    let txHash: string | null = null;
    let orderStatus: OrderStatus = OrderStatus.COMPLETED;

    try {
      if (this.materialsBlockchain.isConnected()) {
        this.logger.log(`Transferring ${tokensToTransfer} tokens to ${buyerWallet}`);
        
        const materialTokenId = MATERIAL_TYPE_TO_TOKEN_ID[materialTypeEnum];
        const transferResult = await this.materialsBlockchain.transferToBuyer(
          buyerWallet,
          materialTokenId,
          quantityKg,
          order.id,
        );
        
        txHash = transferResult.txHash;

        this.logger.log(`Blockchain transfer successful. TxHash: ${txHash}`);
      } else {
        this.logger.warn('Blockchain not connected, order completed without token transfer');
      }

      await this.prisma.materialStock.update({
        where: { type: materialTypeEnum },
        data: {
          availableKg: { decrement: quantityKg },
          reservedKg: { increment: quantityKg },
        },
      });

    } catch (error) {
      this.logger.error(`Error processing order ${order.id}:`, error);
      orderStatus = OrderStatus.FAILED;
    }

    const updatedOrder = await this.prisma.materialOrder.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        blockchainTxHash: txHash,
        completedAt: orderStatus === OrderStatus.COMPLETED ? new Date() : null,
      },
    });

    return {
      success: orderStatus === OrderStatus.COMPLETED,
      message: orderStatus === OrderStatus.COMPLETED 
        ? `Compra exitosa. ${tokensToTransfer} tokens transferidos a tu wallet.`
        : 'Error al procesar la compra. Por favor contacta soporte.',
      order: {
        id: updatedOrder.id,
        materialType: updatedOrder.materialType,
        quantityKg: updatedOrder.quantityKg,
        totalPrice: updatedOrder.totalPrice,
        status: updatedOrder.status,
        blockchainTxHash: updatedOrder.blockchainTxHash,
        tokensTransferred: orderStatus === OrderStatus.COMPLETED ? tokensToTransfer : 0,
      },
    };
  }

  /**
   * Obtiene órdenes de un comprador
   */
  async getOrdersByBuyer(buyerId: string) {
    return this.prisma.materialOrder.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene una orden por ID
   */
  async getOrderById(orderId: string) {
    const order = await this.prisma.materialOrder.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }
}
