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
exports.MaterialBalancesDto = exports.MaterialStockDto = exports.RecycleResponseDto = exports.ProcessRecycleDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ProcessRecycleDto {
    assetId;
    operatorId;
    panelWeightKg;
    notes;
    static _OPENAPI_METADATA_FACTORY() {
        return { assetId: { required: true, type: () => String }, operatorId: { required: false, type: () => String }, panelWeightKg: { required: false, type: () => Number, minimum: 1 }, notes: { required: false, type: () => String } };
    }
}
exports.ProcessRecycleDto = ProcessRecycleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID del asset a reciclar' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessRecycleDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del operador que procesa (se obtiene del usuario autenticado)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessRecycleDto.prototype, "operatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Peso del panel en kg (default: 20)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProcessRecycleDto.prototype, "panelWeightKg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notas adicionales' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessRecycleDto.prototype, "notes", void 0);
class RecycleResponseDto {
    success;
    message;
    recycleRecord;
    updatedStock;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, recycleRecord: { required: true, type: () => ({ id: { required: true, type: () => String }, assetId: { required: true, type: () => String }, panelWeightKg: { required: true, type: () => Number }, materials: { required: true, type: () => ({ aluminum: { required: true, type: () => Number }, glass: { required: true, type: () => Number }, silicon: { required: true, type: () => Number }, copper: { required: true, type: () => Number } }) }, blockchainTxHash: { required: true, type: () => String, nullable: true }, materialsTxHash: { required: true, type: () => String, nullable: true }, tokensMinted: { required: true, type: () => ({ aluminum: { required: true, type: () => Number }, glass: { required: true, type: () => Number }, silicon: { required: true, type: () => Number }, copper: { required: true, type: () => Number } }) } }) }, updatedStock: { required: true, type: () => ({ aluminum: { required: true, type: () => Number }, glass: { required: true, type: () => Number }, silicon: { required: true, type: () => Number }, copper: { required: true, type: () => Number } }) } };
    }
}
exports.RecycleResponseDto = RecycleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RecycleResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RecycleResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], RecycleResponseDto.prototype, "recycleRecord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], RecycleResponseDto.prototype, "updatedStock", void 0);
class MaterialStockDto {
    type;
    name;
    totalKg;
    availableKg;
    pricePerKg;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => String }, name: { required: true, type: () => String }, totalKg: { required: true, type: () => Number }, availableKg: { required: true, type: () => Number }, pricePerKg: { required: true, type: () => Number } };
    }
}
exports.MaterialStockDto = MaterialStockDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MaterialStockDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MaterialStockDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialStockDto.prototype, "totalKg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialStockDto.prototype, "availableKg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialStockDto.prototype, "pricePerKg", void 0);
class MaterialBalancesDto {
    aluminum;
    glass;
    silicon;
    copper;
    static _OPENAPI_METADATA_FACTORY() {
        return { aluminum: { required: true, type: () => Number }, glass: { required: true, type: () => Number }, silicon: { required: true, type: () => Number }, copper: { required: true, type: () => Number } };
    }
}
exports.MaterialBalancesDto = MaterialBalancesDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialBalancesDto.prototype, "aluminum", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialBalancesDto.prototype, "glass", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialBalancesDto.prototype, "silicon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MaterialBalancesDto.prototype, "copper", void 0);
//# sourceMappingURL=recycle.dto.js.map