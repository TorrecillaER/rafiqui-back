export declare enum MaterialDestination {
    MANUFACTURING = "MANUFACTURING",
    CONSTRUCTION = "CONSTRUCTION",
    RESEARCH = "RESEARCH",
    RECYCLING_CENTER = "RECYCLING_CENTER",
    OTHER = "OTHER"
}
export declare class CreateMaterialOrderDto {
    buyerId: string;
    materialType: string;
    quantityKg: number;
    buyerWallet: string;
    destination: MaterialDestination;
    destinationNotes?: string;
}
export declare class MaterialOrderResponseDto {
    success: boolean;
    message: string;
    order: {
        id: string;
        materialType: string;
        quantityKg: number;
        totalPrice: number;
        status: string;
        blockchainTxHash: string | null;
        tokensTransferred: number;
    };
}
export declare class MaterialAvailabilityDto {
    type: string;
    name: string;
    availableKg: number;
    availableTokens: number;
    pricePerKg: number;
    totalValue: number;
}
