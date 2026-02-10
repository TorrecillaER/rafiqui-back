import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreatePanelOrderDto, PanelOrderResponseDto, PanelDetailsDto } from './dto/panel-order.dto';
import { AssetStatus, OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class PanelsMarketplaceService {
  private readonly logger = new Logger(PanelsMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async purchasePanel(dto: CreatePanelOrderDto): Promise<PanelOrderResponseDto> {
    const { assetId, buyerWallet, destination, destinationNotes, buyerId } = dto;

    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Panel no encontrado');
    }

    if (asset.status !== AssetStatus.LISTED_FOR_SALE) {
      throw new BadRequestException('Este panel no está disponible para venta');
    }

    // Los paneles reacondicionados no requieren tokenId ERC-721
    // Se usa el qrCode como identificador y se actualiza el estado en blockchain
    const qrCode = asset.qrCode || asset.nfcTagId || asset.id;

    const price = this.calculatePanelPrice(asset);

    const order = await this.prisma.panelOrder.create({
      data: {
        assetId,
        buyerId: buyerId || null,
        buyerWallet,
        price,
        destination,
        destinationNotes,
        status: OrderStatus.PROCESSING,
      },
    });

    let txHash: string | null = null;

    try {
      // Actualizar estado en blockchain a SOLD
      if (this.blockchainService.isConnected()) {
        txHash = await this.blockchainService.updatePanelStatus(
          qrCode,
          6, // PanelStatus.SOLD
          buyerWallet,
          ''
        );
        this.logger.log(`Panel ${qrCode} status updated to SOLD. TxHash: ${txHash}`);
      }

      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.REUSED,
          soldAt: new Date(),
          buyerWallet,
        },
      });

      await this.prisma.panelOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          blockchainTxHash: txHash,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Panel ${assetId} sold to ${buyerWallet}. TxHash: ${txHash}`);

    } catch (error) {
      this.logger.error(`Error processing panel sale ${assetId}:`, error);
      
      await this.prisma.panelOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      throw new BadRequestException('Error al procesar la venta del panel');
    }

    return {
      success: true,
      message: 'Panel comprado exitosamente. La transacción ha sido registrada en blockchain.',
      order: {
        id: order.id,
        assetId,
        tokenId: qrCode, // Usar qrCode como identificador
        price,
        blockchainTxHash: txHash,
      },
    };
  }

  private calculatePanelPrice(asset: any): number {
    const basePrice = 150;
    const powerBonus = (asset.measuredPowerWatts || 0) * 0.5;
    const voltageBonus = (asset.measuredVoltage || 0) * 2;
    const healthBonus = (asset.healthPercentage || 0) * 1.5;
    return Math.round(basePrice + powerBonus + voltageBonus + healthBonus);
  }

  async getAvailablePanels(): Promise<PanelDetailsDto[]> {
    const panels = await this.prisma.asset.findMany({
      where: { 
        status: AssetStatus.LISTED_FOR_SALE,
      },
      orderBy: { refurbishedAt: 'desc' },
    });

    return panels.map(panel => ({
      id: panel.id,
      qrCode: panel.qrCode || '',
      brand: panel.brand || '',
      model: panel.model || '',
      status: panel.status,
      tokenId: panel.tokenId || '',
      price: this.calculatePanelPrice(panel),
      measuredPowerWatts: panel.measuredPowerWatts || 0,
      measuredVoltage: panel.measuredVoltage || 0,
      healthPercentage: panel.healthPercentage || 0,
      capacityRetainedPercent: panel.capacityRetainedPercent || 0,
      dimensionLength: panel.dimensionLength || 0,
      dimensionWidth: panel.dimensionWidth || 0,
      dimensionHeight: panel.dimensionHeight || 0,
      refurbishedAt: panel.refurbishedAt || panel.createdAt,
    }));
  }

  async getPanelDetails(assetId: string): Promise<PanelDetailsDto> {
    const panel = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!panel) {
      throw new NotFoundException('Panel no encontrado');
    }

    return {
      id: panel.id,
      qrCode: panel.qrCode || '',
      brand: panel.brand || '',
      model: panel.model || '',
      status: panel.status,
      tokenId: panel.tokenId || '',
      price: this.calculatePanelPrice(panel),
      measuredPowerWatts: panel.measuredPowerWatts || 0,
      measuredVoltage: panel.measuredVoltage || 0,
      healthPercentage: panel.healthPercentage || 0,
      capacityRetainedPercent: panel.capacityRetainedPercent || 0,
      dimensionLength: panel.dimensionLength || 0,
      dimensionWidth: panel.dimensionWidth || 0,
      dimensionHeight: panel.dimensionHeight || 0,
      refurbishedAt: panel.refurbishedAt || panel.createdAt,
    };
  }

  async getPanelOrderHistory(buyerId?: string) {
    const where = buyerId ? { buyerId } : {};

    return this.prisma.panelOrder.findMany({
      where,
      include: {
        asset: {
          select: {
            qrCode: true,
            brand: true,
            model: true,
            tokenId: true,
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

  async getMarketplaceStats() {
    const totalAvailable = await this.prisma.asset.count({
      where: { status: AssetStatus.LISTED_FOR_SALE },
    });

    const totalSold = await this.prisma.asset.count({
      where: { status: AssetStatus.REUSED, soldAt: { not: null } },
    });

    const totalRevenue = await this.prisma.panelOrder.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { price: true },
    });

    const averagePrice = await this.prisma.panelOrder.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _avg: { price: true },
    });

    return {
      totalAvailable,
      totalSold,
      totalRevenue: totalRevenue._sum.price || 0,
      averagePrice: averagePrice._avg.price || 0,
    };
  }
}
