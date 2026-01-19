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
  
  // Ya no usamos proyección a 15 años, calculamos impacto anual
  // DEFAULT_REMAINING_LIFE_YEARS: 15, // Removido - ahora usamos datos anuales
  
  // Potencia promedio de panel si no hay medición (Watts)
  DEFAULT_PANEL_WATTS: 300,
  
  // Consumo promedio hogar México (kWh/año)
  HOME_CONSUMPTION_KWH_YEAR: 3000,
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

@Injectable()
export class DashboardMetricsService {
  private readonly logger = new Logger(DashboardMetricsService.name);

  constructor(private prisma: PrismaService) {}

  async calculateMetrics(): Promise<DashboardMetrics> {
    // Obtener datos de paneles reusados (incluye los que están en proceso de reuso)
    const reusedPanels = await this.prisma.asset.findMany({
      where: {
        status: {
          in: [
            AssetStatus.REUSED,
            AssetStatus.LISTED_FOR_SALE,
            AssetStatus.READY_FOR_REUSE,
            AssetStatus.REFURBISHING,
          ],
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
    // Fórmula: CO2 = (E_gen × F_red) + (M_rec × F_mat)
    const co2FromEnergy = energyGenerated * FACTORS.CO2_PER_KWH;
    const co2FromRecycling = totalAluminumKg * FACTORS.CO2_PER_KG_ALUMINUM;
    const totalCo2 = co2FromEnergy + co2FromRecycling;

    // 2. Árboles Equivalentes
    // Fórmula: Árboles = CO2_Total / 20
    const treesEquivalent = Math.round(totalCo2 / FACTORS.CO2_PER_TREE_YEAR);

    // 3. Energía Recuperada
    // Mostrar en kWh o MWh según magnitud
    const energyUnit = energyGenerated >= 1000 ? 'MWh' : 'kWh';
    const energyValue = energyGenerated >= 1000 
      ? Math.round(energyGenerated / 1000 * 10) / 10 
      : Math.round(energyGenerated);
    
    // Hogares alimentados por año
    const homesPerYear = Math.round(energyGenerated / FACTORS.HOME_CONSUMPTION_KWH_YEAR);

    // 4. Agua Ahorrada
    // Fórmula: H2O = (E_gen × F_agua_red) + (M_rec_alum × F_agua_min)
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

    this.logger.log(`Dashboard metrics calculated: CO2=${Math.round(totalCo2)}kg, Trees=${treesEquivalent}, Energy=${energyValue}${energyUnit}, Water=${Math.round(totalWater)}L, Panels=${panelsProcessed.total}`);

    return {
      co2Saved: {
        value: totalCo2 >= 1000 ? Math.round(totalCo2 / 1000 * 10) / 10 : Math.round(totalCo2),
        unit: totalCo2 >= 1000 ? 'ton' : 'kg',
        breakdown: {
          fromEnergy: Math.round(co2FromEnergy),
          fromRecycling: Math.round(co2FromRecycling),
        },
      },
      treesEquivalent: {
        value: treesEquivalent,
        description: 'Equivalente anual',
      },
      energyRecovered: {
        value: energyValue,
        unit: energyUnit,
        homesPerYear,
      },
      waterSaved: {
        value: totalWater >= 1000 ? Math.round(totalWater / 1000 * 10) / 10 : Math.round(totalWater),
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
   * Calcula la energía ANUAL generada estimada por paneles reusados
   * Fórmula: E_anual = Σ(P_panel × H_solar × 365)
   * Donde:
   * - P_panel: Potencia del panel en kW
   * - H_solar: Horas Solar Pico (5.5 h/día para México)
   * - 365: Días del año
   */
  private calculateEnergyGenerated(
    panels: { measuredPowerWatts: number | null; healthPercentage: number | null }[]
  ): number {
    return panels.reduce((total, panel) => {
      // Usar potencia medida o valor por defecto
      const watts = panel.measuredPowerWatts || FACTORS.DEFAULT_PANEL_WATTS;
      
      // Ajustar por salud del panel (si está disponible)
      const healthFactor = (panel.healthPercentage || 80) / 100;
      const effectiveWatts = watts * healthFactor;
      
      // kWh por año = (W/1000) × HSP × 365
      const kWhPerYear = (effectiveWatts / 1000) * FACTORS.SOLAR_HOURS_PER_DAY * 365;
      
      // Retornar energía ANUAL (no proyectada a 15 años)
      return total + kWhPerYear;
    }, 0);
  }

  /**
   * Calcula datos para las gráficas del dashboard
   */
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

    this.logger.log(`Dashboard charts calculated for last 12 months`);

    // Formatear datos para las gráficas
    return {
      co2ByMonth: monthlyData.map(d => ({ month: d.month, value: Math.round(d.co2) })),
      materialDistribution,
      panelsByMonth: monthlyData.map(d => ({ month: d.month, value: d.panels })),
      energyByMonth: monthlyData.map(d => ({ month: d.month, value: Math.round(d.energy) })),
    };
  }

  private initializeMonthlyData(now: Date): { month: string; co2: number; panels: number; energy: number }[] {
    const data: { month: string; co2: number; panels: number; energy: number }[] = [];
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
        { name: MATERIAL_NAMES.ALUMINUM, value: 25, color: MATERIAL_COLORS.ALUMINUM },
        { name: MATERIAL_NAMES.GLASS, value: 40, color: MATERIAL_COLORS.GLASS },
        { name: MATERIAL_NAMES.SILICON, value: 25, color: MATERIAL_COLORS.SILICON },
        { name: MATERIAL_NAMES.COPPER, value: 10, color: MATERIAL_COLORS.COPPER },
      ];
    }

    return [
      { name: MATERIAL_NAMES.ALUMINUM, value: Math.round((aluminum / total) * 100), color: MATERIAL_COLORS.ALUMINUM },
      { name: MATERIAL_NAMES.GLASS, value: Math.round((glass / total) * 100), color: MATERIAL_COLORS.GLASS },
      { name: MATERIAL_NAMES.SILICON, value: Math.round((silicon / total) * 100), color: MATERIAL_COLORS.SILICON },
      { name: MATERIAL_NAMES.COPPER, value: Math.round((copper / total) * 100), color: MATERIAL_COLORS.COPPER },
    ];
  }
}
