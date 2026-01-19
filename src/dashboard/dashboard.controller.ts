import { Controller, Get, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { EsgCertificateService } from './esg-certificate.service';
import { FullReportService } from './full-report.service';
import { CertificateResponseDto } from './dto/certificate-response.dto';
import { FullReportResponseDto } from './dto/full-report-response.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private metricsService: DashboardMetricsService,
    private certificateService: EsgCertificateService,
    private fullReportService: FullReportService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Obtener métricas ESG del dashboard' })
  async getMetrics() {
    return this.metricsService.calculateMetrics();
  }

  @Get('charts')
  @ApiOperation({ 
    summary: 'Obtener datos para gráficas del dashboard',
    description: 'Retorna datos de los últimos 12 meses para: CO₂ ahorrado, distribución de materiales, paneles reciclados y energía recuperada'
  })
  @ApiResponse({ status: 200, description: 'Datos de gráficas obtenidos exitosamente' })
  async getCharts() {
    return this.metricsService.calculateCharts();
  }

  @Get('esg-certificate')
  @ApiOperation({ 
    summary: 'Generar certificado ESG en PDF',
    description: 'Genera un certificado PDF con las métricas ESG actuales. Opcionalmente puede incluir datos de un usuario específico.'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    description: 'ID del usuario/socio para personalizar el certificado',
    type: String 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Certificado generado exitosamente',
    type: CertificateResponseDto 
  })
  async generateCertificate(@Query('userId') userId?: string): Promise<CertificateResponseDto> {
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

  @Get('full-report')
  @ApiOperation({ 
    summary: 'Generar reporte ESG completo en PDF',
    description: 'Genera un reporte detallado de 6 páginas con métricas ESG, datos históricos, materiales reciclados, operaciones y metodología. Incluye tablas y datos de los últimos 12 meses.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reporte completo generado exitosamente',
    type: FullReportResponseDto 
  })
  async generateFullReport(): Promise<FullReportResponseDto> {
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
}
