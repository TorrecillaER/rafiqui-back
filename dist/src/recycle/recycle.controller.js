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
exports.RecycleController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const recycle_service_1 = require("./recycle.service");
const recycle_dto_1 = require("./dto/recycle.dto");
let RecycleController = class RecycleController {
    recycleService;
    constructor(recycleService) {
        this.recycleService = recycleService;
    }
    processRecycle(dto, user) {
        return this.recycleService.processRecycle({ ...dto, operatorId: user.userId });
    }
    checkRecycle(qrCode) {
        return this.recycleService.findAssetForRecycle(qrCode);
    }
    getMaterialStock() {
        return this.recycleService.getMaterialStock();
    }
    getTreasuryBalances() {
        return this.recycleService.getTreasuryBalances();
    }
    getWalletBalances(address) {
        return this.recycleService.getWalletBalances(address);
    }
    getHistory(limit) {
        return this.recycleService.getRecycleHistory(limit);
    }
};
exports.RecycleController = RecycleController;
__decorate([
    (0, common_1.Post)('process'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Procesar reciclaje de panel',
        description: 'Recicla un panel, separa los materiales, actualiza inventario y mintea tokens ERC-1155'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: recycle_dto_1.RecycleResponseDto }),
    openapi.ApiResponse({ status: 201, type: require("./dto/recycle.dto").RecycleResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recycle_dto_1.ProcessRecycleDto, Object]),
    __metadata("design:returntype", void 0)
], RecycleController.prototype, "processRecycle", null);
__decorate([
    (0, common_1.Get)('check/:qrCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar si un panel puede ser reciclado' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecycleController.prototype, "checkRecycle", null);
__decorate([
    (0, common_1.Get)('materials'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener stock actual de materiales en BD' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [recycle_dto_1.MaterialStockDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/recycle.dto").MaterialStockDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RecycleController.prototype, "getMaterialStock", null);
__decorate([
    (0, common_1.Get)('materials/treasury'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener balance de tokens ERC-1155 en treasury',
        description: 'Consulta el contrato RafiquiMaterials para obtener los balances de tokens disponibles para venta'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: recycle_dto_1.MaterialBalancesDto }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RecycleController.prototype, "getTreasuryBalances", null);
__decorate([
    (0, common_1.Get)('materials/wallet/:address'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener balance de tokens ERC-1155 de una wallet',
        description: 'Consulta los balances de materiales de una wallet específica'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: recycle_dto_1.MaterialBalancesDto }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecycleController.prototype, "getWalletBalances", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de reciclajes' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RecycleController.prototype, "getHistory", null);
exports.RecycleController = RecycleController = __decorate([
    (0, swagger_1.ApiTags)('Recycle'),
    (0, common_1.Controller)('recycle'),
    __metadata("design:paramtypes", [recycle_service_1.RecycleService])
], RecycleController);
//# sourceMappingURL=recycle.controller.js.map