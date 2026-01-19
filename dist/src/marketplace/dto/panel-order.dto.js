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
exports.PanelDetailsDto = exports.PanelOrderResponseDto = exports.CreatePanelOrderDto = exports.PanelPurchaseDestination = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var PanelPurchaseDestination;
(function (PanelPurchaseDestination) {
    PanelPurchaseDestination["RESIDENTIAL"] = "RESIDENTIAL";
    PanelPurchaseDestination["COMMERCIAL"] = "COMMERCIAL";
    PanelPurchaseDestination["INDUSTRIAL"] = "INDUSTRIAL";
    PanelPurchaseDestination["RESEARCH"] = "RESEARCH";
    PanelPurchaseDestination["RESALE"] = "RESALE";
    PanelPurchaseDestination["OTHER"] = "OTHER";
})(PanelPurchaseDestination || (exports.PanelPurchaseDestination = PanelPurchaseDestination = {}));
class CreatePanelOrderDto {
    assetId;
    buyerWallet;
    destination;
    destinationNotes;
    buyerId;
    static _OPENAPI_METADATA_FACTORY() {
        return { assetId: { required: true, type: () => String }, buyerWallet: { required: true, type: () => String }, destination: { required: true, enum: require("./panel-order.dto").PanelPurchaseDestination }, destinationNotes: { required: false, type: () => String }, buyerId: { required: false, type: () => String } };
    }
}
exports.CreatePanelOrderDto = CreatePanelOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID del panel a comprar' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePanelOrderDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet address del comprador' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePanelOrderDto.prototype, "buyerWallet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PanelPurchaseDestination }),
    (0, class_validator_1.IsEnum)(PanelPurchaseDestination),
    __metadata("design:type", String)
], CreatePanelOrderDto.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notas sobre el destino' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePanelOrderDto.prototype, "destinationNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del usuario comprador (si está registrado)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePanelOrderDto.prototype, "buyerId", void 0);
class PanelOrderResponseDto {
    success;
    message;
    order;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, order: { required: true, type: () => ({ id: { required: true, type: () => String }, assetId: { required: true, type: () => String }, tokenId: { required: true, type: () => String }, price: { required: true, type: () => Number }, blockchainTxHash: { required: true, type: () => String, nullable: true } }) } };
    }
}
exports.PanelOrderResponseDto = PanelOrderResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PanelOrderResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelOrderResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], PanelOrderResponseDto.prototype, "order", void 0);
class PanelDetailsDto {
    id;
    qrCode;
    brand;
    model;
    status;
    tokenId;
    price;
    measuredPowerWatts;
    measuredVoltage;
    healthPercentage;
    capacityRetainedPercent;
    dimensionLength;
    dimensionWidth;
    dimensionHeight;
    refurbishedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, qrCode: { required: true, type: () => String }, brand: { required: true, type: () => String }, model: { required: true, type: () => String }, status: { required: true, type: () => String }, tokenId: { required: true, type: () => String }, price: { required: true, type: () => Number }, measuredPowerWatts: { required: true, type: () => Number }, measuredVoltage: { required: true, type: () => Number }, healthPercentage: { required: true, type: () => Number }, capacityRetainedPercent: { required: true, type: () => Number }, dimensionLength: { required: true, type: () => Number }, dimensionWidth: { required: true, type: () => Number }, dimensionHeight: { required: true, type: () => Number }, refurbishedAt: { required: true, type: () => Date } };
    }
}
exports.PanelDetailsDto = PanelDetailsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelDetailsDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelDetailsDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelDetailsDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelDetailsDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelDetailsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PanelDetailsDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "measuredPowerWatts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "measuredVoltage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "healthPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "capacityRetainedPercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "dimensionLength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "dimensionWidth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PanelDetailsDto.prototype, "dimensionHeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PanelDetailsDto.prototype, "refurbishedAt", void 0);
//# sourceMappingURL=panel-order.dto.js.map