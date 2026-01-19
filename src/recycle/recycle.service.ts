import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';
import { MaterialsBlockchainService, MaterialTokenId } from '../blockchain/materials-blockchain.service';
import { ProcessRecycleDto, RecycleResponseDto, MaterialStockDto } from './dto/recycle.dto';
import { AssetStatus, MaterialType } from '@prisma/client';
import * as crypto from 'crypto';

const MATERIAL_PERCENTAGES = {
  ALUMINUM: 0.35,
  GLASS: 0.40,
  SILICON: 0.15,
  COPPER: 0.10,
};

const MATERIAL_PRICES = {
  ALUMINUM: 2.80,
  GLASS: 0.45,
  SILICON: 15.00,
  COPPER: 8.50,
};

const MATERIAL_NAMES = {
  ALUMINUM: 'Aluminio Reciclado',
  GLASS: 'Vidrio Solar Premium',
  SILICON: 'Silicio Purificado',
  COPPER: 'Cobre Recuperado',
};

@Injectable()
export class RecycleService {
  private readonly logger = new Logger(RecycleService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private materialsBlockchainService: MaterialsBlockchainService,
  ) {}

  async processRecycle(dto: ProcessRecycleDto): Promise<RecycleResponseDto> {
    const { assetId, operatorId, panelWeightKg = 20.0 } = dto;

    if (!operatorId) {
      throw new BadRequestException('operatorId es requerido');
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { inspection: true },
    });

    if (!asset) {
      throw new NotFoundException('Asset no encontrado');
    }

    const validStatuses: AssetStatus[] = [AssetStatus.RECYCLED, AssetStatus.INSPECTED];
    if (!validStatuses.includes(asset.status)) {
      if (asset.inspection?.aiRecommendation !== 'RECYCLE') {
        throw new BadRequestException(
          `El panel no está aprobado para reciclaje. Estado actual: ${asset.status}`
        );
      }
    }

    const existingRecord = await this.prisma.recycleRecord.findUnique({
      where: { assetId },
    });

    if (existingRecord) {
      throw new BadRequestException('Este panel ya fue reciclado');
    }

    const materials = {
      aluminum: panelWeightKg * MATERIAL_PERCENTAGES.ALUMINUM,
      glass: panelWeightKg * MATERIAL_PERCENTAGES.GLASS,
      silicon: panelWeightKg * MATERIAL_PERCENTAGES.SILICON,
      copper: panelWeightKg * MATERIAL_PERCENTAGES.COPPER,
    };

