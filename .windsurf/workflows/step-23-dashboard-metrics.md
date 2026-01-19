---
description: Implementar métricas ESG del dashboard con datos reales
---

# Step 23: Dashboard Metrics - Métricas ESG con Datos Reales

Este workflow implementa el cálculo de las 5 métricas principales del dashboard usando datos reales de la base de datos.

## Fórmulas Implementadas

### 1. CO2 Ahorrado (kg)
```
CO2 = (E_gen × F_red) + (M_rec × F_mat)
```
- `E_gen`: Energía generada estimada (kWh) de paneles reusados
- `F_red`: Factor de emisión de red eléctrica México = **0.423 kg CO2/kWh**
- `M_rec`: Masa de aluminio reciclado (kg)
- `F_mat`: Factor de ahorro material aluminio = **11.5 kg CO2/kg**

### 2. Árboles Equivalentes
```
Árboles = CO2_Total / 20
```
- Un árbol maduro absorbe ~20 kg CO2/año (EPA/Arbor Day Foundation)

### 3. Energía Recuperada (kWh → MWh)
```
E_rec = Σ(P_panel × H_solar × 365 × V_restante)
```
- `P_panel`: Potencia medida del panel (kW)
- `H_solar`: Horas Solar Pico México = **5.5 horas/día**
- `V_restante`: Vida útil restante estimada (años)

### 4. Agua Ahorrada (Litros)
```
H2O = (E_gen × F_agua_red) + (M_rec_alum × F_agua_min)
```
- `F_agua_red`: Factor hídrico red eléctrica = **0.7 L/kWh**
- `F_agua_min`: Huella hídrica aluminio virgen = **20 L/kg**

### 5. Paneles Procesados
- Cuenta total de assets con status: REUSED, RECYCLED, LISTED_FOR_SALE, ART_LISTED_FOR_SALE

---

## Paso 1: Crear el servicio de métricas del dashboard

Crear archivo `src/dashboard/dashboard-metrics.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetStatus } from '@prisma/client';

// Constantes de factores de conversión (México/Estándares internacionales)
const FACTORS = {
  // Factor de emisión de la red eléctrica México (CRE/Semarnat)
  CO2_PER_KWH: 0.423, // kg CO2/kWh
  
  // Factor de ahorro por aluminio reciclado vs virgen
  CO2_PER_KG_ALUMINUM: 11.5, // kg CO2/kg aluminio
  
  // Absorción de CO2 por árbol maduro (EPA/Arbor Day Foundation)
  CO2_PER_TREE_YEAR: 20, // kg CO2/año
  
  // Horas Solar Pico promedio México
  SOLAR_HOURS_PER_DAY: 5.5,
  
  // Factor hídrico de la red eléctrica (NREL - Ciclo Combinado)
  WATER_PER_KWH: 0.7, // Litros/kWh
  
  // Huella hídrica del aluminio virgen
  WATER_PER_KG_ALUMINUM: 20, // Litros/kg
  
  // Vida útil restante estimada por defecto (años)
  DEFAULT_REMAINING_LIFE_YEARS: 15,
  
  // Potencia promedio de panel si no hay medición (Watts)
  DEFAULT_PANEL_WATTS: 300,
};

export interface DashboardMetrics {
  co2Saved: {
    value: number;
    unit: string;
    breakdown: {
      fromEnergy: number;
      fromRecycling: number;
    };
  };
  treesEquivalent: {
    value: number;
    description: string;
  };
  energyRecovered: {
    value: number;
    unit: string;
    homesPerYear: number;
  };
  waterSaved: {
    value: number;
    unit: string;
    breakdown: {
      fromEnergy: number;
      fromRecycling: number;
    };
  };
  panelsProcessed: {
    total: number;
    reused: number;
    recycled: number;
    art: number;
  };
}

@Injectable()
export class DashboardMetricsService {
  private readonly logger = new Logger(DashboardMetricsService.name);

  constructor(private prisma: PrismaService) {}

  async calculateMetrics(): Promise<DashboardMetrics> {
    // Obtener datos de paneles reusados
    const reusedPanels = await this.prisma.asset.findMany({
      where: {
        status: {
          in: [AssetStatus.REUSED, AssetStatus.LISTED_FOR_SALE, AssetStatus.READY_FOR_REUSE],
        },
      },
      select: {
        id: true,
        measuredPowerWatts: true,
        healthPercentage: true,
      },
    });

    // Obtener datos de reciclaje
    const recycleRecords = await this.prisma.recycleRecord.findMany({
      select: {
        aluminumKg: true,
        glassKg: true,
        siliconKg: true,
        copperKg: true,
      },
    });

    // Obtener paneles de arte
    const artPanels = await this.prisma.asset.count({
      where: {
        status: {
          in: [AssetStatus.ART_CANDIDATE, AssetStatus.ART_LISTED_FOR_SALE],
        },
      },
    });

    // Calcular energía generada estimada (kWh)
    const energyGenerated = this.calculateEnergyGenerated(reusedPanels);

    // Calcular aluminio reciclado total (kg)
    const totalAluminumKg = recycleRecords.reduce(
      (sum, record) => sum + record.aluminumKg,
      0
    );

    // 1. CO2 Ahorrado
    const co2FromEnergy = energyGenerated * FACTORS.CO2_PER_KWH;
    const co2FromRecycling = totalAluminumKg * FACTORS.CO2_PER_KG_ALUMINUM;
    const totalCo2 = co2FromEnergy + co2FromRecycling;

    // 2. Árboles Equivalentes
    const treesEquivalent = Math.round(totalCo2 / FACTORS.CO2_PER_TREE_YEAR);

    // 3. Energía Recuperada (convertir a MWh si es grande)
    const energyUnit = energyGenerated >= 1000 ? 'MWh' : 'kWh';
    const energyValue = energyGenerated >= 1000 
      ? Math.round(energyGenerated / 1000 * 10) / 10 
      : Math.round(energyGenerated);
    
    // Hogares alimentados (consumo promedio hogar México: ~250 kWh/mes = 3000 kWh/año)
    const homesPerYear = Math.round(energyGenerated / 3000);

    // 4. Agua Ahorrada
    const waterFromEnergy = energyGenerated * FACTORS.WATER_PER_KWH;
    const waterFromRecycling = totalAluminumKg * FACTORS.WATER_PER_KG_ALUMINUM;
    const totalWater = waterFromEnergy + waterFromRecycling;

    // 5. Paneles Procesados
    const panelsProcessed = {
      total: reusedPanels.length + recycleRecords.length + artPanels,
      reused: reusedPanels.length,
      recycled: recycleRecords.length,
      art: artPanels,
    };

    return {
      co2Saved: {
        value: Math.round(totalCo2),
        unit: totalCo2 >= 1000 ? 'ton' : 'kg',
        breakdown: {
          fromEnergy: Math.round(co2FromEnergy),
          fromRecycling: Math.round(co2FromRecycling),
        },
      },
      treesEquivalent: {
        value: treesEquivalent,
        description: `Plantados durante 10 años`,
      },
      energyRecovered: {
        value: energyValue,
        unit: energyUnit,
        homesPerYear,
      },
      waterSaved: {
        value: Math.round(totalWater),
        unit: totalWater >= 1000 ? 'm³' : 'L',
        breakdown: {
          fromEnergy: Math.round(waterFromEnergy),
          fromRecycling: Math.round(waterFromRecycling),
        },
      },
      panelsProcessed,
    };
  }

  /**
   * Calcula la energía total generada estimada por paneles reusados
   * Fórmula: (Watts/1000) × 5.5 HSP × 365 días × años_restantes
   */
  private calculateEnergyGenerated(
    panels: { measuredPowerWatts: number | null; healthPercentage: number | null }[]
  ): number {
    return panels.reduce((total, panel) => {
      const watts = panel.measuredPowerWatts || FACTORS.DEFAULT_PANEL_WATTS;
      const healthFactor = (panel.healthPercentage || 80) / 100;
      const effectiveWatts = watts * healthFactor;
      
      // kWh por año = (W/1000) × HSP × 365
      const kWhPerYear = (effectiveWatts / 1000) * FACTORS.SOLAR_HOURS_PER_DAY * 365;
      
      // Total en vida restante
      const totalKWh = kWhPerYear * FACTORS.DEFAULT_REMAINING_LIFE_YEARS;
      
      return total + totalKWh;
    }, 0);
  }
}
```

