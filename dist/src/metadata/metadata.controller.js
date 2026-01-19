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
exports.MetadataController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const metadata_service_1 = require("./metadata.service");
const metadata_dto_1 = require("./dto/metadata.dto");
let MetadataController = class MetadataController {
    metadataService;
    constructor(metadataService) {
        this.metadataService = metadataService;
    }
    async getArtMetadata(tokenId) {
        return this.metadataService.getArtMetadata(tokenId);
    }
    async getPanelMetadata(tokenId) {
        return this.metadataService.getPanelMetadata(tokenId);
    }
};
exports.MetadataController = MetadataController;
__decorate([
    (0, common_1.Get)('art/:tokenId'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener metadata de obra de arte',
        description: 'Retorna el JSON de metadata en formato ERC-721 para obras de arte NFT'
    }),
    (0, swagger_1.ApiParam)({ name: 'tokenId', description: 'Token ID del NFT de arte' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: metadata_dto_1.NFTMetadataDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/metadata.dto").NFTMetadataDto }),
    __param(0, (0, common_1.Param)('tokenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MetadataController.prototype, "getArtMetadata", null);
__decorate([
    (0, common_1.Get)('panel/:tokenId'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener metadata de panel',
        description: 'Retorna el JSON de metadata en formato ERC-721 para paneles NFT'
    }),
    (0, swagger_1.ApiParam)({ name: 'tokenId', description: 'Token ID o QR Code del panel' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: metadata_dto_1.NFTMetadataDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/metadata.dto").NFTMetadataDto }),
    __param(0, (0, common_1.Param)('tokenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MetadataController.prototype, "getPanelMetadata", null);
exports.MetadataController = MetadataController = __decorate([
    (0, swagger_1.ApiTags)('NFT Metadata'),
    (0, common_1.Controller)('metadata'),
    __metadata("design:paramtypes", [metadata_service_1.MetadataService])
], MetadataController);
//# sourceMappingURL=metadata.controller.js.map