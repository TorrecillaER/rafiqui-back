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
exports.UpdateAssetDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_asset_dto_1 = require("./create-asset.dto");
const class_validator_1 = require("class-validator");
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["PENDING_COLLECTION"] = "PENDING_COLLECTION";
    AssetStatus["IN_TRANSIT"] = "IN_TRANSIT";
    AssetStatus["WAREHOUSE_RECEIVED"] = "WAREHOUSE_RECEIVED";
    AssetStatus["INSPECTING"] = "INSPECTING";
    AssetStatus["INSPECTED"] = "INSPECTED";
    AssetStatus["RECYCLED"] = "RECYCLED";
    AssetStatus["REUSED"] = "REUSED";
    AssetStatus["READY_FOR_REUSE"] = "READY_FOR_REUSE";
    AssetStatus["REFURBISHING"] = "REFURBISHING";
    AssetStatus["LISTED_FOR_SALE"] = "LISTED_FOR_SALE";
    AssetStatus["ART_CANDIDATE"] = "ART_CANDIDATE";
})(AssetStatus || (AssetStatus = {}));
class UpdateAssetDto extends (0, swagger_1.PartialType)(create_asset_dto_1.CreateAssetDto) {
    status;
    qrCode;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, enum: AssetStatus }, qrCode: { required: false, type: () => String } };
    }
}
exports.UpdateAssetDto = UpdateAssetDto;
__decorate([
    (0, class_validator_1.IsEnum)(AssetStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetDto.prototype, "qrCode", void 0);
//# sourceMappingURL=update-asset.dto.js.map