"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const statistics_service_1 = require("./statistics.service");
const swagger_1 = require("@nestjs/swagger");
const statistics_response_dto_1 = require("./dto/statistics-response.dto");
let StatisticsController = class StatisticsController {
    statisticsService;
    constructor(statisticsService) {
        this.statisticsService = statisticsService;
    }
    async getDashboardStats() {
        return this.statisticsService.getDashboardStats();
    }
    async getESGMetrics() {
        return this.statisticsService.getESGMetrics();
    }
    async getMonthlyData() {
        return this.statisticsService.getMonthlyData();
    }
    async getMaterialDistribution() {
        return this.statisticsService.getMaterialDistribution();
    }
    async getAvailableAssets() {
        return this.statisticsService.getAvailableAssets();
    }
    async getMaterialStock() {
        return this.statisticsService.getMaterialStock();
    }
    async getArt() {
        return this.statisticsService.getArt();
    }
    async getCollectionStats() {
        return this.statisticsService.getCollectionStats();
    }
};
exports.StatisticsController = StatisticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas generales para el dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: statistics_response_dto_1.DashboardStatsDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/statistics-response.dto").DashboardStatsDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('esg'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener métricas ESG específicas' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: statistics_response_dto_1.ESGMetricsDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/statistics-response.dto").ESGMetricsDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getESGMetrics", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener datos mensuales históricos' }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/statistics-response.dto").MonthlyDataDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getMonthlyData", null);
__decorate([
    (0, common_1.Get)('materials'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener distribución de materiales en paneles' }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/statistics-response.dto").MaterialDistributionDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getMaterialDistribution", null);
__decorate([
    (0, common_1.Get)('market/assets'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener assets disponibles para el marketplace' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [statistics_response_dto_1.MarketAssetDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/statistics-response.dto").MarketAssetDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getAvailableAssets", null);
__decorate([
    (0, common_1.Get)('market/materials'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener stock de materiales reciclados' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [statistics_response_dto_1.MaterialStockDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/statistics-response.dto").MaterialStockDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getMaterialStock", null);
__decorate([
    (0, common_1.Get)('market/art'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener obras de arte disponibles' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getArt", null);
__decorate([
    (0, common_1.Get)('collections'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas de recolección' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getCollectionStats", null);
exports.StatisticsController = StatisticsController = __decorate([
    (0, swagger_1.ApiTags)('statistics'),
    (0, common_1.Controller)('statistics'),
    __metadata("design:paramtypes", [statistics_service_1.StatisticsService])
], StatisticsController);
//# sourceMappingURL=statistics.controller.js.map