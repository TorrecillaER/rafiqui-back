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
exports.CreateAssetDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateAssetDto {
    nfcTagId;
    qrCode;
    collectionRequestId;
    brand;
    model;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { nfcTagId: { required: false, type: () => String }, qrCode: { required: false, type: () => String }, collectionRequestId: { required: false, type: () => String, format: "uuid" }, brand: { required: false, type: () => String }, model: { required: false, type: () => String }, status: { required: false, type: () => Object } };
    }
}
exports.CreateAssetDto = CreateAssetDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "nfcTagId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "qrCode", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "collectionRequestId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status !== undefined && o.status !== null && o.status !== ''),
    (0, class_validator_1.IsEnum)(client_1.AssetStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "status", void 0);
//# sourceMappingURL=create-asset.dto.js.map