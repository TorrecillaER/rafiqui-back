import { DashboardMetricsService } from './dashboard-metrics.service';
import { EsgCertificateService } from './esg-certificate.service';
import { FullReportService } from './full-report.service';
import { CertificateResponseDto } from './dto/certificate-response.dto';
import { FullReportResponseDto } from './dto/full-report-response.dto';
export declare class DashboardController {
    private metricsService;
    private certificateService;
    private fullReportService;
    constructor(metricsService: DashboardMetricsService, certificateService: EsgCertificateService, fullReportService: FullReportService);
    getMetrics(): Promise<import("./dashboard-metrics.service").DashboardMetrics>;
    getCharts(): Promise<import("./dashboard-metrics.service").DashboardCharts>;
    generateCertificate(userId?: string): Promise<CertificateResponseDto>;
    generateFullReport(): Promise<FullReportResponseDto>;
}
