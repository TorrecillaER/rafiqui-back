import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetStatus } from '@prisma/client';
import {
  ESGMetricsDto,
  DashboardStatsDto,
  MonthlyDataDto,
  MaterialDistributionDto,
  MarketAssetDto,
  MaterialStockDto,
} from './dto/statistics-response.dto';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  // Constantes para cálculos ESG
  private readonly CO2_PER_PANEL = 17.8;      // kg CO2 por panel
  private readonly TREES_PER_PANEL = 0.89;    // árboles equivalentes
  private readonly ENERGY_PER_PANEL = 49.2;   // kWh
  private readonly WATER_PER_PANEL = 350;     // litros

  async getESGMetrics(): Promise<ESGMetricsDto> {
    const totalPanels = await this.prisma.asset.count();
    const reusedPanels = await this.prisma.asset.count({
      where: { status: AssetStatus.REUSED },
    });
    const recycledPanels = await this.prisma.asset.count({
      where: { status: AssetStatus.RECYCLED },
    });

    return {
      co2Saved: Math.round(totalPanels * this.CO2_PER_PANEL),
      treesEquivalent: Math.round(totalPanels * this.TREES_PER_PANEL),
      energySaved: Math.round(totalPanels * this.ENERGY_PER_PANEL),
      waterSaved: Math.round(totalPanels * this.WATER_PER_PANEL),
      panelsRecycled: totalPanels,
      panelsReused: reusedPanels,
      panelsRecycledMaterial: recycledPanels,
    };
  }

  async getMonthlyData(): Promise<MonthlyDataDto[]> {
    // Obtener datos de los últimos 12 meses
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    
    const monthlyData: MonthlyDataDto[] = [];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const year = new Date().getFullYear() - (currentMonth - 11 + i < 0 ? 1 : 0);
      
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);

      // Usamos any para evitar problemas de tipos con createdAt si el cliente no está actualizado
      const whereClause: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      const panelsCount = await this.prisma.asset.count({
        where: whereClause,
      });

      monthlyData.push({
        month: months[monthIndex],
        panels: panelsCount,
        co2: Math.round(panelsCount * this.CO2_PER_PANEL),
        energy: Math.round(panelsCount * this.ENERGY_PER_PANEL),
      });
    }

    return monthlyData;
  }

  async getMaterialDistribution(): Promise<MaterialDistributionDto[]> {
    // Distribución típica de materiales en paneles solares
    const totalPanels = await this.prisma.asset.count({
      where: { status: AssetStatus.RECYCLED },
    });

    // Porcentajes aproximados de materiales en un panel solar
    return [
      { name: 'Aluminio', value: 35, color: '#94A3B8' },
      { name: 'Vidrio', value: 40, color: '#22D3EE' },
      { name: 'Silicio', value: 15, color: '#A78BFA' },
      { name: 'Cobre', value: 10, color: '#F97316' },
    ];
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [esgMetrics, monthlyData, materialDistribution] = await Promise.all([
      this.getESGMetrics(),
      this.getMonthlyData(),
      this.getMaterialDistribution(),
    ]);

    return {
      esgMetrics,
      monthlyData,
      materialDistribution,
    };
  }

  // Marketplace: Assets disponibles para reuso
  async getAvailableAssets(): Promise<MarketAssetDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        status: { in: [AssetStatus.WAREHOUSE_RECEIVED, AssetStatus.INSPECTED] },
      },
      include: {
        inspection: true,
      },
      orderBy: { createdAt: 'desc' } as any,
    });

    return assets.map((asset: any) => ({
      id: asset.id,
      nfcTagId: asset.nfcTagId || '',
      brand: asset.brand || 'Desconocido',
      model: asset.model || 'Genérico',
      status: asset.status,
      inspectionResult: asset.inspection?.aiRecommendation || 'PENDING',
      measuredVoltage: asset.inspection?.measuredVoltage || 0,
      measuredAmps: asset.inspection?.measuredAmps || 0,
      photoUrl: asset.inspection?.photoUrl || '',
      createdAt: asset.createdAt,
    }));
  }

  // Marketplace: Stock de materiales reciclados
  async getMaterialStock(): Promise<MaterialStockDto[]> {
    const recycledCount = await this.prisma.asset.count({
      where: { status: AssetStatus.RECYCLED },
    });

    // Peso promedio de un panel: ~20kg
    const totalWeight = recycledCount * 20; // kg
    const totalTons = totalWeight / 1000;

    return [
      {
        type: 'aluminum',
        name: 'Aluminio Reciclado',
        quantity: Math.round(totalTons * 0.35 * 10) / 10,
        pricePerTon: 2800,
        available: true,
      },
      {
        type: 'glass',
        name: 'Vidrio Solar Premium',
        quantity: Math.round(totalTons * 0.40 * 10) / 10,
        pricePerTon: 450,
        available: true,
      },
      {
        type: 'silicon',
        name: 'Silicio Purificado',
        quantity: Math.round(totalTons * 0.15 * 10) / 10,
        pricePerTon: 15000,
        available: true,
      },
      {
        type: 'copper',
        name: 'Cobre Recuperado',
        quantity: Math.round(totalTons * 0.10 * 10) / 10,
        pricePerTon: 8500,
        available: recycledCount > 10,
      },
    ];
  }

  // Estadísticas de solicitudes de recolección
  async getCollectionStats() {
    const total = await this.prisma.collectionRequest.count();
    const pending = await this.prisma.collectionRequest.count({
      where: { status: 'PENDING' },
    });
    const completed = await this.prisma.collectionRequest.count({
      where: { status: 'COMPLETED' },
    });

    return {
      total,
      pending,
      completed,
      inProgress: total - pending - completed,
    };
  }

  // Marketplace: Obras de arte
  async getArt() {
    const artPieces = await this.prisma.artPiece.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: 'desc' },
    });

    return artPieces.map((piece) => ({
      id: piece.id,
      title: piece.title,
      artist: piece.artist,
      description: piece.description,
      price: piece.price,
      currency: piece.currency,
      category: piece.category,
      imageUrl: piece.imageUrl || '',
      isAvailable: piece.isAvailable,
      tokenId: piece.tokenId,
      sourceAssetId: piece.sourceAssetId,
      createdAt: piece.createdAt,
    }));
  }
}
