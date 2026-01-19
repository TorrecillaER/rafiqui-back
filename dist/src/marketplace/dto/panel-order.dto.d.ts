export declare enum PanelPurchaseDestination {
    RESIDENTIAL = "RESIDENTIAL",
    COMMERCIAL = "COMMERCIAL",
    INDUSTRIAL = "INDUSTRIAL",
    RESEARCH = "RESEARCH",
    RESALE = "RESALE",
    OTHER = "OTHER"
}
export declare class CreatePanelOrderDto {
    assetId: string;
    buyerWallet: string;
    destination: PanelPurchaseDestination;
    destinationNotes?: string;
    buyerId?: string;
}
export declare class PanelOrderResponseDto {
    success: boolean;
    message: string;
    order: {
        id: string;
        assetId: string;
        tokenId: string;
        price: number;
        blockchainTxHash: string | null;
    };
}
export declare class PanelDetailsDto {
    id: string;
    qrCode: string;
    brand: string;
    model: string;
    status: string;
    tokenId: string;
    price: number;
    measuredPowerWatts: number;
    measuredVoltage: number;
    healthPercentage: number;
    capacityRetainedPercent: number;
    dimensionLength: number;
    dimensionWidth: number;
    dimensionHeight: number;
    refurbishedAt: Date;
}