---

## Paso 2: Crear el controlador del dashboard

Crear archivo `src/dashboard/dashboard.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { DashboardMetricsService } from './dashboard-metrics.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private metricsService: DashboardMetricsService) {}

  @Get('metrics')
  async getMetrics() {
    return this.metricsService.calculateMetrics();
  }
}
```

---

## Paso 3: Crear el módulo del dashboard

Crear archivo `src/dashboard/dashboard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardMetricsService],
  exports: [DashboardMetricsService],
})
export class DashboardModule {}
```

---

## Paso 4: Registrar el módulo en AppModule

En `src/app.module.ts`, agregar:

```typescript
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // ... otros módulos
    DashboardModule,
  ],
})
export class AppModule {}
```

---

## Paso 5: Probar el endpoint

```bash
curl http://localhost:4000/dashboard/metrics | jq
```

Respuesta esperada:
```json
{
  "co2Saved": {
    "value": 356,
    "unit": "kg",
    "breakdown": {
      "fromEnergy": 200,
      "fromRecycling": 156
    }
  },
  "treesEquivalent": {
    "value": 18,
    "description": "Plantados durante 10 años"
  },
  "energyRecovered": {
    "value": 984,
    "unit": "kWh",
    "homesPerYear": 0
  },
  "waterSaved": {
    "value": 7000,
    "unit": "L",
    "breakdown": {
      "fromEnergy": 6500,
      "fromRecycling": 500
    }
  },
  "panelsProcessed": {
    "total": 20,
    "reused": 10,
    "recycled": 7,
    "art": 3
  }
}
```

---

## Constantes y Fuentes

| Factor | Valor | Fuente |
|--------|-------|--------|
| CO2/kWh Red México | 0.423 kg | CRE/Semarnat |
| CO2/kg Aluminio | 11.5 kg | Estándar industrial |
| CO2/Árbol/Año | 20 kg | EPA/Arbor Day Foundation |
| HSP México | 5.5 h/día | Promedio nacional |
| Agua/kWh | 0.7 L | NREL Ciclo Combinado |
| Agua/kg Aluminio | 20 L | Promedio industrial |
