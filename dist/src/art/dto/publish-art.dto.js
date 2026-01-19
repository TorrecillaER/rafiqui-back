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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindArtCandidateResponseDto = exports.PublishArtResponseDto = exports.PublishArtDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class PublishArtDto {
    assetId;
    title;
    artist;
    description;
    priceMxn;
    imageUrl;
    artistId;
    static _OPENAPI_METADATA_FACTORY() {
        return { assetId: { required: true, type: () => String }, title: { required: true, type: () => String, maxLength: 200 }, artist: { required: true, type: () => String, maxLength: 100 }, description: { required: true, type: () => String, maxLength: 2000 }, priceMxn: { required: true, type: () => Number, minimum: 0 }, imageUrl: { required: false, type: () => String }, artistId: { required: false, type: () => String } };
    }
}
exports.PublishArtDto = PublishArtDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID del asset (panel) candidato a arte' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishArtDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de la obra de arte', maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], PublishArtDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre del artista/autor', maxLength: 100 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], PublishArtDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Descripción detallada de la obra', maxLength: 2000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], PublishArtDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Precio en MXN', minimum: 0 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PublishArtDto.prototype, "priceMxn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de la imagen de la obra (Cloudinary)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishArtDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del artista/usuario que publica' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishArtDto.prototype, "artistId", void 0);
class PublishArtResponseDto {
    success;
    message;
    artPiece;
    blockchainTxHash;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, artPiece: { required: false, type: () => ({ id: { required: true, type: () => String }, title: { required: true, type: () => String }, artist: { required: true, type: () => String }, description: { required: true, type: () => String }, price: { required: true, type: () => Number }, currency: { required: true, type: () => String }, imageUrl: { required: true, type: () => String, nullable: true }, sourceAssetId: { required: true, type: () => String }, tokenId: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date } }) }, blockchainTxHash: { required: false, type: () => String } };
    }
}
exports.PublishArtResponseDto = PublishArtResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PublishArtResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PublishArtResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], PublishArtResponseDto.prototype, "artPiece", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PublishArtResponseDto.prototype, "blockchainTxHash", void 0);
class FindArtCandidateResponseDto {
    success;
    message;
    asset;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, asset: { required: false, type: () => ({ id: { required: true, type: () => String }, qrCode: { required: true, type: () => String, nullable: true }, brand: { required: true, type: () => String, nullable: true }, model: { required: true, type: () => String, nullable: true }, status: { required: true, type: () => String }, inspection: { required: false, type: () => ({ id: { required: true, type: () => String }, result: { required: true, type: () => String }, notes: { required: true, type: () => String, nullable: true } }) } }) } };
    }
}
exports.FindArtCandidateResponseDto = FindArtCandidateResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FindArtCandidateResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FindArtCandidateResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], FindArtCandidateResponseDto.prototype, "asset", void 0);
//# sourceMappingURL=publish-art.dto.js.map