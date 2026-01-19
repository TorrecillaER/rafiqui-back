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
exports.CertificateResponseDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class CertificateResponseDto {
    certificateId;
    issuedAt;
    partnerName;
    pdfBase64;
    fileSizeBytes;
    static _OPENAPI_METADATA_FACTORY() {
        return { certificateId: { required: true, type: () => String }, issuedAt: { required: true, type: () => Date }, partnerName: { required: true, type: () => String }, pdfBase64: { required: true, type: () => String }, fileSizeBytes: { required: true, type: () => Number } };
    }
}
exports.CertificateResponseDto = CertificateResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique certificate identifier',
        example: 'RAFIQUI-ESG-A1B2C3D4',
    }),
    __metadata("design:type", String)
], CertificateResponseDto.prototype, "certificateId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Certificate issue date',
        example: '2025-01-15T18:35:00.000Z',
    }),
    __metadata("design:type", Date)
], CertificateResponseDto.prototype, "issuedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Partner or user name',
        example: 'Empresa Solar México',
    }),
    __metadata("design:type", String)
], CertificateResponseDto.prototype, "partnerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PDF file as base64 encoded string',
        example: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==',
    }),
    __metadata("design:type", String)
], CertificateResponseDto.prototype, "pdfBase64", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File size in bytes',
        example: 45678,
    }),
    __metadata("design:type", Number)
], CertificateResponseDto.prototype, "fileSizeBytes", void 0);
//# sourceMappingURL=certificate-response.dto.js.map