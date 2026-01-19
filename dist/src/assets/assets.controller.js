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
exports.AssetsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const assets_service_1 = require("./assets.service");
const scan_asset_dto_1 = require("./dto/scan-asset.dto");
const create_asset_dto_1 = require("./dto/create-asset.dto");
const update_asset_dto_1 = require("./dto/update-asset.dto");
const validate_for_inspection_dto_1 = require("./dto/validate-for-inspection.dto");
const complete_refurbishment_dto_1 = require("./dto/complete-refurbishment.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AssetsController = class AssetsController {
    assetsService;
    constructor(assetsService) {
        this.assetsService = assetsService;
    }
    create(createAssetDto) {
        return this.assetsService.create(createAssetDto);
    }
    scan(scanAssetDto) {
        return this.assetsService.scan(scanAssetDto);
    }
    findAll(status, nfcTagId, qrCode, collectionRequestId) {
        return this.assetsService.findAll(status, nfcTagId, collectionRequestId, qrCode);
    }
    update(id, updateAssetDto) {
        return this.assetsService.update(id, updateAssetDto);
    }
    async validateForInspection(dto, user) {
        return this.assetsService.validateForInspection(dto.qrCode, user.userId);
    }
    async findByQrCode(qrCode) {
        const asset = await this.assetsService.findByQrCode(qrCode);
        if (!asset) {
            throw new common_1.NotFoundException(`Asset con QR ${qrCode} no encontrado`);
        }
        return asset;
    }
    async findByNfcTag(nfcTagId) {
        const asset = await this.assetsService.findByNfcTag(nfcTagId);
        if (!asset) {
            throw new common_1.NotFoundException(`Asset con NFC ${nfcTagId} no encontrado`);
        }
        return asset;
    }
    async completeRefurbishment(id, dto) {
        return this.assetsService.completeRefurbishment(id, dto);
    }
};
exports.AssetsController = AssetsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar un nuevo asset' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_asset_dto_1.CreateAssetDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('scan'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scan_asset_dto_1.ScanAssetDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "scan", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener assets con filtros opcionales' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Estados separados por coma (e.g. COLLECTED,WAREHOUSE_RECEIVED)' }),
    (0, swagger_1.ApiQuery)({ name: 'nfcTagId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'qrCode', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'collectionRequestId', required: false }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('nfcTagId')),
    __param(2, (0, common_1.Query)('qrCode')),
    __param(3, (0, common_1.Query)('collectionRequestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un asset' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_asset_dto_1.UpdateAssetDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('validate-for-inspection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Validar si un panel puede ser inspeccionado y cambiar estado a INSPECTING' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resultado de validación', type: validate_for_inspection_dto_1.ValidateForInspectionResponseDto }),
    openapi.ApiResponse({ status: 201, type: require("./dto/validate-for-inspection.dto").ValidateForInspectionResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_for_inspection_dto_1.ValidateForInspectionDto, Object]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "validateForInspection", null);
__decorate([
    (0, common_1.Get)('by-qr/:qrCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar asset por código QR' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "findByQrCode", null);
__decorate([
    (0, common_1.Get)('by-nfc/:nfcTagId'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar asset por NFC Tag ID' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('nfcTagId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "findByNfcTag", null);
__decorate([
    (0, common_1.Post)(':id/complete-refurbishment'),
    (0, swagger_1.ApiOperation)({ summary: 'Completar reacondicionamiento y marcar como listo para venta' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reacondicionamiento completado', type: complete_refurbishment_dto_1.CompleteRefurbishmentResponseDto }),
    openapi.ApiResponse({ status: 201, type: require("./dto/complete-refurbishment.dto").CompleteRefurbishmentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_refurbishment_dto_1.CompleteRefurbishmentDto]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "completeRefurbishment", null);
exports.AssetsController = AssetsController = __decorate([
    (0, common_1.Controller)('assets'),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetsController);
//# sourceMappingURL=assets.controller.js.map