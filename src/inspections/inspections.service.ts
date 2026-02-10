import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { AssetStatus, InspectionResult } from '@prisma/client';
import { TriageEngineService } from './triage-engine.service';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';

export interface InspectorStats {
  recyclingCount: number;
  reuseCount: number;
  artCount: number;
  totalInspections: number;
  monthlyGoalProgress: number;
  impactHighlight: string;
  impactMessage: string;
  inspectorName: string;
  stationId: string;
}

export interface RecentInspectionDto {
  id: string;
  panelId: string;
  panelType: string;
  status: 'approved' | 'rejected' | 'inReview';
  result: InspectionResult;
  inspectedAt: Date;
}

@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name);

  constructor(
    private prisma: PrismaService,
    private triageEngine: TriageEngineService,
    private blockchainService: BlockchainService,
  ) {}

  async create(createInspectionDto: CreateInspectionDto) {
    const { assetId, inspectorId, measuredVoltage, measuredAmps, physicalCondition, photoUrl, notes, aiRecommendation } = createInspectionDto;

    // Obtener el asset para tener el qrCode
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error('Asset no encontrado');
    }

    // Determinar nuevo estado del asset y estado de blockchain
    let newAssetStatus: AssetStatus;
    let blockchainStatus: PanelStatus;

    switch (aiRecommendation) {
      case InspectionResult.REUSE:
        newAssetStatus = AssetStatus.READY_FOR_REUSE;
        blockchainStatus = PanelStatus.REUSE_APPROVED;
        break;
      case InspectionResult.RECYCLE:
        // El panel queda como INSPECTED con recomendación RECYCLE
        // El estado RECYCLED se asigna cuando se completa el proceso de reciclaje
        newAssetStatus = AssetStatus.INSPECTED;
        blockchainStatus = PanelStatus.RECYCLE_APPROVED;
        break;
      case InspectionResult.ART:
        newAssetStatus = AssetStatus.ART_CANDIDATE;
        blockchainStatus = PanelStatus.ART_APPROVED;
        break;
      default:
        newAssetStatus = AssetStatus.INSPECTED;
        blockchainStatus = PanelStatus.INSPECTED;
    }

    // Transacción en base de datos
    const inspection = await this.prisma.$transaction(async (prisma) => {
      const newInspection = await prisma.inspection.create({
        data: {
          assetId,
          inspectorId,
          measuredVoltage,
          measuredAmps,
          physicalCondition,
          photoUrl,
          notes,
          aiRecommendation,
        },
      });

      await prisma.asset.update({
        where: { id: assetId },
        data: { 
          status: newAssetStatus,
          inspectedAt: new Date(),
          inspectorId: inspectorId,
        },
      });

      return newInspection;
    });

    // Registrar en blockchain (asíncrono, no bloquea)
    this.updateBlockchainStatus(
      asset.qrCode || asset.nfcTagId || asset.id,
      blockchainStatus,
      inspectorId
    ).catch(err => {
      this.logger.error(`Failed to update blockchain for asset ${assetId}`, err);
    });

    return {
      ...inspection,
      aiRecommendation,
      blockchainStatus: PanelStatus[blockchainStatus],
    };
  }

  async findAll(inspectorId?: string) {
    const where: any = {};
    
    if (inspectorId) {
      where.inspectorId = inspectorId;
    }

    return this.prisma.inspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.inspection.findUnique({
      where: { id },
      include: {
        asset: true,
      },
    });
  }

  async getStats(inspectorId: string) {
    const inspections = await this.prisma.inspection.findMany({
      where: { inspectorId },
    });

    const total = inspections.length;
    const reuse = inspections.filter(i => i.aiRecommendation === InspectionResult.REUSE).length;
    const recycle = inspections.filter(i => i.aiRecommendation === InspectionResult.RECYCLE).length;
    const art = inspections.filter(i => i.aiRecommendation === InspectionResult.ART).length;

    return {
      total,
      reuse,
      recycle,
      art,
    };
  }

  /**
   * Actualiza el estado del panel en la blockchain
   */
  private async updateBlockchainStatus(
    identifier: string,
    status: PanelStatus,
    inspectorId: string,
  ): Promise<void> {
    if (!this.blockchainService.isConnected()) {
      this.logger.warn('Blockchain not connected, skipping status update');
      return;
    }

    try {
      // Primero marcar como INSPECTED
      await this.blockchainService.updatePanelStatus(
        identifier,
        PanelStatus.INSPECTED,
        'Planta de Inspección',
        ''
      );
      this.logger.log(`Panel ${identifier} marked as INSPECTED in blockchain`);

      // Si el resultado no es solo INSPECTED, actualizar al estado final
      if (status !== PanelStatus.INSPECTED) {
        await this.blockchainService.updatePanelStatus(
          identifier,
          status,
          'Planta de Inspección',
          ''
        );
        this.logger.log(`Panel ${identifier} status updated to ${PanelStatus[status]} in blockchain`);
      }
    } catch (error) {
      this.logger.error(`Blockchain update failed for ${identifier}`, error);
      throw error;
    }
  }

  async getInspectorStats(inspectorId: string): Promise<InspectorStats> {
    // Verificar que el inspector existe
    const inspector = await this.prisma.user.findUnique({
      where: { id: inspectorId },
      select: { id: true, name: true },
    });

    if (!inspector) {
      throw new NotFoundException(`Inspector con ID ${inspectorId} no encontrado`);
    }

    // Contar inspecciones por resultado
    const [recyclingCount, reuseCount, artCount] = await Promise.all([
      this.prisma.inspection.count({
        where: {
          inspectorId,
          aiRecommendation: InspectionResult.RECYCLE,
        },
      }),
      this.prisma.inspection.count({
        where: {
          inspectorId,
          aiRecommendation: InspectionResult.REUSE,
        },
      }),
      this.prisma.inspection.count({
        where: {
          inspectorId,
          aiRecommendation: InspectionResult.ART,
        },
      }),
    ]);

    const totalInspections = recyclingCount + reuseCount + artCount;

    // Calcular progreso de meta mensual (ejemplo: meta de 200 inspecciones/mes)
    const monthlyGoal = 200;
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthCount = await this.prisma.inspection.count({
      where: {
        inspectorId,
        createdAt: { gte: currentMonth },
      },
    });

    const monthlyGoalProgress = Math.min(thisMonthCount / monthlyGoal, 1);

    // Calcular impacto (basado en materiales reciclados)
    const recycleRecords = await this.prisma.recycleRecord.findMany({
      where: {
        asset: {
          inspection: {
            inspectorId,
          },
        },
      },
      select: {
        glassKg: true,
        aluminumKg: true,
      },
    });

    const totalGlassKg = recycleRecords.reduce((sum, r) => sum + r.glassKg, 0);
    const totalAluminumKg = recycleRecords.reduce((sum, r) => sum + r.aluminumKg, 0);

    // Generar mensaje de impacto
    let impactHighlight = '';
    let impactMessage = '';

    if (totalGlassKg >= 1000) {
      const tons = (totalGlassKg / 1000).toFixed(1);
      impactHighlight = `${tons} toneladas`;
      impactMessage = 'de vidrio recuperado han sido donadas para generar cemento en zonas vulnerables.';
    } else if (totalAluminumKg >= 100) {
      impactHighlight = `${Math.round(totalAluminumKg)} kg`;
      impactMessage = 'de aluminio reciclado, equivalente a evitar la extraccion de bauxita.';
    } else if (totalInspections > 0) {
      impactHighlight = `${totalInspections} paneles`;
      impactMessage = 'inspeccionados contribuyendo a la economia circular de energia solar.';
    } else {
      impactHighlight = 'Comienza hoy!';
      impactMessage = 'Cada panel que inspecciones contribuye al medio ambiente.';
    }

    // Generar ID de estacion basado en el inspector
    const stationId = `#${(inspectorId.charCodeAt(0) % 10).toString().padStart(2, '0')}`;

    return {
      recyclingCount,
      reuseCount,
      artCount,
      totalInspections,
      monthlyGoalProgress,
      impactHighlight,
      impactMessage,
      inspectorName: inspector.name,
      stationId,
    };
  }

  async getRecentInspections(inspectorId: string, limit: number = 10): Promise<RecentInspectionDto[]> {
    const inspections = await this.prisma.inspection.findMany({
      where: { inspectorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        asset: {
          select: {
            id: true,
            brand: true,
            model: true,
            status: true,
          },
        },
      },
    });

    return inspections.map((inspection) => {
      // Determinar status basado en el estado del asset
      let status: 'approved' | 'rejected' | 'inReview' = 'inReview';
      const assetStatus = inspection.asset.status;
      
      if (['RECYCLED', 'REUSED', 'LISTED_FOR_SALE', 'ART_LISTED_FOR_SALE'].includes(assetStatus)) {
        status = 'approved';
      } else if (assetStatus === 'INSPECTED' || assetStatus === 'READY_FOR_REUSE' || assetStatus === 'REFURBISHING') {
        status = 'approved';
      } else if (assetStatus === 'INSPECTING') {
        status = 'inReview';
      }

      // Generar tipo de panel
      const brand = inspection.asset.brand || 'Panel Solar';
      const model = inspection.asset.model || '';
      const panelType = model ? `${brand} ${model}` : brand;

      // Generar ID corto
      const shortId = `ID-${inspection.id.substring(0, 4).toUpperCase()}`;

      return {
        id: shortId,
        panelId: inspection.asset.id,
        panelType,
        status,
        result: inspection.aiRecommendation,
        inspectedAt: inspection.createdAt,
      };
    });
  }

  async getInspectorStatsByEmail(email: string): Promise<InspectorStats> {
    const inspector = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!inspector) {
      throw new NotFoundException(`Inspector con email ${email} no encontrado`);
    }

    return this.getInspectorStats(inspector.id);
  }
}
