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
exports.CloudinaryController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cloudinary_service_1 = require("./cloudinary.service");
const swagger_1 = require("@nestjs/swagger");
let CloudinaryController = class CloudinaryController {
    cloudinaryService;
    constructor(cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }
    async uploadImage(file, folder) {
        if (!file) {
            throw new common_1.BadRequestException('No se proporcionó ningún archivo');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Solo se permiten imágenes (JPEG, PNG, WEBP)');
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('El archivo es demasiado grande (máximo 10MB)');
        }
        const result = await this.cloudinaryService.uploadImage(file, folder || 'rafiqui');
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        };
    }
};
exports.CloudinaryController = CloudinaryController;
__decorate([
    (0, common_1.Post)('image'),
    (0, swagger_1.ApiOperation)({ summary: 'Subir imagen a Cloudinary' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiQuery)({ name: 'folder', required: false, description: 'Carpeta en Cloudinary (default: rafiqui)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Imagen subida exitosamente' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CloudinaryController.prototype, "uploadImage", null);
exports.CloudinaryController = CloudinaryController = __decorate([
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [cloudinary_service_1.CloudinaryService])
], CloudinaryController);
//# sourceMappingURL=cloudinary.controller.js.map