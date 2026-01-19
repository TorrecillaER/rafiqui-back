import { PrismaService } from '../prisma/prisma.service';
export interface DashboardMetrics {
    co2Saved: {
        value: number;
        unit: string;
        breakdown: {
            fromEnergy: number;
            fromRecycling: number;
        };
    };
    treesEquivalent: {
        value: number;
        description: string;
    };
    energyRecovered: {
        value: number;
        unit: string;
        homesPerYear: number;
    };
    waterSaved: {
        value: number;
        unit: string;
        breakdown: {
            fromEnergy: number;
            fromRecycling: number;
        };
    };
    panelsProcessed: {
        total: number;
        reused: number;
        recycled: number;
        art: number;
    };
}
export interface ChartDataPoint {
    month: string;
    value: number;
}
export interface MaterialDistributionItem {
    name: string;
    value: number;
    color: string;
}
export interface DashboardCharts {
    co2ByMonth: ChartDataPoint[];
    materialDistribution: MaterialDistributionItem[];
    panelsByMonth: ChartDataPoint[];
    energyByMonth: ChartDataPoint[];
}
export declare class DashboardMetricsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculateMetrics(): Promise<DashboardMetrics>;
    private calculateEnergyGenerated;
    calculateCharts(): Promise<DashboardCharts>;
    private initializeMonthlyData;
    private getMonthIndex;
    private calculateMaterialDistribution;
}
