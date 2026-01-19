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
var InspectionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const triage_engine_service_1 = require("./triage-engine.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let InspectionsService = InspectionsService_1 = class InspectionsService {
    prisma;
    triageEngine;
    blockchainService;
    logger = new common_1.Logger(InspectionsService_1.name);
    constructor(prisma, triageEngine, blockchainService) {
        this.prisma = prisma;
        this.triageEngine = triageEngine;
        this.blockchainService = blockchainService;
    }
    async create(createInspectionDto) {
        const { assetId, inspectorId, measuredVoltage, measuredAmps, physicalCondition, photoUrl, notes } = createInspectionDto;
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            throw new Error('Asset no encontrado');
        }
        const aiRecommendation = this.triageEngine.evaluatePanel(measuredVoltage, measuredAmps, physicalCondition);
        let newAssetStatus;
        let blockchainStatus;
        switch (aiRecommendation) {
            case client_1.InspectionResult.REUSE:
                newAssetStatus = client_1.AssetStatus.READY_FOR_REUSE;
                blockchainStatus = blockchain_service_1.PanelStatus.REUSE_APPROVED;
                break;
            case client_1.InspectionResult.RECYCLE:
                newAssetStatus = client_1.AssetStatus.INSPECTED;
                blockchainStatus = blockchain_service_1.PanelStatus.RECYCLE_APPROVED;
                break;
            case client_1.InspectionResult.ART:
                newAssetStatus = client_1.AssetStatus.ART_CANDIDATE;
                blockchainStatus = blockchain_service_1.PanelStatus.ART_APPROVED;
                break;
            default:
                newAssetStatus = client_1.AssetStatus.INSPECTED;
                blockchainStatus = blockchain_service_1.PanelStatus.INSPECTED;
        }
        const inspection = await this.prisma.$transaction(async (prisma) => {
            const newInspection = await prisma.inspection.create({
                data: {
                    assetId,
                    inspectorId,
                    measuredVoltage,
                    measuredAmps,
                    physicalCondition,
                    photoUrl,
                    notes,
                    aiRecommendation,
                },
            });
            await prisma.asset.update({
                where: { id: assetId },
                data: {
                    status: newAssetStatus,
                    inspectedAt: new Date(),
                    inspectorId: inspectorId,
                },
            });
            return newInspection;
        });
        this.updateBlockchainStatus(asset.qrCode || asset.nfcTagId || asset.id, blockchainStatus, inspectorId).catch(err => {
            this.logger.error(`Failed to update blockchain for asset ${assetId}`, err);
        });
        return {
            ...inspection,
            aiRecommendation,
            blockchainStatus: blockchain_service_1.PanelStatus[blockchainStatus],
        };
    }
    async findAll(inspectorId) {
        const where = {};
        if (inspectorId) {
            where.inspectorId = inspectorId;
        }
        return this.prisma.inspection.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                asset: true,
            },
        });
    }
    async findOne(id) {
        return this.prisma.inspection.findUnique({
            where: { id },
            include: {
                asset: true,
            },
        });
    }
    async getStats(inspectorId) {
        const inspections = await this.prisma.inspection.findMany({
            where: { inspectorId },
        });
        const total = inspections.length;
        const reuse = inspections.filter(i => i.aiRecommendation === client_1.InspectionResult.REUSE).length;
        const recycle = inspections.filter(i => i.aiRecommendation === client_1.InspectionResult.RECYCLE).length;
        const art = inspections.filter(i => i.aiRecommendation === client_1.InspectionResult.ART).length;
        return {
            total,
            reuse,
            recycle,
            art,
        };
    }
    async updateBlockchainStatus(identifier, status, inspectorId) {
        if (!this.blockchainService.isConnected()) {
            this.logger.warn('Blockchain not connected, skipping status update');
            return;
        }
        try {
            await this.blockchainService.updatePanelStatus(identifier, blockchain_service_1.PanelStatus.INSPECTED, 'Planta de Inspección', '');
            this.logger.log(`Panel ${identifier} marked as INSPECTED in blockchain`);
            if (status !== blockchain_service_1.PanelStatus.INSPECTED) {
                await this.blockchainService.updatePanelStatus(identifier, status, 'Planta de Inspección', '');
                this.logger.log(`Panel ${identifier} status updated to ${blockchain_service_1.PanelStatus[status]} in blockchain`);
            }
        }
        catch (error) {
            this.logger.error(`Blockchain update failed for ${identifier}`, error);
            throw error;
        }
    }
    async getInspectorStats(inspectorId) {
        const inspector = await this.prisma.user.findUnique({
            where: { id: inspectorId },
            select: { id: true, name: true },
        });
        if (!inspector) {
            throw new common_1.NotFoundException(`Inspector con ID ${inspectorId} no encontrado`);
        }
        const [recyclingCount, reuseCount, artCount] = await Promise.all([
            this.prisma.inspection.count({
                where: {
                    inspectorId,
                    aiRecommendation: client_1.InspectionResult.RECYCLE,
                },
            }),
            this.prisma.inspection.count({
                where: {
                    inspectorId,
                    aiRecommendation: client_1.InspectionResult.REUSE,
                },
            }),
            this.prisma.inspection.count({
                where: {
                    inspectorId,
                    aiRecommendation: client_1.InspectionResult.ART,
                },
            }),
        ]);
        const totalInspections = recyclingCount + reuseCount + artCount;
        const monthlyGoal = 200;
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const thisMonthCount = await this.prisma.inspection.count({
            where: {
                inspectorId,
                createdAt: { gte: currentMonth },
            },
        });
        const monthlyGoalProgress = Math.min(thisMonthCount / monthlyGoal, 1);
        const recycleRecords = await this.prisma.recycleRecord.findMany({
            where: {
                asset: {
                    inspection: {
                        inspectorId,
                    },
                },
            },
            select: {
                glassKg: true,
                aluminumKg: true,
            },
        });
        const totalGlassKg = recycleRecords.reduce((sum, r) => sum + r.glassKg, 0);
        const totalAluminumKg = recycleRecords.reduce((sum, r) => sum + r.aluminumKg, 0);
        let impactHighlight = '';
        let impactMessage = '';
        if (totalGlassKg >= 1000) {
            const tons = (totalGlassKg / 1000).toFixed(1);
            impactHighlight = `${tons} toneladas`;
            impactMessage = 'de vidrio recuperado han sido donadas para generar cemento en zonas vulnerables.';
        }
        else if (totalAluminumKg >= 100) {
            impactHighlight = `${Math.round(totalAluminumKg)} kg`;
            impactMessage = 'de aluminio reciclado, equivalente a evitar la extraccion de bauxita.';
        }
        else if (totalInspections > 0) {
            impactHighlight = `${totalInspections} paneles`;
            impactMessage = 'inspeccionados contribuyendo a la economia circular de energia solar.';
        }
        else {
            impactHighlight = 'Comienza hoy!';
            impactMessage = 'Cada panel que inspecciones contribuye al medio ambiente.';
        }
        const stationId = `#${(inspectorId.charCodeAt(0) % 10).toString().padStart(2, '0')}`;
        return {
            recyclingCount,
            reuseCount,
            artCount,
            totalInspections,
            monthlyGoalProgress,
            impactHighlight,
            impactMessage,
            inspectorName: inspector.name,
            stationId,
        };
    }
    async getRecentInspections(inspectorId, limit = 10) {
        const inspections = await this.prisma.inspection.findMany({
            where: { inspectorId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                asset: {
                    select: {
                        id: true,
                        brand: true,
                        model: true,
                        status: true,
                    },
                },
            },
        });
        return inspections.map((inspection) => {
            let status = 'inReview';
            const assetStatus = inspection.asset.status;
            if (['RECYCLED', 'REUSED', 'LISTED_FOR_SALE', 'ART_LISTED_FOR_SALE'].includes(assetStatus)) {
                status = 'approved';
            }
            else if (assetStatus === 'INSPECTED' || assetStatus === 'READY_FOR_REUSE' || assetStatus === 'REFURBISHING') {
                status = 'approved';
            }
            else if (assetStatus === 'INSPECTING') {
                status = 'inReview';
            }
            const brand = inspection.asset.brand || 'Panel Solar';
            const model = inspection.asset.model || '';
            const panelType = model ? `${brand} ${model}` : brand;
            const shortId = `ID-${inspection.id.substring(0, 4).toUpperCase()}`;
            return {
                id: shortId,
                panelId: inspection.asset.id,
                panelType,
                status,
                result: inspection.aiRecommendation,
                inspectedAt: inspection.createdAt,
            };
        });
    }
    async getInspectorStatsByEmail(email) {
        const inspector = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!inspector) {
            throw new common_1.NotFoundException(`Inspector con email ${email} no encontrado`);
        }
        return this.getInspectorStats(inspector.id);
    }
};
exports.InspectionsService = InspectionsService;
exports.InspectionsService = InspectionsService = InspectionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        triage_engine_service_1.TriageEngineService,
        blockchain_service_1.BlockchainService])
], InspectionsService);
//# sourceMappingURL=inspections.service.js.map