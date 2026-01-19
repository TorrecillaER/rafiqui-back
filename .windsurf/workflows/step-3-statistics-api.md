---
description: Módulo de Estadísticas para la API
---

# Crear Módulo de Estadísticas ESG

Este workflow crea los endpoints necesarios para el dashboard de estadísticas y el marketplace.

## Contexto

El frontend necesita endpoints para:
- Estadísticas ESG (CO2 ahorrado, paneles reciclados, etc.)
- Lista de Assets disponibles para el marketplace
- Métricas de inspecciones

## Pasos

### 1. Crear módulo de estadísticas

```bash
nest g module statistics
nest g service statistics
nest g controller statistics
```

### 2. Crear DTOs de respuesta

Crear `src/statistics/dto/statistics-response.dto.ts`:

```typescript
export class ESGMetricsDto {
  co2Saved: number;           // kg de CO2 ahorrado
  treesEquivalent: number;    // Árboles equivalentes
  energySaved: number;        // kWh recuperados
  waterSaved: number;         // Litros de agua ahorrados
  panelsRecycled: number;     // Total de paneles procesados
  panelsReused: number;       // Paneles para reuso
  panelsRecycledMaterial: number; // Paneles triturados
}

export class MonthlyDataDto {
  month: string;
  co2: number;
  panels: number;
  energy: number;
}

export class MaterialDistributionDto {
  name: string;
  value: number;
  color: string;
}

export class DashboardStatsDto {
  esgMetrics: ESGMetricsDto;
  monthlyData: MonthlyDataDto[];
  materialDistribution: MaterialDistributionDto[];
}

export class MarketAssetDto {
  id: string;
  nfcTagId: string;
  brand: string;
  model: string;
  status: string;
  inspectionResult: string;
  measuredVoltage: number;
  measuredAmps: number;
  photoUrl: string;
  createdAt: Date;
}

export class MaterialStockDto {
  type: string;
  name: string;
  quantity: number;      // toneladas
  pricePerTon: number;   // USD
  available: boolean;
}
```

### 3. Implementar servicio de estadísticas

Crear `src/statistics/statistics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ESGMetricsDto,
  DashboardStatsDto,
  MonthlyDataDto,
  MaterialDistributionDto,
  MarketAssetDto,
  MaterialStockDto,
} from './dto/statistics-response.dto';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  // Constantes para cálculos ESG
  private readonly CO2_PER_PANEL = 17.8;      // kg CO2 por panel
  private readonly TREES_PER_PANEL = 0.89;    // árboles equivalentes
  private readonly ENERGY_PER_PANEL = 49.2;   // kWh
  private readonly WATER_PER_PANEL = 350;     // litros

  async getESGMetrics(): Promise<ESGMetricsDto> {
    const totalPanels = await this.prisma.asset.count();
    const reusedPanels = await this.prisma.asset.count({
      where: { status: 'REUSED' },
    });
    const recycledPanels = await this.prisma.asset.count({
      where: { status: 'RECYCLED' },
    });

    return {
      co2Saved: Math.round(totalPanels * this.CO2_PER_PANEL),
      treesEquivalent: Math.round(totalPanels * this.TREES_PER_PANEL),
      energySaved: Math.round(totalPanels * this.ENERGY_PER_PANEL),
      waterSaved: Math.round(totalPanels * this.WATER_PER_PANEL),
      panelsRecycled: totalPanels,
      panelsReused: reusedPanels,
      panelsRecycledMaterial: recycledPanels,
    };
  }

  async getMonthlyData(): Promise<MonthlyDataDto[]> {
    // Obtener datos de los últimos 12 meses
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    
    const monthlyData: MonthlyDataDto[] = [];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const year = new Date().getFullYear() - (currentMonth - 11 + i < 0 ? 1 : 0);
      
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);

      const panelsCount = await this.prisma.asset.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      monthlyData.push({
        month: months[monthIndex],
        panels: panelsCount,
        co2: Math.round(panelsCount * this.CO2_PER_PANEL),
        energy: Math.round(panelsCount * this.ENERGY_PER_PANEL),
      });
    }

    return monthlyData;
  }

  async getMaterialDistribution(): Promise<MaterialDistributionDto[]> {
    // Distribución típica de materiales en paneles solares
    const totalPanels = await this.prisma.asset.count({
      where: { status: 'RECYCLED' },
    });

    // Porcentajes aproximados de materiales en un panel solar
    return [
      { name: 'Aluminio', value: 35, color: '#94A3B8' },
      { name: 'Vidrio', value: 40, color: '#22D3EE' },
      { name: 'Silicio', value: 15, color: '#A78BFA' },
      { name: 'Cobre', value: 10, color: '#F97316' },
    ];
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [esgMetrics, monthlyData, materialDistribution] = await Promise.all([
      this.getESGMetrics(),
      this.getMonthlyData(),
      this.getMaterialDistribution(),
    ]);

    return {
      esgMetrics,
      monthlyData,
      materialDistribution,
    };
  }

  // Marketplace: Assets disponibles para reuso
  async getAvailableAssets(): Promise<MarketAssetDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        status: { in: ['WAREHOUSE_RECEIVED', 'INSPECTED'] },
      },
      include: {
        inspection: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map((asset) => ({
      id: asset.id,
      nfcTagId: asset.nfcTagId || '',
      brand: asset.brand || 'Desconocido',
      model: asset.model || 'Genérico',
      status: asset.status,
      inspectionResult: asset.inspection?.aiRecommendation || 'PENDING',
      measuredVoltage: asset.inspection?.measuredVoltage || 0,
      measuredAmps: asset.inspection?.measuredAmps || 0,
      photoUrl: asset.inspection?.photoUrl || '',
      createdAt: asset.createdAt,
    }));
  }

  // Marketplace: Stock de materiales reciclados
  async getMaterialStock(): Promise<MaterialStockDto[]> {
    const recycledCount = await this.prisma.asset.count({
      where: { status: 'RECYCLED' },
    });

    // Peso promedio de un panel: ~20kg
    const totalWeight = recycledCount * 20; // kg
    const totalTons = totalWeight / 1000;

    return [
      {
        type: 'aluminum',
        name: 'Aluminio Reciclado',
        quantity: Math.round(totalTons * 0.35 * 10) / 10,
        pricePerTon: 2800,
        available: true,
      },
      {
        type: 'glass',
        name: 'Vidrio Solar Premium',
        quantity: Math.round(totalTons * 0.40 * 10) / 10,
        pricePerTon: 450,
        available: true,
      },
      {
        type: 'silicon',
        name: 'Silicio Purificado',
        quantity: Math.round(totalTons * 0.15 * 10) / 10,
        pricePerTon: 15000,
        available: true,
      },
      {
        type: 'copper',
        name: 'Cobre Recuperado',
        quantity: Math.round(totalTons * 0.10 * 10) / 10,
        pricePerTon: 8500,
        available: recycledCount > 10,
      },
    ];
  }

  // Estadísticas de solicitudes de recolección
  async getCollectionStats() {
    const total = await this.prisma.collectionRequest.count();
    const pending = await this.prisma.collectionRequest.count({
      where: { status: 'PENDING' },
    });
    const completed = await this.prisma.collectionRequest.count({
      where: { status: 'COMPLETED' },
    });

    return {
      total,
      pending,
      completed,
      inProgress: total - pending - completed,
    };
  }
}
```

