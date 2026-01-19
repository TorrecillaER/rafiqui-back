import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus, Asset, Prisma } from '@prisma/client';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async create(createAssetDto: CreateAssetDto) {
    const { nfcTagId, qrCode, collectionRequestId, brand, model, status } = createAssetDto;

    let existingAsset: Asset | null = null;

    if (nfcTagId) {
      existingAsset = await this.prisma.asset.findUnique({
        where: { nfcTagId },
      });
    }
    
    if (!existingAsset && qrCode) {
      // qrCode no es unique en schema, usamos findFirst
      existingAsset = await this.prisma.asset.findFirst({
        where: { qrCode },
      });
    }

    if (existingAsset) {
      const updatedAsset = await this.prisma.asset.update({
        where: { id: existingAsset.id },
        data: {
          status: status || AssetStatus.IN_TRANSIT,
          collectionRequestId: collectionRequestId || existingAsset.collectionRequestId,
          brand: brand || existingAsset.brand,
          model: model || existingAsset.model,
          nfcTagId: nfcTagId || existingAsset.nfcTagId,
          qrCode: qrCode || existingAsset.qrCode,
        },
      });

      this.updateStatusInBlockchain(
        updatedAsset.qrCode || updatedAsset.nfcTagId || updatedAsset.id,
        updatedAsset.status,
        'Updated'
      ).catch(err => {
        this.logger.error(`Failed to update asset in blockchain`, err);
      });

      return updatedAsset;
    } else {
      const newAsset = await this.prisma.asset.create({
        data: {
          nfcTagId,
          qrCode,
          collectionRequestId,
          brand,
          model,
          status: AssetStatus.IN_TRANSIT,
        },
      });

      this.registerInBlockchain(newAsset).catch(err => {
        this.logger.error(`Failed to register asset ${newAsset.id} in blockchain`, err);
      });

      return newAsset;
    }
  }

  // Mantener scan por compatibilidad si es necesario, pero redirigir a create
  async scan(scanAssetDto: any) {
    return this.create({
      nfcTagId: scanAssetDto.nfcTagId,
      collectionRequestId: scanAssetDto.requestId,
    } as CreateAssetDto);
  }

  async findAll(status?: string, nfcTagId?: string, collectionRequestId?: string, qrCode?: string) {
    const where: any = {};

    if (status) {
      const statuses = status.split(',').map((s) => s.trim() as AssetStatus);
      where.status = { in: statuses };
    }

    if (nfcTagId) {
      where.nfcTagId = nfcTagId;
    }

    if (qrCode) {
      where.qrCode = qrCode;
    }

    if (collectionRequestId) {
      where.collectionRequestId = collectionRequestId;
    }

    return this.prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        collectionRequest: true,
      }
    });
  }

  async update(id: string, data: UpdateAssetDto) {
    const updatedAsset = await this.prisma.asset.update({
      where: { id },
      data,
    });

    if (data.status) {
      this.updateStatusInBlockchain(
        updatedAsset.qrCode || updatedAsset.nfcTagId || updatedAsset.id,
        updatedAsset.status,
        'Updated'
      ).catch(err => {
        this.logger.error(`Failed to update asset status in blockchain`, err);
      });
    }

    return updatedAsset;
  }

  private async registerInBlockchain(asset: Asset): Promise<void> {
    if (!this.blockchainService.isConnected()) {
      this.logger.warn('Blockchain not connected, skipping registration');
      return;
    }

    try {
      const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
      const txHash = await this.blockchainService.registerPanel(
        qrCode,
        asset.brand || 'Unknown',
        asset.model || 'Unknown',
        'Warehouse',
        ''
      );
      
      this.logger.log(`Asset ${qrCode} registered in blockchain: ${txHash}`);
    } catch (error) {
      this.logger.error(`Blockchain registration failed for asset ${asset.id}`, error);
    }
  }

  private mapStatusToBlockchain(status: AssetStatus): PanelStatus {
    const statusMap: Record<AssetStatus, PanelStatus> = {
      [AssetStatus.PENDING_COLLECTION]: PanelStatus.COLLECTED,
      [AssetStatus.IN_TRANSIT]: PanelStatus.COLLECTED,
      [AssetStatus.WAREHOUSE_RECEIVED]: PanelStatus.WAREHOUSE_RECEIVED,
      [AssetStatus.INSPECTING]: PanelStatus.WAREHOUSE_RECEIVED, // Panel en proceso de inspección
      [AssetStatus.INSPECTED]: PanelStatus.INSPECTED,
      [AssetStatus.RECYCLED]: PanelStatus.RECYCLED,
      [AssetStatus.REUSED]: PanelStatus.SOLD,
      [AssetStatus.READY_FOR_REUSE]: PanelStatus.REUSE_APPROVED,
      [AssetStatus.REFURBISHING]: PanelStatus.REUSE_APPROVED, // En proceso de reacondicionamiento
      [AssetStatus.LISTED_FOR_SALE]: PanelStatus.REUSE_APPROVED, // Listo para venta
      [AssetStatus.ART_CANDIDATE]: PanelStatus.ART_APPROVED,
      [AssetStatus.ART_LISTED_FOR_SALE]: PanelStatus.ART_LISTED, // Obra de arte publicada
    };
    
    return statusMap[status] ?? PanelStatus.COLLECTED;
  }

  private async updateStatusInBlockchain(
    identifier: string,
    status: AssetStatus,
    location: string
  ): Promise<void> {
    if (!this.blockchainService.isConnected()) {
      return;
    }

    try {
      const blockchainStatus = this.mapStatusToBlockchain(status);
      const txHash = await this.blockchainService.updatePanelStatus(
        identifier,
        blockchainStatus,
        location,
        ''
      );
      
      this.logger.log(`Asset ${identifier} status updated in blockchain: ${txHash}`);
    } catch (error) {
      this.logger.error(`Blockchain status update failed for ${identifier}`, error);
    }
  }

  async validateForInspection(qrCode: string, inspectorId?: string): Promise<{
    valid: boolean;
    message: string;
    asset?: Asset;
    error?: string;
  }> {
    const asset = await this.prisma.asset.findFirst({
      where: { qrCode },
      include: {
        collectionRequest: true,
        inspection: true,
      },
    });

    if (!asset) {
      return {
        valid: false,
        message: 'Panel no encontrado',
        error: 'Este panel no existe en los registros. Verifica el código QR.',
      };
    }

    const processedStatuses: AssetStatus[] = [
      AssetStatus.INSPECTED,
      AssetStatus.READY_FOR_REUSE,
      AssetStatus.REUSED,
      AssetStatus.RECYCLED,
    ];

    if (processedStatuses.includes(asset.status)) {
      return {
        valid: false,
        message: 'Panel ya procesado',
        error: `Este panel ya ha sido inspeccionado previamente. Estado actual: ${asset.status}`,
        asset: asset,
      };
    }

    const validStatuses: AssetStatus[] = [
      AssetStatus.IN_TRANSIT,
      AssetStatus.WAREHOUSE_RECEIVED,
      AssetStatus.INSPECTING,
    ];

    if (!validStatuses.includes(asset.status)) {
      return {
        valid: false,
        message: 'Estado no válido',
        error: `Este panel no está disponible para inspección. Estado actual: ${asset.status}`,
        asset: asset,
      };
    }

    if (asset.status === AssetStatus.IN_TRANSIT || 
        asset.status === AssetStatus.WAREHOUSE_RECEIVED) {
      
      const updatedAsset = await this.prisma.asset.update({
        where: { id: asset.id },
        data: {
          status: AssetStatus.INSPECTING,
          inspectorId: inspectorId,
          inspectionStartedAt: new Date(),
        },
        include: {
          collectionRequest: true,
          inspection: true,
        },
      });
      
      this.logger.log(`Panel ${qrCode} cambiado a INSPECTING por inspector ${inspectorId || 'unknown'}`);

      this.updateStatusInBlockchain(
        updatedAsset.qrCode || updatedAsset.nfcTagId || updatedAsset.id,
        updatedAsset.status,
        'Inspection Started'
      ).catch(err => {
        this.logger.error(`Failed to update inspection status in blockchain`, err);
      });
      
      return {
        valid: true,
        message: 'Panel válido para inspección',
        asset: updatedAsset,
      };
    }

    return {
      valid: true,
      message: 'Panel válido para inspección',
      asset: asset,
    };
  }

  async findByQrCode(qrCode: string): Promise<Asset | null> {
    return this.prisma.asset.findFirst({
      where: { qrCode },
      include: {
        collectionRequest: true,
        inspection: true,
        artPiece: true,
      },
    });
  }

  async findByNfcTag(nfcTagId: string): Promise<Asset | null> {
    return this.prisma.asset.findUnique({
      where: { nfcTagId },
      include: {
        collectionRequest: true,
        inspection: true,
        artPiece: true,
      },
    });
  }

  /**
   * Completa el proceso de reacondicionamiento y marca el panel como listo para venta
   * Actualiza tanto la BD como la blockchain
   */
  async completeRefurbishment(
    assetId: string,
    dto?: {
      notes?: string;
      measuredPowerWatts?: number;
      measuredVoltage?: number;
      capacityRetainedPercent?: number;
      healthPercentage?: number;
      dimensionLength?: number;
      dimensionWidth?: number;
      dimensionHeight?: number;
      technicianId?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
    asset?: Asset;
    blockchainTxHash?: string;
  }> {
    // Buscar el asset
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return {
        success: false,
        message: 'Asset no encontrado',
      };
    }

    // Verificar que el estado sea válido para completar reacondicionamiento
    const validStatuses: AssetStatus[] = [
      AssetStatus.READY_FOR_REUSE,
      AssetStatus.REFURBISHING,
    ];

    if (!validStatuses.includes(asset.status)) {
      return {
        success: false,
        message: `El panel no está en estado válido para completar reacondicionamiento. Estado actual: ${asset.status}`,
      };
    }

    // Actualizar en base de datos con TODOS los campos técnicos
    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        // IMPORTANTE: Estado final debe ser LISTED_FOR_SALE
        status: AssetStatus.LISTED_FOR_SALE,
        refurbishedAt: new Date(),
        
        // Datos del técnico
        refurbishedById: dto?.technicianId,
        refurbishmentNotes: dto?.notes,
        
        // Datos técnicos de potencia y voltaje
        measuredPowerWatts: dto?.measuredPowerWatts,
        measuredVoltage: dto?.measuredVoltage,
        
        // Estado de salud
        capacityRetainedPercent: dto?.capacityRetainedPercent,
        healthPercentage: dto?.healthPercentage,
        
        // Dimensiones
        dimensionLength: dto?.dimensionLength,
        dimensionWidth: dto?.dimensionWidth,
        dimensionHeight: dto?.dimensionHeight,
      },
    });

    this.logger.log(`Asset ${assetId} marked as LISTED_FOR_SALE with technical data`);
    this.logger.log(`Technical data: Power=${dto?.measuredPowerWatts}W, Voltage=${dto?.measuredVoltage}V, Health=${dto?.healthPercentage}%`);

    // No actualizar blockchain - el estado se mantendrá como REUSE_APPROVED desde la inspección
    // La blockchain se actualizará a SOLD cuando se complete la venta

    return {
      success: true,
      message: 'Panel marcado como listo para venta',
      asset: updatedAsset,
    };
  }
}
