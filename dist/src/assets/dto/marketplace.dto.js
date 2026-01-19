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
exports.MarketplacePanelsResponseDto = exports.MarketplaceResponseDto = exports.MarketplaceGroupDto = exports.MarketplacePanelDto = exports.MarketplaceFiltersDto = exports.PowerRange = exports.HealthGrade = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var HealthGrade;
(function (HealthGrade) {
    HealthGrade["A"] = "A";
    HealthGrade["B"] = "B";
    HealthGrade["C"] = "C";
})(HealthGrade || (exports.HealthGrade = HealthGrade = {}));
var PowerRange;
(function (PowerRange) {
    PowerRange["LOW"] = "LOW";
    PowerRange["MEDIUM"] = "MEDIUM";
    PowerRange["HIGH"] = "HIGH";
})(PowerRange || (exports.PowerRange = PowerRange = {}));
class MarketplaceFiltersDto {
    brands;
    minPower;
    maxPower;
    powerRange;
    minVoltage;
    maxVoltage;
    healthGrade;
    minLength;
    maxLength;
    minWidth;
    maxWidth;
    sortBy;
    sortOrder;
    page;
    limit;
    static _OPENAPI_METADATA_FACTORY() {
        return { brands: { required: false, type: () => String }, minPower: { required: false, type: () => Number, minimum: 0 }, maxPower: { required: false, type: () => Number, minimum: 0 }, powerRange: { required: false, enum: require("./marketplace.dto").PowerRange }, minVoltage: { required: false, type: () => Number, minimum: 0 }, maxVoltage: { required: false, type: () => Number, minimum: 0 }, healthGrade: { required: false, enum: require("./marketplace.dto").HealthGrade }, minLength: { required: false, type: () => Number, minimum: 0 }, maxLength: { required: false, type: () => Number, minimum: 0 }, minWidth: { required: false, type: () => Number, minimum: 0 }, maxWidth: { required: false, type: () => Number, minimum: 0 }, sortBy: { required: false, type: () => String }, sortOrder: { required: false, type: () => Object }, page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 100 } };
    }
}
exports.MarketplaceFiltersDto = MarketplaceFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrar por marca(s)', example: 'SunPower,LG' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketplaceFiltersDto.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Potencia mínima en watts', example: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "minPower", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Potencia máxima en watts', example: 400 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "maxPower", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Rango de potencia predefinido', enum: PowerRange }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PowerRange),
    __metadata("design:type", String)
], MarketplaceFiltersDto.prototype, "powerRange", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Voltaje mínimo en V', example: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "minVoltage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Voltaje máximo en V', example: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "maxVoltage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Grado de salud (A: >85%, B: >75%, C: <=75%)', enum: HealthGrade }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(HealthGrade),
    __metadata("design:type", String)
], MarketplaceFiltersDto.prototype, "healthGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Largo mínimo en cm', example: 150 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "minLength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Largo máximo en cm', example: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "maxLength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ancho mínimo en cm', example: 90 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "minWidth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ancho máximo en cm', example: 110 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "maxWidth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ordenar por campo', example: 'healthPercentage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketplaceFiltersDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Orden ascendente o descendente', example: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketplaceFiltersDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Página (para paginación)', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Elementos por página', example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MarketplaceFiltersDto.prototype, "limit", void 0);
class MarketplacePanelDto {
    id;
    qrCode;
    brand;
    model;
    measuredPowerWatts;
    measuredVoltage;
    healthPercentage;
    healthGrade;
    dimensionLength;
    dimensionWidth;
    dimensionHeight;
    refurbishedAt;
    refurbishmentNotes;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, qrCode: { required: true, type: () => String }, brand: { required: true, type: () => String }, model: { required: true, type: () => String }, measuredPowerWatts: { required: true, type: () => Number }, measuredVoltage: { required: true, type: () => Number }, healthPercentage: { required: true, type: () => Number }, healthGrade: { required: true, enum: require("./marketplace.dto").HealthGrade }, dimensionLength: { required: true, type: () => Number }, dimensionWidth: { required: true, type: () => Number }, dimensionHeight: { required: true, type: () => Number }, refurbishedAt: { required: true, type: () => Date }, refurbishmentNotes: { required: false, type: () => String } };
    }
}
exports.MarketplacePanelDto = MarketplacePanelDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MarketplacePanelDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MarketplacePanelDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MarketplacePanelDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MarketplacePanelDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MarketplacePanelDto.prototype, "measuredPowerWatts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MarketplacePanelDto.prototype, "measuredVoltage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MarketplacePanelDto.prototype, "healthPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: HealthGrade }),
    __metadata("design:type", String)
], MarketplacePanelDto.prototype, "healthGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MarketplacePanelDto.prototype, "dimensionLength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MarketplacePanelDto.prototype, "dimensionWidth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MarketplacePanelDto.prototype, "dimensionHeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MarketplacePanelDto.prototype, "refurbishedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MarketplacePanelDto.prototype, "refurbishmentNotes", void 0);
class MarketplaceGroupDto {
    groupId;
    brand;
    model;
    powerRange;
    avgPower;
    avgVoltage;
    healthGrade;
    avgHealthPercentage;
    dimensions;
    availableCount;
    panelIds;
    suggestedPrice;
    imageUrl;
    static _OPENAPI_METADATA_FACTORY() {
        return { groupId: { required: true, type: () => String }, brand: { required: true, type: () => String }, model: { required: true, type: () => String }, powerRange: { required: true, type: () => String }, avgPower: { required: true, type: () => Number }, avgVoltage: { required: true, type: () => Number }, healthGrade: { required: true, enum: require("./marketplace.dto").HealthGrade }, avgHealthPercentage: { required: true, type: () => Number }, dimensions: { required: true, type: () => String }, availableCount: { required: true, type: () => Number }, panelIds: { required: true, type: () => [String] }, suggestedPrice: { required: false, type: () => Number }, imageUrl: { required: false, type: () => String } };
    }
}
exports.MarketplaceGroupDto = MarketplaceGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID único del grupo' }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Marca del grupo' }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Modelo del grupo (puede ser "Varios" si hay múltiples)' }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rango de potencia del grupo', example: '280-320W' }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "powerRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Potencia promedio en watts' }),
    __metadata("design:type", Number)
], MarketplaceGroupDto.prototype, "avgPower", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Voltaje promedio en V' }),
    __metadata("design:type", Number)
], MarketplaceGroupDto.prototype, "avgVoltage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Grado de salud del grupo', enum: HealthGrade }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "healthGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Porcentaje de salud promedio' }),
    __metadata("design:type", Number)
], MarketplaceGroupDto.prototype, "avgHealthPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dimensiones aproximadas', example: '165x99 cm' }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "dimensions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad de paneles disponibles en este grupo' }),
    __metadata("design:type", Number)
], MarketplaceGroupDto.prototype, "availableCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lista de IDs de paneles en este grupo' }),
    __metadata("design:type", Array)
], MarketplaceGroupDto.prototype, "panelIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Precio sugerido (si aplica)' }),
    __metadata("design:type", Number)
], MarketplaceGroupDto.prototype, "suggestedPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de imagen representativa' }),
    __metadata("design:type", String)
], MarketplaceGroupDto.prototype, "imageUrl", void 0);
class MarketplaceResponseDto {
    groups;
    totalPanels;
    totalGroups;
    page;
    limit;
    totalPages;
    availableFilters;
    static _OPENAPI_METADATA_FACTORY() {
        return { groups: { required: true, type: () => [require("./marketplace.dto").MarketplaceGroupDto] }, totalPanels: { required: true, type: () => Number }, totalGroups: { required: true, type: () => Number }, page: { required: true, type: () => Number }, limit: { required: true, type: () => Number }, totalPages: { required: true, type: () => Number }, availableFilters: { required: true, type: () => ({ brands: { required: true, type: () => [String] }, powerRanges: { required: true, type: () => ({ min: { required: true, type: () => Number }, max: { required: true, type: () => Number } }) }, voltageRanges: { required: true, type: () => ({ min: { required: true, type: () => Number }, max: { required: true, type: () => Number } }) }, healthGrades: { required: true, enum: require("./marketplace.dto").HealthGrade, isArray: true } }) } };
    }
}
exports.MarketplaceResponseDto = MarketplaceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lista de grupos de paneles', type: [MarketplaceGroupDto] }),
    __metadata("design:type", Array)
], MarketplaceResponseDto.prototype, "groups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de paneles disponibles' }),
    __metadata("design:type", Number)
], MarketplaceResponseDto.prototype, "totalPanels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de grupos' }),
    __metadata("design:type", Number)
], MarketplaceResponseDto.prototype, "totalGroups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Página actual' }),
    __metadata("design:type", Number)
], MarketplaceResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Elementos por página' }),
    __metadata("design:type", Number)
], MarketplaceResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de páginas' }),
    __metadata("design:type", Number)
], MarketplaceResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filtros disponibles para el frontend' }),
    __metadata("design:type", Object)
], MarketplaceResponseDto.prototype, "availableFilters", void 0);
class MarketplacePanelsResponseDto {
    panels;
    total;
    page;
    limit;
    totalPages;
    static _OPENAPI_METADATA_FACTORY() {
        return { panels: { required: true, type: () => [require("./marketplace.dto").MarketplacePanelDto] }, total: { required: true, type: () => Number }, page: { required: true, type: () => Number }, limit: { required: true, type: () => Number }, totalPages: { required: true, type: () => Number } };
    }
}
exports.MarketplacePanelsResponseDto = MarketplacePanelsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lista de paneles', type: [MarketplacePanelDto] }),
    __metadata("design:type", Array)
], MarketplacePanelsResponseDto.prototype, "panels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de paneles' }),
    __metadata("design:type", Number)
], MarketplacePanelsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Página actual' }),
    __metadata("design:type", Number)
], MarketplacePanelsResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Elementos por página' }),
    __metadata("design:type", Number)
], MarketplacePanelsResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de páginas' }),
    __metadata("design:type", Number)
], MarketplacePanelsResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=marketplace.dto.js.map