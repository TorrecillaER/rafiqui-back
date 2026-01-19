import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreatePanelOrderDto, PanelOrderResponseDto, PanelDetailsDto } from './dto/panel-order.dto';
export declare class PanelsMarketplaceService {
    private prisma;
    private blockchainService;
    private readonly logger;
    constructor(prisma: PrismaService, blockchainService: BlockchainService);
    purchasePanel(dto: CreatePanelOrderDto): Promise<PanelOrderResponseDto>;
    private calculatePanelPrice;
    getAvailablePanels(): Promise<PanelDetailsDto[]>;
    getPanelDetails(assetId: string): Promise<PanelDetailsDto>;
    getPanelOrderHistory(buyerId?: string): Promise<({
        asset: {
            qrCode: string | null;
            brand: string | null;
            model: string | null;
            tokenId: string | null;
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
        assetId: string;
        price: number;
        buyerId: string | null;
        destination: import(".prisma/client").$Enums.PanelPurchaseDestination;
        destinationNotes: string | null;
    })[]>;
    getMarketplaceStats(): Promise<{
        totalAvailable: number;
        totalSold: number;
        totalRevenue: number;
        averagePrice: number;
    }>;
}
