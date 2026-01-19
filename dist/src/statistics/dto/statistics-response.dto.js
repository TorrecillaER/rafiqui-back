"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendArtPieceDto = exports.MaterialStockDto = exports.MarketAssetDto = exports.DashboardStatsDto = exports.MaterialDistributionDto = exports.MonthlyDataDto = exports.ESGMetricsDto = void 0;
const openapi = require("@nestjs/swagger");
class ESGMetricsDto {
    co2Saved;
    treesEquivalent;
    energySaved;
    waterSaved;
    panelsRecycled;
    panelsReused;
    panelsRecycledMaterial;
    static _OPENAPI_METADATA_FACTORY() {
        return { co2Saved: { required: true, type: () => Number }, treesEquivalent: { required: true, type: () => Number }, energySaved: { required: true, type: () => Number }, waterSaved: { required: true, type: () => Number }, panelsRecycled: { required: true, type: () => Number }, panelsReused: { required: true, type: () => Number }, panelsRecycledMaterial: { required: true, type: () => Number } };
    }
}
exports.ESGMetricsDto = ESGMetricsDto;
class MonthlyDataDto {
    month;
    co2;
    panels;
    energy;
    static _OPENAPI_METADATA_FACTORY() {
        return { month: { required: true, type: () => String }, co2: { required: true, type: () => Number }, panels: { required: true, type: () => Number }, energy: { required: true, type: () => Number } };
    }
}
exports.MonthlyDataDto = MonthlyDataDto;
class MaterialDistributionDto {
    name;
    value;
    color;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, value: { required: true, type: () => Number }, color: { required: true, type: () => String } };
    }
}
exports.MaterialDistributionDto = MaterialDistributionDto;
class DashboardStatsDto {
    esgMetrics;
    monthlyData;
    materialDistribution;
    static _OPENAPI_METADATA_FACTORY() {
        return { esgMetrics: { required: true, type: () => require("./statistics-response.dto").ESGMetricsDto }, monthlyData: { required: true, type: () => [require("./statistics-response.dto").MonthlyDataDto] }, materialDistribution: { required: true, type: () => [require("./statistics-response.dto").MaterialDistributionDto] } };
    }
}
exports.DashboardStatsDto = DashboardStatsDto;
class MarketAssetDto {
    id;
    nfcTagId;
    brand;
    model;
    status;
    inspectionResult;
    measuredVoltage;
    measuredAmps;
    photoUrl;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, nfcTagId: { required: true, type: () => String }, brand: { required: true, type: () => String }, model: { required: true, type: () => String }, status: { required: true, type: () => String }, inspectionResult: { required: true, type: () => String }, measuredVoltage: { required: true, type: () => Number }, measuredAmps: { required: true, type: () => Number }, photoUrl: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
}
exports.MarketAssetDto = MarketAssetDto;
class MaterialStockDto {
    type;
    name;
    quantity;
    pricePerTon;
    available;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => String }, name: { required: true, type: () => String }, quantity: { required: true, type: () => Number }, pricePerTon: { required: true, type: () => Number }, available: { required: true, type: () => Boolean } };
    }
}
exports.MaterialStockDto = MaterialStockDto;
class BackendArtPieceDto {
    id;
    title;
    artist;
    description;
    price;
    currency;
    category;
    imageUrl;
    isAvailable;
    tokenId;
    sourceAssetId;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, artist: { required: true, type: () => String }, description: { required: true, type: () => String }, price: { required: true, type: () => Number }, currency: { required: true, type: () => String }, category: { required: true, type: () => Object }, imageUrl: { required: true, type: () => String }, isAvailable: { required: true, type: () => Boolean }, tokenId: { required: true, type: () => String, nullable: true }, sourceAssetId: { required: true, type: () => String, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
}
exports.BackendArtPieceDto = BackendArtPieceDto;
//# sourceMappingURL=statistics-response.dto.js.map