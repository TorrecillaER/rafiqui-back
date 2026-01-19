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
exports.MaterialsMarketplaceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const materials_marketplace_service_1 = require("./materials-marketplace.service");
const material_order_dto_1 = require("./dto/material-order.dto");
let MaterialsMarketplaceController = class MaterialsMarketplaceController {
    materialsMarketplace;
    constructor(materialsMarketplace) {
        this.materialsMarketplace = materialsMarketplace;
    }
    async getAvailability() {
        return this.materialsMarketplace.getAvailability();
    }
    async createOrder(dto) {
        return this.materialsMarketplace.createOrder(dto);
    }
    async getOrdersByBuyer(buyerId) {
        return this.materialsMarketplace.getOrdersByBuyer(buyerId);
    }
    async getOrderById(orderId) {
        return this.materialsMarketplace.getOrderById(orderId);
    }
};
exports.MaterialsMarketplaceController = MaterialsMarketplaceController;
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener disponibilidad de materiales para compra' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de materiales disponibles', type: [material_order_dto_1.MaterialAvailabilityDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/material-order.dto").MaterialAvailabilityDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MaterialsMarketplaceController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Post)('order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Crear orden de compra de materiales' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Orden creada exitosamente', type: material_order_dto_1.MaterialOrderResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Datos inválidos o stock insuficiente' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: require("./dto/material-order.dto").MaterialOrderResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [material_order_dto_1.CreateMaterialOrderDto]),
    __metadata("design:returntype", Promise)
], MaterialsMarketplaceController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders/buyer/:buyerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener órdenes de un comprador' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de órdenes del comprador' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('buyerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsMarketplaceController.prototype, "getOrdersByBuyer", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalles de una orden' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalles de la orden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Orden no encontrada' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsMarketplaceController.prototype, "getOrderById", null);
exports.MaterialsMarketplaceController = MaterialsMarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('Materials Marketplace'),
    (0, common_1.Controller)('marketplace/materials'),
    __metadata("design:paramtypes", [materials_marketplace_service_1.MaterialsMarketplaceService])
], MaterialsMarketplaceController);
//# sourceMappingURL=materials-marketplace.controller.js.map