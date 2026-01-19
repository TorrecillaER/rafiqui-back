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
exports.ArtPieceResponseDto = exports.UpdateArtPieceDto = exports.CreateArtPieceDto = exports.ArtCategory = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ArtCategory;
(function (ArtCategory) {
    ArtCategory["NFT"] = "NFT";
    ArtCategory["SCULPTURE"] = "SCULPTURE";
    ArtCategory["INSTALLATION"] = "INSTALLATION";
})(ArtCategory || (exports.ArtCategory = ArtCategory = {}));
class CreateArtPieceDto {
    title;
    artist;
    description;
    price;
    currency;
    category;
    imageUrl;
    sourceAssetId;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, artist: { required: true, type: () => String }, description: { required: true, type: () => String }, price: { required: true, type: () => Number }, currency: { required: false, type: () => String }, category: { required: true, enum: require("./art.dto").ArtCategory }, imageUrl: { required: false, type: () => String }, sourceAssetId: { required: false, type: () => String } };
    }
}
exports.CreateArtPieceDto = CreateArtPieceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Título de la obra' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre del artista' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Descripción de la obra' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Precio de la obra' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateArtPieceDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Moneda (USD, ETH)', default: 'USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ArtCategory, description: 'Categoría de la obra' }),
    (0, class_validator_1.IsEnum)(ArtCategory),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de la imagen de la obra' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del activo origen (panel solar)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtPieceDto.prototype, "sourceAssetId", void 0);
class UpdateArtPieceDto {
    title;
    artist;
    description;
    price;
    isAvailable;
    imageUrl;
    tokenId;
    contractAddress;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: false, type: () => String }, artist: { required: false, type: () => String }, description: { required: false, type: () => String }, price: { required: false, type: () => Number }, isAvailable: { required: false, type: () => Boolean }, imageUrl: { required: false, type: () => String }, tokenId: { required: false, type: () => String }, contractAddress: { required: false, type: () => String } };
    }
}
exports.UpdateArtPieceDto = UpdateArtPieceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArtPieceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArtPieceDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArtPieceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateArtPieceDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateArtPieceDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArtPieceDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArtPieceDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArtPieceDto.prototype, "contractAddress", void 0);
class ArtPieceResponseDto {
    id;
    title;
    artist;
    description;
    price;
    currency;
    category;
    imageUrl;
    isAvailable;
    tokenId;
    sourceAssetId;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, artist: { required: true, type: () => String }, description: { required: true, type: () => String }, price: { required: true, type: () => Number }, currency: { required: true, type: () => String }, category: { required: true, enum: require("./art.dto").ArtCategory }, imageUrl: { required: true, type: () => String, nullable: true }, isAvailable: { required: true, type: () => Boolean }, tokenId: { required: true, type: () => String, nullable: true }, sourceAssetId: { required: true, type: () => String, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
}
exports.ArtPieceResponseDto = ArtPieceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ArtPieceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ArtPieceResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ArtPieceResponseDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ArtPieceResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ArtPieceResponseDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ArtPieceResponseDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ArtCategory }),
    __metadata("design:type", String)
], ArtPieceResponseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ArtPieceResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ArtPieceResponseDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ArtPieceResponseDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ArtPieceResponseDto.prototype, "sourceAssetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ArtPieceResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=art.dto.js.map