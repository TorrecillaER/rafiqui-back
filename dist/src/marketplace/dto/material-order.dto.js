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
exports.MaterialAvailabilityDto = exports.MaterialOrderResponseDto = exports.CreateMaterialOrderDto = exports.MaterialDestination = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var MaterialDestination;
(function (MaterialDestination) {
    MaterialDestination["MANUFACTURING"] = "MANUFACTURING";
    MaterialDestination["CONSTRUCTION"] = "CONSTRUCTION";
    MaterialDestination["RESEARCH"] = "RESEARCH";
    MaterialDestination["RECYCLING_CENTER"] = "RECYCLING_CENTER";
    MaterialDestination["OTHER"] = "OTHER";
})(MaterialDestination || (exports.MaterialDestination = MaterialDestination = {}));
class CreateMaterialOrderDto {
    buyerId;
    materialType;
    quantityKg;
    buyerWallet;
    destination;
    destinationNotes;
    static _OPENAPI_METADATA_FACTORY() {
        return { buyerId: { required: true, type: () => String }, materialType: { required: true, type: () => String }, quantityKg: { required: true, type: () => Number, minimum: 0.1 }, buyerWallet: { required: true, type: () => String }, destination: { required: true, enum: require("./material-order.dto").MaterialDestination }, destinationNotes: { required: false, type: () => String } };
    }
}
exports.CreateMaterialOrderDto = CreateMaterialOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID del comprador' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialOrderDto.prototype, "buyerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ALUMINUM', 'GLASS', 'SILICON', 'COPPER'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialOrderDto.prototype, "materialType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad en kg' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    __metadata("design:type", Number)
], CreateMaterialOrderDto.prototype, "quantityKg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet address del comprador' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialOrderDto.prototype, "buyerWallet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: MaterialDestination, description: 'Destino del material' }),
    (0, class_validator_1.IsEnum)(MaterialDestination),
    __metadata("design:type", String)
], CreateMaterialOrderDto.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notas adicionales sobre el destino', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMaterialOrderDto.prototype, "destinationNotes", void 0);
class MaterialOrderResponseDto {
    success;
    message;
    order;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, order: { required: true, type: () => ({ id: { required: true, type: () => String }, materialType: { required: true, type: () => String }, quantityKg: { required: true, type: () => Number }, totalPrice: { required: true, type: () => Number }, status: { required: true, type: () => String }, blockchainTxHash: { required: true, type: () => String, nullable: true }, tokensTransferred: { required: true, type: () => Number } }) } };
    }
}
exports.MaterialOrderResponseDto = MaterialOrderResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MaterialOrderResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MaterialOrderResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MaterialOrderResponseDto.prototype, "order", void 0);
class MaterialAvailabilityDto {
    type;
    name;
    availableKg;
    availableTokens;
    pricePerKg;
    totalValue;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => String }, name: { required: true, type: () => String }, availableKg: { required: true, type: () => Number }, availableTokens: { required: true, type: () => Number }, pricePerKg: { required: true, type: () => Number }, totalValue: { required: true, type: () => Number } };
    }
}
exports.MaterialAvailabilityDto = MaterialAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MaterialAvailabilityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MaterialAvailabilityDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialAvailabilityDto.prototype, "availableKg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialAvailabilityDto.prototype, "availableTokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialAvailabilityDto.prototype, "pricePerKg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialAvailabilityDto.prototype, "totalValue", void 0);
//# sourceMappingURL=material-order.dto.js.map