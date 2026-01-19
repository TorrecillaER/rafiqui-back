export declare class ESGMetricsDto {
    co2Saved: number;
    treesEquivalent: number;
    energySaved: number;
    waterSaved: number;
    panelsRecycled: number;
    panelsReused: number;
    panelsRecycledMaterial: number;
}
export declare class MonthlyDataDto {
    month: string;
    co2: number;
    panels: number;
    energy: number;
}
export declare class MaterialDistributionDto {
    name: string;
    value: number;
    color: string;
}
export declare class DashboardStatsDto {
    esgMetrics: ESGMetricsDto;
    monthlyData: MonthlyDataDto[];
    materialDistribution: MaterialDistributionDto[];
}
export declare class MarketAssetDto {
    id: string;
    nfcTagId: string;
    brand: string;
    model: string;
    status: string;
    inspectionResult: string;
    measuredVoltage: number;
    measuredAmps: number;
    photoUrl: string;
    createdAt: Date;
}
export declare class MaterialStockDto {
    type: string;
    name: string;
    quantity: number;
    pricePerTon: number;
    available: boolean;
}
export declare class BackendArtPieceDto {
    id: string;
    title: string;
    artist: string;
    description: string;
    price: number;
    currency: string;
    category: 'NFT' | 'SCULPTURE' | 'INSTALLATION';
    imageUrl: string;
    isAvailable: boolean;
    tokenId: string | null;
    sourceAssetId: string | null;
    createdAt: Date;
}
