export class ESGMetricsDto {
  co2Saved: number;           // kg de CO2 ahorrado
  treesEquivalent: number;    // Árboles equivalentes
  energySaved: number;        // kWh recuperados
  waterSaved: number;         // Litros de agua ahorrados
  panelsRecycled: number;     // Total de paneles procesados
  panelsReused: number;       // Paneles para reuso
  panelsRecycledMaterial: number; // Paneles triturados
}

export class MonthlyDataDto {
  month: string;
  co2: number;
  panels: number;
  energy: number;
}

export class MaterialDistributionDto {
  name: string;
  value: number;
  color: string;
}

export class DashboardStatsDto {
  esgMetrics: ESGMetricsDto;
  monthlyData: MonthlyDataDto[];
  materialDistribution: MaterialDistributionDto[];
}

export class MarketAssetDto {
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

export class MaterialStockDto {
  type: string;
  name: string;
  quantity: number;      // toneladas
  pricePerTon: number;   // USD
  available: boolean;
}

export class BackendArtPieceDto {
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
