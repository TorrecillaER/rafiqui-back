import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';
export declare class ArtMarketplaceService {
    private prisma;
    private blockchainService;
    private readonly logger;
    constructor(prisma: PrismaService, blockchainService: BlockchainService);
    purchaseArt(dto: CreateArtOrderDto): Promise<ArtOrderResponseDto>;
    getAvailableArt(): Promise<({
        sourceAsset: {
            qrCode: string | null;
            brand: string | null;
            model: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        tokenId: string | null;
        soldAt: Date | null;
        buyerWallet: string | null;
        artist: string;
        price: number;
        currency: string;
        category: import(".prisma/client").$Enums.ArtCategory;
        imageUrl: string | null;
        isAvailable: boolean;
        sourceAssetId: string | null;
        contractAddress: string | null;
        updatedAt: Date;
    })[]>;
    getArtDetails(artPieceId: string): Promise<{
        sourceAsset: {
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
        } | null;
        orders: ({
            buyer: {
                email: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            completedAt: Date | null;
            buyerWallet: string;
            blockchainTxHash: string | null;
            price: number;
            buyerId: string | null;
            artPieceId: string;
            messageToArtist: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        tokenId: string | null;
        soldAt: Date | null;
        buyerWallet: string | null;
        artist: string;
        price: number;
        currency: string;
        category: import(".prisma/client").$Enums.ArtCategory;
        imageUrl: string | null;
        isAvailable: boolean;
        sourceAssetId: string | null;
        contractAddress: string | null;
        updatedAt: Date;
    }>;
    getArtOrderHistory(buyerId?: string): Promise<({
        artPiece: {
            title: string;
            tokenId: string | null;
            artist: string;
            imageUrl: string | null;
        };
        buyer: {
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        completedAt: Date | null;
        buyerWallet: string;
        blockchainTxHash: string | null;
        price: number;
        buyerId: string | null;
        artPieceId: string;
        messageToArtist: string | null;
    })[]>;
    getArtMarketplaceStats(): Promise<{
        totalAvailable: number;
        totalSold: number;
        totalRevenue: number;
        averagePrice: number;
        artByCategory: {
            category: import(".prisma/client").$Enums.ArtCategory;
            count: number;
        }[];
    }>;
}
