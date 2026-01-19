import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionResult } from '@prisma/client';
import { TriageEngineService } from './triage-engine.service';
import { BlockchainService } from '../blockchain/blockchain.service';
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
export declare class InspectionsService {
    private prisma;
    private triageEngine;
    private blockchainService;
    private readonly logger;
    constructor(prisma: PrismaService, triageEngine: TriageEngineService, blockchainService: BlockchainService);
    create(createInspectionDto: CreateInspectionDto): Promise<{
        aiRecommendation: import(".prisma/client").$Enums.InspectionResult;
        blockchainStatus: string;
        id: string;
        createdAt: Date;
        notes: string | null;
        inspectorId: string;
        measuredVoltage: number;
        assetId: string;
        measuredAmps: number;
        physicalCondition: string;
        photoUrl: string | null;
    }>;
    findAll(inspectorId?: string): Promise<({
        asset: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.AssetStatus;
            nfcTagId: string | null;
            qrCode: string | null;
            brand: string | null;
            model: string | null;
            collectionRequestId: string | null;
            inspectorId: string | null;
            inspectionStartedAt: Date | null;
            inspectedAt: Date | null;
            refurbishedById: string | null;
            refurbishedAt: Date | null;
            refurbishmentNotes: string | null;
            measuredPowerWatts: number | null;
            measuredVoltage: number | null;
            capacityRetainedPercent: number | null;
            healthPercentage: number | null;
            dimensionLength: number | null;
            dimensionWidth: number | null;
            dimensionHeight: number | null;
            tokenId: string | null;
            soldAt: Date | null;
            buyerWallet: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        inspectorId: string;
        measuredVoltage: number;
        assetId: string;
        measuredAmps: number;
        physicalCondition: string;
        photoUrl: string | null;
        aiRecommendation: import(".prisma/client").$Enums.InspectionResult;
    })[]>;
    findOne(id: string): Promise<({
        asset: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.AssetStatus;
            nfcTagId: string | null;
            qrCode: string | null;
            brand: string | null;
            model: string | null;
            collectionRequestId: string | null;
            inspectorId: string | null;
            inspectionStartedAt: Date | null;
            inspectedAt: Date | null;
            refurbishedById: string | null;
            refurbishedAt: Date | null;
            refurbishmentNotes: string | null;
            measuredPowerWatts: number | null;
            measuredVoltage: number | null;
            capacityRetainedPercent: number | null;
            healthPercentage: number | null;
            dimensionLength: number | null;
            dimensionWidth: number | null;
            dimensionHeight: number | null;
            tokenId: string | null;
            soldAt: Date | null;
            buyerWallet: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        inspectorId: string;
        measuredVoltage: number;
        assetId: string;
        measuredAmps: number;
        physicalCondition: string;
        photoUrl: string | null;
        aiRecommendation: import(".prisma/client").$Enums.InspectionResult;
    }) | null>;
    getStats(inspectorId: string): Promise<{
        total: number;
        reuse: number;
        recycle: number;
        art: number;
    }>;
    private updateBlockchainStatus;
    getInspectorStats(inspectorId: string): Promise<InspectorStats>;
    getRecentInspections(inspectorId: string, limit?: number): Promise<RecentInspectionDto[]>;
    getInspectorStatsByEmail(email: string): Promise<InspectorStats>;
}
