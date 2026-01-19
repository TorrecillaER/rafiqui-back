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
exports.NFTMetadataDto = exports.NFTAttribute = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class NFTAttribute {
    trait_type;
    value;
    display_type;
    static _OPENAPI_METADATA_FACTORY() {
        return { trait_type: { required: true, type: () => String }, value: { required: true, type: () => Object }, display_type: { required: false, type: () => String } };
    }
}
exports.NFTAttribute = NFTAttribute;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipo de atributo (trait_type)' }),
    __metadata("design:type", String)
], NFTAttribute.prototype, "trait_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor del atributo' }),
    __metadata("design:type", Object)
], NFTAttribute.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo de display (number, date, etc.)' }),
    __metadata("design:type", String)
], NFTAttribute.prototype, "display_type", void 0);
class NFTMetadataDto {
    name;
    description;
    image;
    external_url;
    background_color;
    animation_url;
    attributes;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, description: { required: true, type: () => String }, image: { required: true, type: () => String }, external_url: { required: false, type: () => String }, background_color: { required: false, type: () => String }, animation_url: { required: false, type: () => String }, attributes: { required: true, type: () => [require("./metadata.dto").NFTAttribute] } };
    }
}
exports.NFTMetadataDto = NFTMetadataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre del NFT' }),
    __metadata("design:type", String)
], NFTMetadataDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Descripción del NFT' }),
    __metadata("design:type", String)
], NFTMetadataDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL de la imagen del NFT' }),
    __metadata("design:type", String)
], NFTMetadataDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL externa del NFT' }),
    __metadata("design:type", String)
], NFTMetadataDto.prototype, "external_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Color de fondo (hex sin #)' }),
    __metadata("design:type", String)
], NFTMetadataDto.prototype, "background_color", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de animación (video, audio, etc.)' }),
    __metadata("design:type", String)
], NFTMetadataDto.prototype, "animation_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Atributos del NFT', type: [NFTAttribute] }),
    __metadata("design:type", Array)
], NFTMetadataDto.prototype, "attributes", void 0);
//# sourceMappingURL=metadata.dto.js.map