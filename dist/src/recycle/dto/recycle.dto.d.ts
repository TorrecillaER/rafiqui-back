export declare class ProcessRecycleDto {
    assetId: string;
    operatorId?: string;
    panelWeightKg?: number;
    notes?: string;
}
export declare class RecycleResponseDto {
    success: boolean;
    message: string;
    recycleRecord: {
        id: string;
        assetId: string;
        panelWeightKg: number;
        materials: {
            aluminum: number;
            glass: number;
            silicon: number;
            copper: number;
        };
        blockchainTxHash: string | null;
        materialsTxHash: string | null;
        tokensMinted: {
            aluminum: number;
            glass: number;
            silicon: number;
            copper: number;
        };
    };
    updatedStock: {
        aluminum: number;
        glass: number;
        silicon: number;
        copper: number;
    };
}
export declare class MaterialStockDto {
    type: string;
    name: string;
    totalKg: number;
    availableKg: number;
    pricePerKg: number;
}
export declare class MaterialBalancesDto {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
}
