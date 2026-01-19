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
exports.ArtMarketplaceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const art_marketplace_service_1 = require("./art-marketplace.service");
const art_order_dto_1 = require("./dto/art-order.dto");
let ArtMarketplaceController = class ArtMarketplaceController {
    artMarketplace;
    constructor(artMarketplace) {
        this.artMarketplace = artMarketplace;
    }
    async getAvailableArt() {
        return this.artMarketplace.getAvailableArt();
    }
    async getArtMarketplaceStats() {
        return this.artMarketplace.getArtMarketplaceStats();
    }
    async getArtOrderHistory(buyerId) {
        return this.artMarketplace.getArtOrderHistory(buyerId);
    }
    async getArtDetails(artPieceId) {
        return this.artMarketplace.getArtDetails(artPieceId);
    }
    async purchaseArt(dto) {
        if (!dto.buyerId) {
            dto.buyerId = '7b01e47c-728f-4621-ae9a-2e8831c1ce5d';
        }
        return this.artMarketplace.purchaseArt(dto);
    }
};
exports.ArtMarketplaceController = ArtMarketplaceController;
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener obras de arte disponibles para venta' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ArtMarketplaceController.prototype, "getAvailableArt", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas del marketplace de arte' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ArtMarketplaceController.prototype, "getArtMarketplaceStats", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de órdenes de arte' }),
    (0, swagger_1.ApiQuery)({ name: 'buyerId', required: false }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('buyerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArtMarketplaceController.prototype, "getArtOrderHistory", null);
__decorate([
    (0, common_1.Get)(':artPieceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalles de una obra de arte' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('artPieceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArtMarketplaceController.prototype, "getArtDetails", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Comprar obra de arte',
        description: 'Compra una obra de arte y transfiere el NFT ERC-721 a la wallet del comprador'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: art_order_dto_1.ArtOrderResponseDto }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./dto/art-order.dto").ArtOrderResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [art_order_dto_1.CreateArtOrderDto]),
    __metadata("design:returntype", Promise)
], ArtMarketplaceController.prototype, "purchaseArt", null);
exports.ArtMarketplaceController = ArtMarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('Art Marketplace'),
    (0, common_1.Controller)('marketplace/art'),
    __metadata("design:paramtypes", [art_marketplace_service_1.ArtMarketplaceService])
], ArtMarketplaceController);
//# sourceMappingURL=art-marketplace.controller.js.map