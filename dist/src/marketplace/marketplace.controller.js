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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const marketplace_service_1 = require("./marketplace.service");
const marketplace_dto_1 = require("../assets/dto/marketplace.dto");
let MarketplaceController = class MarketplaceController {
    marketplaceService;
    constructor(marketplaceService) {
        this.marketplaceService = marketplaceService;
    }
    async getListings(filters) {
        return this.marketplaceService.getMarketplaceListings(filters);
    }
    async getPanels(filters) {
        return this.marketplaceService.getMarketplacePanels(filters);
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, common_1.Get)('listings'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener paneles agrupados para marketplace',
        description: 'Retorna paneles LISTED_FOR_SALE agrupados por marca, grado de salud y rango de potencia. Ideal para mostrar cards en el marketplace.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Grupos de paneles disponibles',
        type: marketplace_dto_1.MarketplaceResponseDto
    }),
    openapi.ApiResponse({ status: 200, type: require("../assets/dto/marketplace.dto").MarketplaceResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [marketplace_dto_1.MarketplaceFiltersDto]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getListings", null);
__decorate([
    (0, common_1.Get)('panels'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener paneles individuales para marketplace',
        description: 'Retorna paneles LISTED_FOR_SALE sin agrupar. Útil para vista de lista detallada.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de paneles individuales',
        type: marketplace_dto_1.MarketplacePanelsResponseDto
    }),
    openapi.ApiResponse({ status: 200, type: require("../assets/dto/marketplace.dto").MarketplacePanelsResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [marketplace_dto_1.MarketplaceFiltersDto]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getPanels", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('Marketplace'),
    (0, common_1.Controller)('marketplace'),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map