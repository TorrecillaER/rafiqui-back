import { PrismaService } from '../prisma/prisma.service';
import { DashboardMetricsService, DashboardMetrics, DashboardCharts } from './dashboard-metrics.service';
export interface FullReportData {
    reportId: string;
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    metrics: DashboardMetrics;
    charts: DashboardCharts;
    panelsByStatus: {
        status: string;
        count: number;
    }[];
    panelsByBrand: {
        brand: string;
        count: number;
    }[];
    materialsDetail: {
        type: string;
        totalKg: number;
        availableKg: number;
        soldKg: number;
        estimatedValue: number;
    }[];
    collectionStats: {
        total: number;
        pending: number;
        completed: number;
        inProgress: number;
    };
    recentTransactions: {
        type: string;
        id: string;
        date: Date;
        blockchainTxHash: string | null;
    }[];
    ordersSummary: {
        materialOrders: {
            total: number;
            completed: number;
            totalValue: number;
        };
        panelOrders: {
            total: number;
            completed: number;
            totalValue: number;
        };
        artOrders: {
            total: number;
            completed: number;
            totalValue: number;
        };
    };
}
export declare class FullReportService {
    private prisma;
    private dashboardMetricsService;
    private readonly logger;
    constructor(prisma: PrismaService, dashboardMetricsService: DashboardMetricsService);
    generateReport(): Promise<Buffer>;
    private gatherReportData;
    private createPDF;
    private renderCoverPage;
    private renderPanelsDetailPage;
    private renderMaterialsPage;
    private renderHistoricalDataPage;
    private renderOperationsPage;
    private renderMethodologyPage;
    private drawSummaryBox;
    private drawTable;
}
