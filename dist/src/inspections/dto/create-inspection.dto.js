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
exports.CreateInspectionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateInspectionDto {
    assetId;
    inspectorId;
    measuredVoltage;
    measuredAmps;
    physicalCondition;
    photoUrl;
    notes;
    static _OPENAPI_METADATA_FACTORY() {
        return { assetId: { required: true, type: () => String, format: "uuid" }, inspectorId: { required: true, type: () => String }, measuredVoltage: { required: true, type: () => Number }, measuredAmps: { required: true, type: () => Number }, physicalCondition: { required: true, type: () => String }, photoUrl: { required: false, type: () => String, format: "uri" }, notes: { required: false, type: () => String } };
    }
}
exports.CreateInspectionDto = CreateInspectionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInspectionDto.prototype, "assetId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInspectionDto.prototype, "inspectorId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateInspectionDto.prototype, "measuredVoltage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateInspectionDto.prototype, "measuredAmps", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInspectionDto.prototype, "physicalCondition", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateInspectionDto.prototype, "photoUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInspectionDto.prototype, "notes", void 0);
//# sourceMappingURL=create-inspection.dto.js.map