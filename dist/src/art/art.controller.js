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
exports.ArtController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const art_service_1 = require("./art.service");
const art_dto_1 = require("./dto/art.dto");
const publish_art_dto_1 = require("./dto/publish-art.dto");
const gallery_dto_1 = require("./dto/gallery.dto");
const swagger_1 = require("@nestjs/swagger");
const art_dto_2 = require("./dto/art.dto");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let ArtController = class ArtController {
    artService;
    cloudinaryService;
    constructor(artService, cloudinaryService) {
        this.artService = artService;
        this.cloudinaryService = cloudinaryService;
    }
    async uploadArtImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('No se proporcionó ninguna imagen');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Solo se permiten imágenes (JPEG, PNG, WEBP)');
        }
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('El archivo es demasiado grande (máximo 15MB)');
        }
        const result = await this.cloudinaryService.uploadImage(file, 'Art_Gallery');
        return {
            success: true,
            imageUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
        };
    }
    create(dto) {
        return this.artService.create(dto);
    }
    getGallery(filters) {
        return this.artService.getGallery(filters);
    }
    getGalleryStats() {
        return this.artService.getGalleryStats();
    }
    getFeaturedArt() {
        return this.artService.getFeaturedArt();
    }
    findAll(category) {
        return this.artService.findAll(category);
    }
    findAvailable(category) {
        return this.artService.findAvailable(category);
    }
    getStats() {
        return this.artService.getStats();
    }
    findOne(id) {
        return this.artService.findOne(id);
    }
    update(id, dto) {
        return this.artService.update(id, dto);
    }
    remove(id) {
        return this.artService.remove(id);
    }
    createFromAsset(assetId, dto) {
        const { sourceAssetId, ...rest } = dto;
        return this.artService.createFromAsset(assetId, rest);
    }
    findArtCandidate(qrCode) {
        return this.artService.findArtCandidateByQrCode(qrCode);
    }
    publishArt(dto) {
        return this.artService.publishArt(dto);
    }
};
exports.ArtController = ArtController;
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, swagger_1.ApiOperation)({ summary: 'Subir imagen de obra de arte a Cloudinary' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Imagen de la obra de arte (JPEG, PNG, WEBP)',
                },
            },
            required: ['file'],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Imagen subida exitosamente',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                imageUrl: { type: 'string' },
                publicId: { type: 'string' },
                width: { type: 'number' },
                height: { type: 'number' },
                format: { type: 'string' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtController.prototype, "uploadArtImage", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una nueva obra de arte' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: art_dto_2.ArtPieceResponseDto }),
    openapi.ApiResponse({ status: 201, type: require("./dto/art.dto").ArtPieceResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [art_dto_1.CreateArtPieceDto]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('gallery'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener galería de arte para marketplace',
        description: 'Lista obras de arte con filtros, paginación y ordenamiento para el marketplace web'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: gallery_dto_1.GalleryResponseDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/gallery.dto").GalleryResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gallery_dto_1.GalleryFiltersDto]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "getGallery", null);
__decorate([
    (0, common_1.Get)('gallery/stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener estadísticas de la galería de arte',
        description: 'Estadísticas detalladas incluyendo total, disponibles, vendidas, valor total, por categoría y top artistas'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: gallery_dto_1.GalleryStatsDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/gallery.dto").GalleryStatsDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "getGalleryStats", null);
__decorate([
    (0, common_1.Get)('gallery/featured'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener obra de arte destacada',
        description: 'Retorna la obra de arte más reciente disponible para destacar en el marketplace'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: art_dto_2.ArtPieceResponseDto, description: 'Obra destacada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No hay obras disponibles' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "getFeaturedArt", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas las obras de arte (opcionalmente por categoría)' }),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: art_dto_1.ArtCategory, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [art_dto_2.ArtPieceResponseDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/art.dto").ArtPieceResponseDto] }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar solo obras disponibles' }),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: art_dto_1.ArtCategory, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [art_dto_2.ArtPieceResponseDto] }),
    openapi.ApiResponse({ status: 200, type: [require("./dto/art.dto").ArtPieceResponseDto] }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "findAvailable", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas del módulo de arte' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de una obra de arte' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: art_dto_2.ArtPieceResponseDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/art.dto").ArtPieceResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar una obra de arte' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: art_dto_2.ArtPieceResponseDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/art.dto").ArtPieceResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, art_dto_1.UpdateArtPieceDto]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar una obra de arte' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('from-asset/:assetId'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear obra de arte a partir de un asset existente' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: art_dto_2.ArtPieceResponseDto }),
    openapi.ApiResponse({ status: 201, type: require("./dto/art.dto").ArtPieceResponseDto }),
    __param(0, (0, common_1.Param)('assetId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, art_dto_1.CreateArtPieceDto]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "createFromAsset", null);
__decorate([
    (0, common_1.Get)('candidate/:qrCode'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar panel candidato a arte por QR Code',
        description: 'Verifica si un panel escaneado es candidato a arte y está disponible para publicar'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: publish_art_dto_1.FindArtCandidateResponseDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/publish-art.dto").FindArtCandidateResponseDto }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "findArtCandidate", null);
__decorate([
    (0, common_1.Post)('publish'),
    (0, swagger_1.ApiOperation)({
        summary: 'Publicar obra de arte desde panel candidato',
        description: 'Crea una obra de arte a partir de un panel ART_CANDIDATE y cambia su estado a ART_LISTED_FOR_SALE'
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: publish_art_dto_1.PublishArtResponseDto }),
    openapi.ApiResponse({ status: 201, type: require("./dto/publish-art.dto").PublishArtResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [publish_art_dto_1.PublishArtDto]),
    __metadata("design:returntype", void 0)
], ArtController.prototype, "publishArt", null);
exports.ArtController = ArtController = __decorate([
    (0, swagger_1.ApiTags)('art'),
    (0, common_1.Controller)('art'),
    __metadata("design:paramtypes", [art_service_1.ArtService,
        cloudinary_service_1.CloudinaryService])
], ArtController);
//# sourceMappingURL=art.controller.js.map