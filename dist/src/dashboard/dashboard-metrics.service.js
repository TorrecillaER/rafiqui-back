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
var DashboardMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const FACTORS = {
    CO2_PER_KWH: 0.423,
    CO2_PER_KG_ALUMINUM: 11.5,
    CO2_PER_TREE_YEAR: 20,
    SOLAR_HOURS_PER_DAY: 5.5,
    WATER_PER_KWH: 0.7,
    WATER_PER_KG_ALUMINUM: 20,
    DEFAULT_PANEL_WATTS: 300,
    HOME_CONSUMPTION_KWH_YEAR: 3000,
};
const MATERIAL_COLORS = {
    ALUMINUM: '#94A3B8',
    GLASS: '#22D3EE',
    SILICON: '#A78BFA',
    COPPER: '#F97316',
};
const MATERIAL_NAMES = {
    ALUMINUM: 'Aluminio',
    GLASS: 'Vidrio',
    SILICON: 'Silicio',
    COPPER: 'Cobre',
};
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
let DashboardMetricsService = DashboardMetricsService_1 = class DashboardMetricsService {
    prisma;
    logger = new common_1.Logger(DashboardMetricsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateMetrics() {
        const reusedPanels = await this.prisma.asset.findMany({
            where: {
                status: {
                    in: [
                        client_1.AssetStatus.REUSED,
                        client_1.AssetStatus.LISTED_FOR_SALE,
                        client_1.AssetStatus.READY_FOR_REUSE,
                        client_1.AssetStatus.REFURBISHING,
                    ],
                },
            },
            select: {
                id: true,
                measuredPowerWatts: true,
                healthPercentage: true,
            },
        });
        const recycleRecords = await this.prisma.recycleRecord.findMany({
            select: {
                aluminumKg: true,
                glassKg: true,
                siliconKg: true,
                copperKg: true,
            },
        });
        const artPanels = await this.prisma.asset.count({
            where: {
                status: {
                    in: [client_1.AssetStatus.ART_CANDIDATE, client_1.AssetStatus.ART_LISTED_FOR_SALE],
                },
            },
        });
        const energyGenerated = this.calculateEnergyGenerated(reusedPanels);
        const totalAluminumKg = recycleRecords.reduce((sum, record) => sum + record.aluminumKg, 0);
        const co2FromEnergy = energyGenerated * FACTORS.CO2_PER_KWH;
        const co2FromRecycling = totalAluminumKg * FACTORS.CO2_PER_KG_ALUMINUM;
        const totalCo2 = co2FromEnergy + co2FromRecycling;
        const treesEquivalent = Math.round(totalCo2 / FACTORS.CO2_PER_TREE_YEAR);
        const energyUnit = energyGenerated >= 1000 ? 'MWh' : 'kWh';
        const energyValue = energyGenerated >= 1000
            ? Math.round(energyGenerated / 1000 * 10) / 10
            : Math.round(energyGenerated);
        const homesPerYear = Math.round(energyGenerated / FACTORS.HOME_CONSUMPTION_KWH_YEAR);
        const waterFromEnergy = energyGenerated * FACTORS.WATER_PER_KWH;
        const waterFromRecycling = totalAluminumKg * FACTORS.WATER_PER_KG_ALUMINUM;
        const totalWater = waterFromEnergy + waterFromRecycling;
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
    calculateEnergyGenerated(panels) {
        return panels.reduce((total, panel) => {
            const watts = panel.measuredPowerWatts || FACTORS.DEFAULT_PANEL_WATTS;
            const healthFactor = (panel.healthPercentage || 80) / 100;
            const effectiveWatts = watts * healthFactor;
            const kWhPerYear = (effectiveWatts / 1000) * FACTORS.SOLAR_HOURS_PER_DAY * 365;
            return total + kWhPerYear;
        }, 0);
    }
    async calculateCharts() {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
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
        const reusedAssets = await this.prisma.asset.findMany({
            where: {
                status: {
                    in: [client_1.AssetStatus.REUSED, client_1.AssetStatus.LISTED_FOR_SALE, client_1.AssetStatus.READY_FOR_REUSE],
                },
                createdAt: { gte: twelveMonthsAgo },
            },
            select: {
                createdAt: true,
                measuredPowerWatts: true,
                healthPercentage: true,
            },
        });
        const monthlyData = this.initializeMonthlyData(now);
        recycleRecords.forEach(record => {
            const monthIndex = this.getMonthIndex(record.createdAt, now);
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex].co2 += record.aluminumKg * FACTORS.CO2_PER_KG_ALUMINUM;
                monthlyData[monthIndex].panels += 1;
            }
        });
        reusedAssets.forEach(asset => {
            const monthIndex = this.getMonthIndex(asset.createdAt, now);
            if (monthIndex >= 0 && monthIndex < 12) {
                const watts = asset.measuredPowerWatts || FACTORS.DEFAULT_PANEL_WATTS;
                const health = (asset.healthPercentage || 80) / 100;
                const kWhPerYear = (watts * health / 1000) * FACTORS.SOLAR_HOURS_PER_DAY * 365;
                monthlyData[monthIndex].co2 += kWhPerYear * FACTORS.CO2_PER_KWH;
                monthlyData[monthIndex].energy += kWhPerYear;
                monthlyData[monthIndex].panels += 1;
            }
        });
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
        return {
            co2ByMonth: monthlyData.map(d => ({ month: d.month, value: Math.round(d.co2) })),
            materialDistribution,
            panelsByMonth: monthlyData.map(d => ({ month: d.month, value: d.panels })),
            energyByMonth: monthlyData.map(d => ({ month: d.month, value: Math.round(d.energy) })),
        };
    }
    initializeMonthlyData(now) {
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
    getMonthIndex(date, now) {
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        return 11 - monthsDiff;
    }
    calculateMaterialDistribution(sums) {
        const aluminum = sums.aluminumKg || 0;
        const glass = sums.glassKg || 0;
        const silicon = sums.siliconKg || 0;
        const copper = sums.copperKg || 0;
        const total = aluminum + glass + silicon + copper;
        if (total === 0) {
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
};
exports.DashboardMetricsService = DashboardMetricsService;
exports.DashboardMetricsService = DashboardMetricsService = DashboardMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardMetricsService);
//# sourceMappingURL=dashboard-metrics.service.js.map