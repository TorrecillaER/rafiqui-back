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
exports.FullReportResponseDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class FullReportResponseDto {
    reportId;
    generatedAt;
    periodStart;
    periodEnd;
    pdfBase64;
    fileSizeBytes;
    pageCount;
    static _OPENAPI_METADATA_FACTORY() {
        return { reportId: { required: true, type: () => String }, generatedAt: { required: true, type: () => Date }, periodStart: { required: true, type: () => Date }, periodEnd: { required: true, type: () => Date }, pdfBase64: { required: true, type: () => String }, fileSizeBytes: { required: true, type: () => Number }, pageCount: { required: true, type: () => Number } };
    }
}
exports.FullReportResponseDto = FullReportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique report identifier',
        example: 'RAFIQUI-RPT-A1B2C3D4',
    }),
    __metadata("design:type", String)
], FullReportResponseDto.prototype, "reportId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Report generation date',
        example: '2025-01-15T19:35:00.000Z',
    }),
    __metadata("design:type", Date)
], FullReportResponseDto.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Report period start date',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], FullReportResponseDto.prototype, "periodStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Report period end date',
        example: '2025-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], FullReportResponseDto.prototype, "periodEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PDF file as base64 encoded string',
        example: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==',
    }),
    __metadata("design:type", String)
], FullReportResponseDto.prototype, "pdfBase64", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File size in bytes',
        example: 125678,
    }),
    __metadata("design:type", Number)
], FullReportResponseDto.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of pages in the report',
        example: 6,
    }),
    __metadata("design:type", Number)
], FullReportResponseDto.prototype, "pageCount", void 0);
//# sourceMappingURL=full-report-response.dto.js.map