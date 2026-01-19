import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MaterialsBlockchainService } from '../blockchain/materials-blockchain.service';
import { ProcessRecycleDto, RecycleResponseDto, MaterialStockDto } from './dto/recycle.dto';
export declare class RecycleService {
    private prisma;
    private blockchainService;
    private materialsBlockchainService;
    private readonly logger;
    constructor(prisma: PrismaService, blockchainService: BlockchainService, materialsBlockchainService: MaterialsBlockchainService);
    processRecycle(dto: ProcessRecycleDto): Promise<RecycleResponseDto>;
    private upsertMaterialStock;
    getMaterialStock(): Promise<MaterialStockDto[]>;
    getTreasuryBalances(): Promise<import("../blockchain/materials-blockchain.service").MaterialBalances>;
    getWalletBalances(walletAddress: string): Promise<import("../blockchain/materials-blockchain.service").MaterialBalances>;
    findAssetForRecycle(qrCode: string): Promise<{
        asset: {
            inspection: {
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
            } | null;
            recycleRecord: {
                id: string;
                createdAt: Date;
                ipfsHash: string | null;
                blockchainTxHash: string | null;
                aluminumKg: number;
                glassKg: number;
                siliconKg: number;
                copperKg: number;
                assetId: string;
                operatorId: string;
                panelWeightKg: number;
                materialsTxHash: string | null;
            } | null;
        } & {
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
        canRecycle: boolean;
        reason: string;
    } | null>;
    getRecycleHistory(limit?: number): Promise<({
        asset: {
            id: string;
            qrCode: string | null;
            brand: string | null;
            model: string | null;
        };
        operator: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        ipfsHash: string | null;
        blockchainTxHash: string | null;
        aluminumKg: number;
        glassKg: number;
        siliconKg: number;
        copperKg: number;
        assetId: string;
        operatorId: string;
        panelWeightKg: number;
        materialsTxHash: string | null;
    })[]>;
}
