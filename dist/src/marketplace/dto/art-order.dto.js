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
exports.ArtOrderResponseDto = exports.CreateArtOrderDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateArtOrderDto {
    artPieceId;
    buyerWallet;
    buyerId;
    messageToArtist;
    static _OPENAPI_METADATA_FACTORY() {
        return { artPieceId: { required: true, type: () => String }, buyerWallet: { required: true, type: () => String }, buyerId: { required: false, type: () => String }, messageToArtist: { required: false, type: () => String } };
    }
}
exports.CreateArtOrderDto = CreateArtOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la obra de arte' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtOrderDto.prototype, "artPieceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet address del comprador' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArtOrderDto.prototype, "buyerWallet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del usuario comprador (si está registrado)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateArtOrderDto.prototype, "buyerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mensaje para el artista' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateArtOrderDto.prototype, "messageToArtist", void 0);
class ArtOrderResponseDto {
    success;
    message;
    order;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, order: { required: true, type: () => ({ id: { required: true, type: () => String }, artPieceId: { required: true, type: () => String }, tokenId: { required: true, type: () => String }, title: { required: true, type: () => String }, artist: { required: true, type: () => String }, price: { required: true, type: () => Number }, blockchainTxHash: { required: true, type: () => String, nullable: true } }) } };
    }
}
exports.ArtOrderResponseDto = ArtOrderResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ArtOrderResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ArtOrderResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ArtOrderResponseDto.prototype, "order", void 0);
//# sourceMappingURL=art-order.dto.js.map