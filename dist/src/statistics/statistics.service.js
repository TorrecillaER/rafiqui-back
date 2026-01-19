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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StatisticsService = class StatisticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    CO2_PER_PANEL = 17.8;
    TREES_PER_PANEL = 0.89;
    ENERGY_PER_PANEL = 49.2;
    WATER_PER_PANEL = 350;
    async getESGMetrics() {
        const totalPanels = await this.prisma.asset.count();
        const reusedPanels = await this.prisma.asset.count({
            where: { status: client_1.AssetStatus.REUSED },
        });
        const recycledPanels = await this.prisma.asset.count({
            where: { status: client_1.AssetStatus.RECYCLED },
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
    async getMonthlyData() {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentMonth = new Date().getMonth();
        const monthlyData = [];
        for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth - 11 + i + 12) % 12;
            const year = new Date().getFullYear() - (currentMonth - 11 + i < 0 ? 1 : 0);
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0);
            const whereClause = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            const panelsCount = await this.prisma.asset.count({
                where: whereClause,
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
    async getMaterialDistribution() {
        const totalPanels = await this.prisma.asset.count({
            where: { status: client_1.AssetStatus.RECYCLED },
        });
        return [
            { name: 'Aluminio', value: 35, color: '#94A3B8' },
            { name: 'Vidrio', value: 40, color: '#22D3EE' },
            { name: 'Silicio', value: 15, color: '#A78BFA' },
            { name: 'Cobre', value: 10, color: '#F97316' },
        ];
    }
    async getDashboardStats() {
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
    async getAvailableAssets() {
        const assets = await this.prisma.asset.findMany({
            where: {
                status: { in: [client_1.AssetStatus.WAREHOUSE_RECEIVED, client_1.AssetStatus.INSPECTED] },
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
    async getMaterialStock() {
        const recycledCount = await this.prisma.asset.count({
            where: { status: client_1.AssetStatus.RECYCLED },
        });
        const totalWeight = recycledCount * 20;
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
    async getArt() {
        const artPieces = await this.prisma.artPiece.findMany({
            where: { isAvailable: true },
            orderBy: { createdAt: 'desc' },
        });
        return artPieces.map((piece) => ({
            id: piece.id,
            title: piece.title,
            artist: piece.artist,
            description: piece.description,
            price: piece.price,
            currency: piece.currency,
            category: piece.category,
            imageUrl: piece.imageUrl || '',
            isAvailable: piece.isAvailable,
            tokenId: piece.tokenId,
            sourceAssetId: piece.sourceAssetId,
            createdAt: piece.createdAt,
        }));
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatisticsService);
//# sourceMappingURL=statistics.service.js.map