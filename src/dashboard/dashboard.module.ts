import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { EsgCertificateService } from './esg-certificate.service';
import { FullReportService } from './full-report.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [DashboardController],
  providers: [DashboardMetricsService, EsgCertificateService, FullReportService],
  exports: [DashboardMetricsService],
})
export class DashboardModule {}
