import { PanelsMarketplaceService } from './panels-marketplace.service';
import { CreatePanelOrderDto, PanelOrderResponseDto, PanelDetailsDto } from './dto/panel-order.dto';
export declare class PanelsMarketplaceController {
    private panelsMarketplace;
    constructor(panelsMarketplace: PanelsMarketplaceService);
    getAvailablePanels(): Promise<PanelDetailsDto[]>;
    getMarketplaceStats(): Promise<{
        totalAvailable: number;
        totalSold: number;
        totalRevenue: number;
        averagePrice: number;
    }>;
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
    getPanelDetails(assetId: string): Promise<PanelDetailsDto>;
    purchasePanel(dto: CreatePanelOrderDto): Promise<PanelOrderResponseDto>;
}