    const recycleData = {
      assetId,
      operatorId,
      panelWeightKg,
      materials,
      timestamp: new Date().toISOString(),
    };
    const ipfsHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(recycleData))
      .digest('hex');

    const result = await this.prisma.$transaction(async (prisma) => {
      const recycleRecord = await prisma.recycleRecord.create({
        data: {
          assetId,
          operatorId,
          panelWeightKg,
          aluminumKg: materials.aluminum,
          glassKg: materials.glass,
          siliconKg: materials.silicon,
          copperKg: materials.copper,
          ipfsHash,
        },
      });

      await prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.RECYCLED },
      });

      const stockUpdates = await Promise.all([
        this.upsertMaterialStock(prisma, MaterialType.ALUMINUM, materials.aluminum),
        this.upsertMaterialStock(prisma, MaterialType.GLASS, materials.glass),
        this.upsertMaterialStock(prisma, MaterialType.SILICON, materials.silicon),
        this.upsertMaterialStock(prisma, MaterialType.COPPER, materials.copper),
      ]);

      return { recycleRecord, stockUpdates };
    });

    let blockchainTxHash: string | null = null;
    try {
      const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
      blockchainTxHash = await this.blockchainService.updatePanelStatus(
        qrCode,
        PanelStatus.RECYCLED,
        'Recycling Facility',
        ipfsHash,
      );

      await this.prisma.recycleRecord.update({
        where: { id: result.recycleRecord.id },
        data: { blockchainTxHash },
      });
    } catch (error) {
      this.logger.error('Error updating blockchain', error);
    }

    let materialsTxHash: string | null = null;
    let tokensMinted = { aluminum: 0, glass: 0, silicon: 0, copper: 0 };

    try {
      if (this.materialsBlockchainService.isConnected()) {
        this.logger.log('Minting ERC-1155 material tokens...');
        
        const mintResult = await this.materialsBlockchainService.mintFromRecycle(
          materials.aluminum,
          materials.glass,
          materials.silicon,
          materials.copper,
          result.recycleRecord.id,
        );

        materialsTxHash = mintResult.txHash;
        tokensMinted = {
          aluminum: mintResult.aluminumTokens,
          glass: mintResult.glassTokens,
          silicon: mintResult.siliconTokens,
          copper: mintResult.copperTokens,
        };

        await this.prisma.recycleRecord.update({
          where: { id: result.recycleRecord.id },
          data: { materialsTxHash },
        });

        this.logger.log(`Materials tokens minted: ${JSON.stringify(tokensMinted)}`);
      } else {
        this.logger.warn('Materials contract not connected. Skipping token minting.');
      }
    } catch (error) {
      this.logger.error('Error minting material tokens', error);
    }

    const updatedStock = await this.getMaterialStock();

    return {
      success: true,
      message: 'Panel reciclado exitosamente. Materiales separados y tokens ERC-1155 minteados.',
      recycleRecord: {
        id: result.recycleRecord.id,
        assetId,
        panelWeightKg,
        materials,
        blockchainTxHash,
        materialsTxHash,
        tokensMinted,
      },
      updatedStock: {
        aluminum: updatedStock.find(s => s.type === 'ALUMINUM')?.availableKg || 0,
        glass: updatedStock.find(s => s.type === 'GLASS')?.availableKg || 0,
        silicon: updatedStock.find(s => s.type === 'SILICON')?.availableKg || 0,
        copper: updatedStock.find(s => s.type === 'COPPER')?.availableKg || 0,
      },
    };
  }

  private async upsertMaterialStock(
    prisma: any,
    type: MaterialType,
    addKg: number,
  ) {
    const existing = await prisma.materialStock.findUnique({
      where: { type },
    });

    if (existing) {
      return prisma.materialStock.update({
        where: { type },
        data: {
          totalKg: { increment: addKg },
          availableKg: { increment: addKg },
        },
      });
    } else {
      return prisma.materialStock.create({
        data: {
          type,
          name: MATERIAL_NAMES[type],
          totalKg: addKg,
          availableKg: addKg,
          pricePerKg: MATERIAL_PRICES[type],
        },
      });
    }
  }

  async getMaterialStock(): Promise<MaterialStockDto[]> {
    const stocks = await this.prisma.materialStock.findMany({
      orderBy: { type: 'asc' },
    });

    if (stocks.length === 0) {
      return Object.entries(MATERIAL_NAMES).map(([type, name]) => ({
        type,
        name,
        totalKg: 0,
        availableKg: 0,
        pricePerKg: MATERIAL_PRICES[type as keyof typeof MATERIAL_PRICES],
      }));
    }

    return stocks.map(s => ({
      type: s.type,
      name: s.name,
      totalKg: s.totalKg,
      availableKg: s.availableKg,
      pricePerKg: s.pricePerKg,
    }));
  }

  async getTreasuryBalances() {
    return this.materialsBlockchainService.getTreasuryBalances();
  }

  async getWalletBalances(walletAddress: string) {
    return this.materialsBlockchainService.getWalletBalances(walletAddress);
  }

  async findAssetForRecycle(qrCode: string) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        OR: [
          { qrCode },
          { nfcTagId: qrCode },
        ],
      },
      include: {
        inspection: true,
        recycleRecord: true,
      },
    });

    if (!asset) {
      return null;
    }

    if (asset.recycleRecord) {
      return {
        asset,
        canRecycle: false,
        reason: 'Este panel ya fue reciclado',
      };
    }

    // Solo permitir reciclaje si tiene recomendación RECYCLE y estado INSPECTED
    const isApprovedForRecycle = 
      asset.inspection?.aiRecommendation === 'RECYCLE' &&
      asset.status === AssetStatus.INSPECTED;

    return {
      asset,
      canRecycle: isApprovedForRecycle,
      reason: isApprovedForRecycle 
        ? 'Panel listo para reciclaje' 
        : `Estado actual: ${asset.status}. Se requiere aprobación de reciclaje.`,
    };
  }

  async getRecycleHistory(limit = 50) {
    return this.prisma.recycleRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            qrCode: true,
            brand: true,
            model: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
