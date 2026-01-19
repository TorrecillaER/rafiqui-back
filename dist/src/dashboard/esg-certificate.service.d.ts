import { PrismaService } from '../prisma/prisma.service';
import { DashboardMetricsService, DashboardMetrics } from './dashboard-metrics.service';
import { BlockchainService } from '../blockchain/blockchain.service';
export interface PanelJourney {
    panelId: string;
    nfcTagId: string | null;
    collectionAddress: string;
    transactions: {
        type: 'INSPECTION' | 'REFURBISHMENT' | 'RECYCLE' | 'MATERIAL_MINT' | 'PANEL_SALE' | 'ART_CREATION' | 'ART_SALE';
        txHash: string;
        timestamp: Date;
        details?: string;
    }[];
    finalDestination: 'RECICLAJE' | 'REUTILIZACIÓN' | 'ARTE';
    destinationDetails?: string;
}
export interface BlockchainVerification {
    totalTransactions: number;
    panelJourneys: PanelJourney[];
    contractAddresses: string[];
    verificationUrl: string;
    artDonationsCount: number;
}
export interface CertificateData {
    certificateId: string;
    issuedAt: Date;
    partnerName: string;
    partnerEmail: string;
    metrics: DashboardMetrics;
    blockchain: BlockchainVerification;
}
export declare class EsgCertificateService {
    private prisma;
    private dashboardMetricsService;
    private blockchainService;
    private readonly logger;
    constructor(prisma: PrismaService, dashboardMetricsService: DashboardMetricsService, blockchainService: BlockchainService);
    generateCertificate(userId?: string): Promise<Buffer>;
    private getBlockchainVerification;
    private createPDF;
    private drawMetricBox;
    private mapPanelStatusToTransactionType;
    private getPanelStatusLabel;
}
