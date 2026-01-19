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
exports.PanelsMarketplaceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const panels_marketplace_service_1 = require("./panels-marketplace.service");
const panel_order_dto_1 = require("./dto/panel-order.dto");
let PanelsMarketplaceController = class PanelsMarketplaceController {
    panelsMarketplace;
    constructor(panelsMarketplace) {
        this.panelsMarketplace = panelsMarketplace;
    }
    async getAvailablePanels() {
        return this.panelsMarketplace.getAvailablePanels();
    }
    async getMarketplaceStats() {
        return this.panelsMarketplace.getMarketplaceStats();
    }
    async getPanelOrderHistory(buyerId) {
        return this.panelsMarketplace.getPanelOrderHistory(buyerId);
    }
    async getPanelDetails(assetId) {
        return this.panelsMarketplace.getPanelDetails(assetId);
    }
    async purchasePanel(dto) {
        if (!dto.buyerId) {
            dto.buyerId = '7b01e47c-728f-4621-ae9a-2e8831c1ce5d';
        }
        return this.panelsMarketplace.purchasePanel(dto);
    }
};
exports.PanelsMarketplaceController = PanelsMarketplaceController;
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener paneles disponibles para venta' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [panel_order_dto_1.PanelDetailsDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/panel-order.dto").PanelDetailsDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PanelsMarketplaceController.prototype, "getAvailablePanels", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas del marketplace de paneles' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PanelsMarketplaceController.prototype, "getMarketplaceStats", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de órdenes de paneles' }),
    (0, swagger_1.ApiQuery)({ name: 'buyerId', required: false }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('buyerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelsMarketplaceController.prototype, "getPanelOrderHistory", null);
__decorate([
    (0, common_1.Get)(':assetId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalles de un panel específico' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: panel_order_dto_1.PanelDetailsDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/panel-order.dto").PanelDetailsDto }),
    __param(0, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelsMarketplaceController.prototype, "getPanelDetails", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Comprar panel reacondicionado',
        description: 'Compra un panel y transfiere el NFT ERC-721 a la wallet del comprador'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: panel_order_dto_1.PanelOrderResponseDto }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./dto/panel-order.dto").PanelOrderResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [panel_order_dto_1.CreatePanelOrderDto]),
    __metadata("design:returntype", Promise)
], PanelsMarketplaceController.prototype, "purchasePanel", null);
exports.PanelsMarketplaceController = PanelsMarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('Panels Marketplace'),
    (0, common_1.Controller)('marketplace/panels'),
    __metadata("design:paramtypes", [panels_marketplace_service_1.PanelsMarketplaceService])
], PanelsMarketplaceController);
//# sourceMappingURL=panels-marketplace.controller.js.map