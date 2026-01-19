---
description: Crear endpoint de datos para gráficas del dashboard con datos reales
---

# Step 25: Dashboard Charts Backend - Datos Reales para Gráficas

Este workflow implementa el endpoint que provee datos reales para las 4 gráficas del dashboard:
1. **CO₂ Ahorrado por Mes** (línea)
2. **Distribución de Materiales** (donut)
3. **Paneles Reciclados por Mes** (barras)
4. **Energía Recuperada por Mes** (área)

## Endpoint a Crear

```
GET /dashboard/charts
```

### Respuesta esperada:
```json
{
  "co2ByMonth": [
    { "month": "Feb", "value": 0 },
    { "month": "Mar", "value": 0 },
    ...
    { "month": "Ene", "value": 356 }
  ],
  "materialDistribution": [
    { "name": "Aluminio", "value": 35, "color": "#94A3B8" },
    { "name": "Vidrio", "value": 40, "color": "#22D3EE" },
    { "name": "Silicio", "value": 15, "color": "#A78BFA" },
    { "name": "Cobre", "value": 10, "color": "#F97316" }
  ],
  "panelsByMonth": [
    { "month": "Feb", "value": 0 },
    ...
    { "month": "Ene", "value": 20 }
  ],
  "energyByMonth": [
    { "month": "Feb", "value": 0 },
    ...
    { "month": "Ene", "value": 984 }
  ]
}
```

---

## Paso 1: Agregar método de gráficas al servicio

En `src/dashboard/dashboard-metrics.service.ts`, agregar:

```typescript
export interface ChartDataPoint {
  month: string;
  value: number;
}

export interface MaterialDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardCharts {
  co2ByMonth: ChartDataPoint[];
  materialDistribution: MaterialDistributionItem[];
  panelsByMonth: ChartDataPoint[];
  energyByMonth: ChartDataPoint[];
}

// Colores para materiales
const MATERIAL_COLORS = {
  ALUMINUM: '#94A3B8',
  GLASS: '#22D3EE',
  SILICON: '#A78BFA',
  COPPER: '#F97316',
};

// Nombres en español
const MATERIAL_NAMES = {
  ALUMINUM: 'Aluminio',
  GLASS: 'Vidrio',
  SILICON: 'Silicio',
  COPPER: 'Cobre',
};

// Meses en español
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
```

Agregar el método `calculateCharts()`:

