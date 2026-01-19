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
exports.CompleteRefurbishmentResponseDto = exports.CompleteRefurbishmentDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CompleteRefurbishmentDto {
    notes;
    measuredPowerWatts;
    measuredVoltage;
    capacityRetainedPercent;
    healthPercentage;
    dimensionLength;
    dimensionWidth;
    dimensionHeight;
    technicianId;
    static _OPENAPI_METADATA_FACTORY() {
        return { notes: { required: false, type: () => String }, measuredPowerWatts: { required: false, type: () => Number, minimum: 0 }, measuredVoltage: { required: false, type: () => Number, minimum: 0 }, capacityRetainedPercent: { required: false, type: () => Number, minimum: 0, maximum: 100 }, healthPercentage: { required: false, type: () => Number, minimum: 0, maximum: 100 }, dimensionLength: { required: false, type: () => Number, minimum: 0 }, dimensionWidth: { required: false, type: () => Number, minimum: 0 }, dimensionHeight: { required: false, type: () => Number, minimum: 0 }, technicianId: { required: false, type: () => String } };
    }
}
exports.CompleteRefurbishmentDto = CompleteRefurbishmentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notas del técnico sobre el reacondicionamiento' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteRefurbishmentDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nueva potencia medida en watts' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "measuredPowerWatts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Voltaje medido en V' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "measuredVoltage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Porcentaje de capacidad retenida (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "capacityRetainedPercent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Porcentaje de estado de salud (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "healthPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Largo del panel en cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "dimensionLength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ancho del panel en cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "dimensionWidth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alto/grosor del panel en cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteRefurbishmentDto.prototype, "dimensionHeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del técnico que realizó el reacondicionamiento' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteRefurbishmentDto.prototype, "technicianId", void 0);
class CompleteRefurbishmentResponseDto {
    success;
    message;
    asset;
    blockchainTxHash;
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, asset: { required: false, type: () => Object }, blockchainTxHash: { required: false, type: () => String } };
    }
}
exports.CompleteRefurbishmentResponseDto = CompleteRefurbishmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CompleteRefurbishmentResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompleteRefurbishmentResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], CompleteRefurbishmentResponseDto.prototype, "asset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompleteRefurbishmentResponseDto.prototype, "blockchainTxHash", void 0);
//# sourceMappingURL=complete-refurbishment.dto.js.map