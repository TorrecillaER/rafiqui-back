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
exports.GalleryStatsDto = exports.GalleryResponseDto = exports.GalleryArtPieceDto = exports.GalleryFiltersDto = exports.ArtSortBy = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ArtSortBy;
(function (ArtSortBy) {
    ArtSortBy["NEWEST"] = "newest";
    ArtSortBy["PRICE_ASC"] = "price_asc";
    ArtSortBy["PRICE_DESC"] = "price_desc";
    ArtSortBy["TITLE"] = "title";
})(ArtSortBy || (exports.ArtSortBy = ArtSortBy = {}));
class GalleryFiltersDto {
    category;
    minPrice;
    maxPrice;
    search;
    sortBy;
    page;
    limit;
    static _OPENAPI_METADATA_FACTORY() {
        return { category: { required: false, type: () => String }, minPrice: { required: false, type: () => Number, minimum: 0 }, maxPrice: { required: false, type: () => Number }, search: { required: false, type: () => String }, sortBy: { required: false, enum: require("./gallery.dto").ArtSortBy }, page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 50 } };
    }
}
exports.GalleryFiltersDto = GalleryFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['NFT', 'SCULPTURE', 'INSTALLATION'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GalleryFiltersDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Precio mínimo en USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GalleryFiltersDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Precio máximo en USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GalleryFiltersDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Buscar por título o artista' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GalleryFiltersDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ArtSortBy, default: ArtSortBy.NEWEST }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ArtSortBy),
    __metadata("design:type", String)
], GalleryFiltersDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GalleryFiltersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 12 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], GalleryFiltersDto.prototype, "limit", void 0);
class GalleryArtPieceDto {
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
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, artist: { required: true, type: () => String }, description: { required: true, type: () => String }, price: { required: true, type: () => Number }, currency: { required: true, type: () => String }, category: { required: true, type: () => String }, imageUrl: { required: true, type: () => String, nullable: true }, isAvailable: { required: true, type: () => Boolean }, tokenId: { required: true, type: () => String, nullable: true }, sourceAssetId: { required: true, type: () => String, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
}
exports.GalleryArtPieceDto = GalleryArtPieceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GalleryArtPieceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GalleryArtPieceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GalleryArtPieceDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GalleryArtPieceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryArtPieceDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GalleryArtPieceDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['NFT', 'SCULPTURE', 'INSTALLATION'] }),
    __metadata("design:type", String)
], GalleryArtPieceDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], GalleryArtPieceDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], GalleryArtPieceDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], GalleryArtPieceDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], GalleryArtPieceDto.prototype, "sourceAssetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], GalleryArtPieceDto.prototype, "createdAt", void 0);
class GalleryResponseDto {
    artPieces;
    total;
    page;
    limit;
    totalPages;
    availableFilters;
    static _OPENAPI_METADATA_FACTORY() {
        return { artPieces: { required: true, type: () => [require("./gallery.dto").GalleryArtPieceDto] }, total: { required: true, type: () => Number }, page: { required: true, type: () => Number }, limit: { required: true, type: () => Number }, totalPages: { required: true, type: () => Number }, availableFilters: { required: true, type: () => ({ categories: { required: true, type: () => [String] }, priceRange: { required: true, type: () => ({ min: { required: true, type: () => Number }, max: { required: true, type: () => Number } }) }, artists: { required: true, type: () => [String] } }) } };
    }
}
exports.GalleryResponseDto = GalleryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [GalleryArtPieceDto] }),
    __metadata("design:type", Array)
], GalleryResponseDto.prototype, "artPieces", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], GalleryResponseDto.prototype, "availableFilters", void 0);
class GalleryStatsDto {
    totalPieces;
    availablePieces;
    soldPieces;
    totalValue;
    byCategory;
    topArtists;
    static _OPENAPI_METADATA_FACTORY() {
        return { totalPieces: { required: true, type: () => Number }, availablePieces: { required: true, type: () => Number }, soldPieces: { required: true, type: () => Number }, totalValue: { required: true, type: () => Number }, byCategory: { required: true, type: () => [({ category: { required: true, type: () => String }, count: { required: true, type: () => Number }, totalValue: { required: true, type: () => Number } })] }, topArtists: { required: true, type: () => [({ artist: { required: true, type: () => String }, count: { required: true, type: () => Number } })] } };
    }
}
exports.GalleryStatsDto = GalleryStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryStatsDto.prototype, "totalPieces", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryStatsDto.prototype, "availablePieces", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryStatsDto.prototype, "soldPieces", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GalleryStatsDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GalleryStatsDto.prototype, "byCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GalleryStatsDto.prototype, "topArtists", void 0);
//# sourceMappingURL=gallery.dto.js.map