```typescript
async calculateCharts(): Promise<DashboardCharts> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Obtener todos los registros de reciclaje de los últimos 12 meses
  const recycleRecords = await this.prisma.recycleRecord.findMany({
    where: {
      createdAt: { gte: twelveMonthsAgo },
    },
    select: {
      createdAt: true,
      aluminumKg: true,
      glassKg: true,
      siliconKg: true,
      copperKg: true,
    },
  });

  // Obtener paneles procesados (reuso) de los últimos 12 meses
  const reusedAssets = await this.prisma.asset.findMany({
    where: {
      status: {
        in: [AssetStatus.REUSED, AssetStatus.LISTED_FOR_SALE, AssetStatus.READY_FOR_REUSE],
      },
      createdAt: { gte: twelveMonthsAgo },
    },
    select: {
      createdAt: true,
      measuredPowerWatts: true,
      healthPercentage: true,
    },
  });

  // Inicializar arrays de 12 meses
  const monthlyData = this.initializeMonthlyData(now);

  // Procesar registros de reciclaje
  recycleRecords.forEach(record => {
    const monthIndex = this.getMonthIndex(record.createdAt, now);
    if (monthIndex >= 0 && monthIndex < 12) {
      // CO2 del reciclaje (aluminio × 11.5)
      monthlyData[monthIndex].co2 += record.aluminumKg * FACTORS.CO2_PER_KG_ALUMINUM;
      monthlyData[monthIndex].panels += 1;
    }
  });

  // Procesar paneles de reuso
  reusedAssets.forEach(asset => {
    const monthIndex = this.getMonthIndex(asset.createdAt, now);
    if (monthIndex >= 0 && monthIndex < 12) {
      const watts = asset.measuredPowerWatts || FACTORS.DEFAULT_PANEL_WATTS;
      const health = (asset.healthPercentage || 80) / 100;
      
      // Energía anual del panel
      const kWhPerYear = (watts * health / 1000) * FACTORS.SOLAR_HOURS_PER_DAY * 365;
      
      // CO2 de la energía (kWh × 0.423)
      monthlyData[monthIndex].co2 += kWhPerYear * FACTORS.CO2_PER_KWH;
      monthlyData[monthIndex].energy += kWhPerYear;
      monthlyData[monthIndex].panels += 1;
    }
  });

  // Calcular distribución de materiales (totales)
  const totalMaterials = await this.prisma.recycleRecord.aggregate({
    _sum: {
      aluminumKg: true,
      glassKg: true,
      siliconKg: true,
      copperKg: true,
    },
  });

  const materialDistribution = this.calculateMaterialDistribution(totalMaterials._sum);

  // Formatear datos para las gráficas
  return {
    co2ByMonth: monthlyData.map(d => ({ month: d.month, value: Math.round(d.co2) })),
    materialDistribution,
    panelsByMonth: monthlyData.map(d => ({ month: d.month, value: d.panels })),
    energyByMonth: monthlyData.map(d => ({ month: d.month, value: Math.round(d.energy) })),
  };
}

private initializeMonthlyData(now: Date): { month: string; co2: number; panels: number; energy: number }[] {
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({
      month: MONTHS_ES[date.getMonth()],
      co2: 0,
      panels: 0,
      energy: 0,
    });
  }
  return data;
}

private getMonthIndex(date: Date, now: Date): number {
  const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  return 11 - monthsDiff;
}

private calculateMaterialDistribution(
  sums: { aluminumKg: number | null; glassKg: number | null; siliconKg: number | null; copperKg: number | null }
): MaterialDistributionItem[] {
  const aluminum = sums.aluminumKg || 0;
  const glass = sums.glassKg || 0;
  const silicon = sums.siliconKg || 0;
  const copper = sums.copperKg || 0;
  const total = aluminum + glass + silicon + copper;

  if (total === 0) {
    // Datos por defecto si no hay materiales
    return [
      { name: 'Aluminio', value: 25, color: MATERIAL_COLORS.ALUMINUM },
      { name: 'Vidrio', value: 40, color: MATERIAL_COLORS.GLASS },
      { name: 'Silicio', value: 25, color: MATERIAL_COLORS.SILICON },
      { name: 'Cobre', value: 10, color: MATERIAL_COLORS.COPPER },
    ];
  }

  return [
    { name: 'Aluminio', value: Math.round((aluminum / total) * 100), color: MATERIAL_COLORS.ALUMINUM },
    { name: 'Vidrio', value: Math.round((glass / total) * 100), color: MATERIAL_COLORS.GLASS },
    { name: 'Silicio', value: Math.round((silicon / total) * 100), color: MATERIAL_COLORS.SILICON },
    { name: 'Cobre', value: Math.round((copper / total) * 100), color: MATERIAL_COLORS.COPPER },
  ];
}
```

---

## Paso 2: Agregar endpoint al controlador

En `src/dashboard/dashboard.controller.ts`, agregar:

```typescript
@Get('charts')
async getCharts() {
  return this.metricsService.calculateCharts();
}
```

---

## Paso 3: Probar el endpoint

```bash
curl http://localhost:4000/dashboard/charts | jq
```

---

## Datos que se obtienen de la BD

| Gráfica | Fuente de Datos | Cálculo |
|---------|-----------------|---------|
| CO₂ por Mes | `RecycleRecord` + `Asset` (reuso) | (aluminio × 11.5) + (energía × 0.423) |
| Distribución Materiales | `RecycleRecord` (totales) | Porcentaje de cada material |
| Paneles por Mes | `RecycleRecord` + `Asset` | Conteo por mes |
| Energía por Mes | `Asset` (reuso) | (W × salud × 5.5 × 365) / 1000 |

---

## Notas

- Los datos se agrupan por los últimos 12 meses
- Los meses se muestran en español (Ene, Feb, Mar...)
- Si no hay datos de materiales, se muestran porcentajes por defecto
- Los colores de materiales son consistentes con el diseño actual
