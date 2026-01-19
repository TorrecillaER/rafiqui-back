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
exports.BlockchainController = exports.MintArtDto = exports.UpdateStatusDto = exports.RegisterPanelDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const blockchain_service_1 = require("./blockchain.service");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterPanelDto {
    qrCode;
    brand;
    model;
    location;
    ipfsHash;
}
exports.RegisterPanelDto = RegisterPanelDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código QR único del panel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterPanelDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Marca del panel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterPanelDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Modelo del panel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterPanelDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ubicación actual' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterPanelDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hash IPFS con metadatos adicionales' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPanelDto.prototype, "ipfsHash", void 0);
class UpdateStatusDto {
    qrCode;
    status;
    location;
    ipfsHash;
}
exports.UpdateStatusDto = UpdateStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código QR del panel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: blockchain_service_1.PanelStatus, description: 'Nuevo estado del panel' }),
    (0, class_validator_1.IsEnum)(blockchain_service_1.PanelStatus),
    __metadata("design:type", Number)
], UpdateStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nueva ubicación' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hash IPFS actualizado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "ipfsHash", void 0);
class MintArtDto {
    qrCode;
    tokenURI;
    ownerAddress;
}
exports.MintArtDto = MintArtDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código QR del panel a convertir en arte' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MintArtDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URI del token de metadatos' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MintArtDto.prototype, "tokenURI", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dirección de la wallet del propietario' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MintArtDto.prototype, "ownerAddress", void 0);
let BlockchainController = class BlockchainController {
    blockchainService;
    constructor(blockchainService) {
        this.blockchainService = blockchainService;
    }
    getStatus() {
        return {
            connected: this.blockchainService.isConnected(),
        };
    }
    async registerPanel(dto) {
        try {
            const txHash = await this.blockchainService.registerPanel(dto.qrCode, dto.brand, dto.model, dto.location, dto.ipfsHash);
            return { success: true, txHash };
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateStatus(dto) {
        try {
            const txHash = await this.blockchainService.updatePanelStatus(dto.qrCode, dto.status, dto.location, dto.ipfsHash);
            return { success: true, txHash };
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async mintArt(dto) {
        try {
            const result = await this.blockchainService.mintArtNFT(dto.qrCode, dto.tokenURI, dto.ownerAddress);
            return { success: true, ...result };
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPanel(qrCode) {
        const panel = await this.blockchainService.getPanel(qrCode);
        if (!panel) {
            throw new common_1.HttpException('Panel not found', common_1.HttpStatus.NOT_FOUND);
        }
        return panel;
    }
    async getHistory(qrCode) {
        return this.blockchainService.getPanelHistory(qrCode);
    }
};
exports.BlockchainController = BlockchainController;
__decorate([
    (0, common_1.Get)('status'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BlockchainController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('panel'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterPanelDto]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "registerPanel", null);
__decorate([
    (0, common_1.Post)('panel/status'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('art/mint'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MintArtDto]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "mintArt", null);
__decorate([
    (0, common_1.Get)('panel/:qrCode'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getPanel", null);
__decorate([
    (0, common_1.Get)('panel/:qrCode/history'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getHistory", null);
exports.BlockchainController = BlockchainController = __decorate([
    (0, common_1.Controller)('blockchain'),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService])
], BlockchainController);
//# sourceMappingURL=blockchain.controller.js.map