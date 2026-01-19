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
exports.ValidateForInspectionResponseDto = exports.ValidateForInspectionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ValidateForInspectionDto {
    qrCode;
    static _OPENAPI_METADATA_FACTORY() {
        return { qrCode: { required: true, type: () => String } };
    }
}
exports.ValidateForInspectionDto = ValidateForInspectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código QR del panel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ValidateForInspectionDto.prototype, "qrCode", void 0);
class ValidateForInspectionResponseDto {
    valid;
    message;
    asset;
    error;
    static _OPENAPI_METADATA_FACTORY() {
        return { valid: { required: true, type: () => Boolean }, message: { required: true, type: () => String }, asset: { required: false, type: () => Object }, error: { required: false, type: () => String } };
    }
}
exports.ValidateForInspectionResponseDto = ValidateForInspectionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indica si el panel es válido para inspección' }),
    __metadata("design:type", Boolean)
], ValidateForInspectionResponseDto.prototype, "valid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mensaje descriptivo del resultado' }),
    __metadata("design:type", String)
], ValidateForInspectionResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Datos del asset si fue encontrado' }),
    __metadata("design:type", Object)
], ValidateForInspectionResponseDto.prototype, "asset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mensaje de error detallado si valid es false' }),
    __metadata("design:type", String)
], ValidateForInspectionResponseDto.prototype, "error", void 0);
//# sourceMappingURL=validate-for-inspection.dto.js.map