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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_metrics_service_1 = require("./dashboard-metrics.service");
const esg_certificate_service_1 = require("./esg-certificate.service");
const full_report_service_1 = require("./full-report.service");
const certificate_response_dto_1 = require("./dto/certificate-response.dto");
const full_report_response_dto_1 = require("./dto/full-report-response.dto");
let DashboardController = class DashboardController {
    metricsService;
    certificateService;
    fullReportService;
    constructor(metricsService, certificateService, fullReportService) {
        this.metricsService = metricsService;
        this.certificateService = certificateService;
        this.fullReportService = fullReportService;
    }
    async getMetrics() {
        return this.metricsService.calculateMetrics();
    }
    async getCharts() {
        return this.metricsService.calculateCharts();
    }
    async generateCertificate(userId) {
        const pdfBuffer = await this.certificateService.generateCertificate(userId);
        const certificateId = `RAFIQUI-ESG-${Date.now().toString(36).toUpperCase()}`;
        let partnerName = 'Socio Rafiqui';
        if (userId) {
            const user = await this.certificateService['prisma'].user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            if (user) {
                partnerName = user.name;
            }
        }
        return {
            certificateId,
            issuedAt: new Date(),
            partnerName,
            pdfBase64: pdfBuffer.toString('base64'),
            fileSizeBytes: pdfBuffer.length,
        };
    }
    async generateFullReport() {
        const pdfBuffer = await this.fullReportService.generateReport();
        const reportId = `RAFIQUI-RPT-${Date.now().toString(36).toUpperCase()}`;
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        return {
            reportId,
            generatedAt: now,
            periodStart: twelveMonthsAgo,
            periodEnd: now,
            pdfBase64: pdfBuffer.toString('base64'),
            fileSizeBytes: pdfBuffer.length,
            pageCount: 6,
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener métricas ESG del dashboard' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('charts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener datos para gráficas del dashboard',
        description: 'Retorna datos de los últimos 12 meses para: CO₂ ahorrado, distribución de materiales, paneles reciclados y energía recuperada'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Datos de gráficas obtenidos exitosamente' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getCharts", null);
__decorate([
    (0, common_1.Get)('esg-certificate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generar certificado ESG en PDF',
        description: 'Genera un certificado PDF con las métricas ESG actuales. Opcionalmente puede incluir datos de un usuario específico.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'userId',
        required: false,
        description: 'ID del usuario/socio para personalizar el certificado',
        type: String
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Certificado generado exitosamente',
        type: certificate_response_dto_1.CertificateResponseDto
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/certificate-response.dto").CertificateResponseDto }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "generateCertificate", null);
__decorate([
    (0, common_1.Get)('full-report'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generar reporte ESG completo en PDF',
        description: 'Genera un reporte detallado de 6 páginas con métricas ESG, datos históricos, materiales reciclados, operaciones y metodología. Incluye tablas y datos de los últimos 12 meses.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Reporte completo generado exitosamente',
        type: full_report_response_dto_1.FullReportResponseDto
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/full-report-response.dto").FullReportResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "generateFullReport", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_metrics_service_1.DashboardMetricsService,
        esg_certificate_service_1.EsgCertificateService,
        full_report_service_1.FullReportService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map