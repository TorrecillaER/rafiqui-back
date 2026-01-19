import { StatisticsService } from './statistics.service';
import { DashboardStatsDto, ESGMetricsDto, MarketAssetDto, MaterialStockDto } from './dto/statistics-response.dto';
export declare class StatisticsController {
    private readonly statisticsService;
    constructor(statisticsService: StatisticsService);
    getDashboardStats(): Promise<DashboardStatsDto>;
    getESGMetrics(): Promise<ESGMetricsDto>;
    getMonthlyData(): Promise<import("./dto/statistics-response.dto").MonthlyDataDto[]>;
    getMaterialDistribution(): Promise<import("./dto/statistics-response.dto").MaterialDistributionDto[]>;
    getAvailableAssets(): Promise<MarketAssetDto[]>;
    getMaterialStock(): Promise<MaterialStockDto[]>;
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
    getCollectionStats(): Promise<{
        total: number;
        pending: number;
        completed: number;
        inProgress: number;
    }>;
}
