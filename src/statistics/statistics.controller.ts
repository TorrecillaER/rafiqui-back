import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  DashboardStatsDto,
  ESGMetricsDto,
  MarketAssetDto,
  MaterialStockDto,
} from './dto/statistics-response.dto';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener estadísticas generales para el dashboard' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }

  @Get('esg')
  @ApiOperation({ summary: 'Obtener métricas ESG específicas' })
  @ApiResponse({ status: 200, type: ESGMetricsDto })
  async getESGMetrics() {
    return this.statisticsService.getESGMetrics();
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Obtener datos mensuales históricos' })
  async getMonthlyData() {
    return this.statisticsService.getMonthlyData();
  }

  @Get('materials')
  @ApiOperation({ summary: 'Obtener distribución de materiales en paneles' })
  async getMaterialDistribution() {
    return this.statisticsService.getMaterialDistribution();
  }

  @Get('market/assets')
  @ApiOperation({ summary: 'Obtener assets disponibles para el marketplace' })
  @ApiResponse({ status: 200, type: [MarketAssetDto] })
  async getAvailableAssets() {
    return this.statisticsService.getAvailableAssets();
  }

  @Get('market/materials')
  @ApiOperation({ summary: 'Obtener stock de materiales reciclados' })
  @ApiResponse({ status: 200, type: [MaterialStockDto] })
  async getMaterialStock() {
    return this.statisticsService.getMaterialStock();
  }

  @Get('market/art')
  @ApiOperation({ summary: 'Obtener obras de arte disponibles' })
  async getArt() {
    return this.statisticsService.getArt();
  }

  @Get('collections')
  @ApiOperation({ summary: 'Obtener estadísticas de recolección' })
  async getCollectionStats() {
    return this.statisticsService.getCollectionStats();
  }
}