### 4. Implementar controlador

Crear `src/statistics/statistics.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }

  @Get('esg')
  async getESGMetrics() {
    return this.statisticsService.getESGMetrics();
  }

  @Get('monthly')
  async getMonthlyData() {
    return this.statisticsService.getMonthlyData();
  }

  @Get('materials')
  async getMaterialDistribution() {
    return this.statisticsService.getMaterialDistribution();
  }

  @Get('market/assets')
  async getAvailableAssets() {
    return this.statisticsService.getAvailableAssets();
  }

  @Get('market/materials')
  async getMaterialStock() {
    return this.statisticsService.getMaterialStock();
  }

  @Get('collections')
  async getCollectionStats() {
    return this.statisticsService.getCollectionStats();
  }
}
```

### 5. Registrar módulo

Actualizar `src/statistics/statistics.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
```

### 6. Importar en AppModule

Actualizar `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CollectionRequestsModule } from './collection-requests/collection-requests.module';
import { AssetsModule } from './assets/assets.module';
import { InspectionsModule } from './inspections/inspections.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    PrismaModule,
    CollectionRequestsModule,
    AssetsModule,
    InspectionsModule,
    StatisticsModule,
  ],
})
export class AppModule {}
```

// turbo
### 7. Verificar endpoints

```bash
# Iniciar servidor
npm run start:dev

# Probar endpoints
curl http://localhost:3001/statistics/dashboard
curl http://localhost:3001/statistics/esg
curl http://localhost:3001/statistics/market/assets
curl http://localhost:3001/statistics/market/materials
```

## Endpoints Creados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/statistics/dashboard` | Todas las estadísticas del dashboard |
| GET | `/statistics/esg` | Métricas ESG (CO2, árboles, energía) |
| GET | `/statistics/monthly` | Datos mensuales para gráficas |
| GET | `/statistics/materials` | Distribución de materiales |
| GET | `/statistics/market/assets` | Assets disponibles para venta |
| GET | `/statistics/market/materials` | Stock de materiales reciclados |
| GET | `/statistics/collections` | Estadísticas de solicitudes |

## Verificación Final

- [ ] Módulo de estadísticas creado
- [ ] Servicio con cálculos ESG implementado
- [ ] Controlador con todos los endpoints
- [ ] Endpoints responden correctamente
- [ ] Datos calculados desde la BD real

## Siguiente Paso

Continúa con los workflows del frontend para conectar el marketplace y dashboard con estos endpoints.
