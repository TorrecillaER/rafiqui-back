import { PrismaService } from '../prisma/prisma.service';
import { ESGMetricsDto, DashboardStatsDto, MonthlyDataDto, MaterialDistributionDto, MarketAssetDto, MaterialStockDto } from './dto/statistics-response.dto';
export declare class StatisticsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly CO2_PER_PANEL;
    private readonly TREES_PER_PANEL;
    private readonly ENERGY_PER_PANEL;
    private readonly WATER_PER_PANEL;
    getESGMetrics(): Promise<ESGMetricsDto>;
    getMonthlyData(): Promise<MonthlyDataDto[]>;
    getMaterialDistribution(): Promise<MaterialDistributionDto[]>;
    getDashboardStats(): Promise<DashboardStatsDto>;
    getAvailableAssets(): Promise<MarketAssetDto[]>;
    getMaterialStock(): Promise<MaterialStockDto[]>;
    getCollectionStats(): Promise<{
        total: number;
        pending: number;
        completed: number;
        inProgress: number;
    }>;
    getArt(): Promise<{
        id: string;
        title: string;
        artist: string;
        description: string;
        price: number;
        currency: string;
        category: import(".prisma/client").$Enums.ArtCategory;
        imageUrl: string;
        isAvailable: boolean;
        tokenId: string | null;
        sourceAssetId: string | null;
        createdAt: Date;
    }[]>;
}
