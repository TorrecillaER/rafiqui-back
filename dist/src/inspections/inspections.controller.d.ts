import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
export declare class InspectionsController {
    private readonly inspectionsService;
    constructor(inspectionsService: InspectionsService);
    create(createInspectionDto: CreateInspectionDto, user: any): Promise<{
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
    findAll(myInspections?: string, user?: any): Promise<({
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
    getMyStats(user: any): Promise<{
        total: number;
        reuse: number;
        recycle: number;
        art: number;
    }>;
    getInspectorStats(inspectorId: string): Promise<import("./inspections.service").InspectorStats>;
    getInspectorStatsByEmail(email: string): Promise<import("./inspections.service").InspectorStats>;
    getRecentInspections(inspectorId: string, limit?: string): Promise<import("./inspections.service").RecentInspectionDto[]>;
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
}
