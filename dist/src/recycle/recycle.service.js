"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecycleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecycleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const materials_blockchain_service_1 = require("../blockchain/materials-blockchain.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const MATERIAL_PERCENTAGES = {
    ALUMINUM: 0.35,
    GLASS: 0.40,
    SILICON: 0.15,
    COPPER: 0.10,
};
const MATERIAL_PRICES = {
    ALUMINUM: 2.80,
    GLASS: 0.45,
    SILICON: 15.00,
    COPPER: 8.50,
};
const MATERIAL_NAMES = {
    ALUMINUM: 'Aluminio Reciclado',
    GLASS: 'Vidrio Solar Premium',
    SILICON: 'Silicio Purificado',
    COPPER: 'Cobre Recuperado',
};
let RecycleService = RecycleService_1 = class RecycleService {
    prisma;
    blockchainService;
    materialsBlockchainService;
    logger = new common_1.Logger(RecycleService_1.name);
    constructor(prisma, blockchainService, materialsBlockchainService) {
        this.prisma = prisma;
        this.blockchainService = blockchainService;
        this.materialsBlockchainService = materialsBlockchainService;
    }
    async processRecycle(dto) {
        const { assetId, operatorId, panelWeightKg = 20.0 } = dto;
        if (!operatorId) {
            throw new common_1.BadRequestException('operatorId es requerido');
        }
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
            include: { inspection: true },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset no encontrado');
        }
        const validStatuses = [client_1.AssetStatus.RECYCLED, client_1.AssetStatus.INSPECTED];
        if (!validStatuses.includes(asset.status)) {
            if (asset.inspection?.aiRecommendation !== 'RECYCLE') {
                throw new common_1.BadRequestException(`El panel no está aprobado para reciclaje. Estado actual: ${asset.status}`);
            }
        }
        const existingRecord = await this.prisma.recycleRecord.findUnique({
            where: { assetId },
        });
        if (existingRecord) {
            throw new common_1.BadRequestException('Este panel ya fue reciclado');
        }
        const materials = {
            aluminum: panelWeightKg * MATERIAL_PERCENTAGES.ALUMINUM,
            glass: panelWeightKg * MATERIAL_PERCENTAGES.GLASS,
            silicon: panelWeightKg * MATERIAL_PERCENTAGES.SILICON,
            copper: panelWeightKg * MATERIAL_PERCENTAGES.COPPER,
        };
        const recycleData = {
            assetId,
            operatorId,
            panelWeightKg,
            materials,
            timestamp: new Date().toISOString(),
        };
        const ipfsHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(recycleData))
            .digest('hex');
        const result = await this.prisma.$transaction(async (prisma) => {
            const recycleRecord = await prisma.recycleRecord.create({
                data: {
                    assetId,
                    operatorId,
                    panelWeightKg,
                    aluminumKg: materials.aluminum,
                    glassKg: materials.glass,
                    siliconKg: materials.silicon,
                    copperKg: materials.copper,
                    ipfsHash,
                },
            });
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: client_1.AssetStatus.RECYCLED },
            });
            const stockUpdates = await Promise.all([
                this.upsertMaterialStock(prisma, client_1.MaterialType.ALUMINUM, materials.aluminum),
                this.upsertMaterialStock(prisma, client_1.MaterialType.GLASS, materials.glass),
                this.upsertMaterialStock(prisma, client_1.MaterialType.SILICON, materials.silicon),
                this.upsertMaterialStock(prisma, client_1.MaterialType.COPPER, materials.copper),
            ]);
            return { recycleRecord, stockUpdates };
        });
        let blockchainTxHash = null;
        try {
            const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
            blockchainTxHash = await this.blockchainService.updatePanelStatus(qrCode, blockchain_service_1.PanelStatus.RECYCLED, 'Recycling Facility', ipfsHash);
            await this.prisma.recycleRecord.update({
                where: { id: result.recycleRecord.id },
                data: { blockchainTxHash },
            });
        }
        catch (error) {
            this.logger.error('Error updating blockchain', error);
        }
        let materialsTxHash = null;
        let tokensMinted = { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
        try {
            if (this.materialsBlockchainService.isConnected()) {
                this.logger.log('Minting ERC-1155 material tokens...');
                const mintResult = await this.materialsBlockchainService.mintFromRecycle(materials.aluminum, materials.glass, materials.silicon, materials.copper, result.recycleRecord.id);
                materialsTxHash = mintResult.txHash;
                tokensMinted = {
                    aluminum: mintResult.aluminumTokens,
                    glass: mintResult.glassTokens,
                    silicon: mintResult.siliconTokens,
                    copper: mintResult.copperTokens,
                };
                await this.prisma.recycleRecord.update({
                    where: { id: result.recycleRecord.id },
                    data: { materialsTxHash },
                });
                this.logger.log(`Materials tokens minted: ${JSON.stringify(tokensMinted)}`);
            }
            else {
                this.logger.warn('Materials contract not connected. Skipping token minting.');
            }
        }
        catch (error) {
            this.logger.error('Error minting material tokens', error);
        }
        const updatedStock = await this.getMaterialStock();
        return {
            success: true,
            message: 'Panel reciclado exitosamente. Materiales separados y tokens ERC-1155 minteados.',
            recycleRecord: {
                id: result.recycleRecord.id,
                assetId,
                panelWeightKg,
                materials,
                blockchainTxHash,
                materialsTxHash,
                tokensMinted,
            },
            updatedStock: {
                aluminum: updatedStock.find(s => s.type === 'ALUMINUM')?.availableKg || 0,
                glass: updatedStock.find(s => s.type === 'GLASS')?.availableKg || 0,
                silicon: updatedStock.find(s => s.type === 'SILICON')?.availableKg || 0,
                copper: updatedStock.find(s => s.type === 'COPPER')?.availableKg || 0,
            },
        };
    }
    async upsertMaterialStock(prisma, type, addKg) {
        const existing = await prisma.materialStock.findUnique({
            where: { type },
        });
        if (existing) {
            return prisma.materialStock.update({
                where: { type },
                data: {
                    totalKg: { increment: addKg },
                    availableKg: { increment: addKg },
                },
            });
        }
        else {
            return prisma.materialStock.create({
                data: {
                    type,
                    name: MATERIAL_NAMES[type],
                    totalKg: addKg,
                    availableKg: addKg,
                    pricePerKg: MATERIAL_PRICES[type],
                },
            });
        }
    }
    async getMaterialStock() {
        const stocks = await this.prisma.materialStock.findMany({
            orderBy: { type: 'asc' },
        });
        if (stocks.length === 0) {
            return Object.entries(MATERIAL_NAMES).map(([type, name]) => ({
                type,
                name,
                totalKg: 0,
                availableKg: 0,
                pricePerKg: MATERIAL_PRICES[type],
            }));
        }
        return stocks.map(s => ({
            type: s.type,
            name: s.name,
            totalKg: s.totalKg,
            availableKg: s.availableKg,
            pricePerKg: s.pricePerKg,
        }));
    }
    async getTreasuryBalances() {
        return this.materialsBlockchainService.getTreasuryBalances();
    }
    async getWalletBalances(walletAddress) {
        return this.materialsBlockchainService.getWalletBalances(walletAddress);
    }
    async findAssetForRecycle(qrCode) {
        const asset = await this.prisma.asset.findFirst({
            where: {
                OR: [
                    { qrCode },
                    { nfcTagId: qrCode },
                ],
            },
            include: {
                inspection: true,
                recycleRecord: true,
            },
        });
        if (!asset) {
            return null;
        }
        if (asset.recycleRecord) {
            return {
                asset,
                canRecycle: false,
                reason: 'Este panel ya fue reciclado',
            };
        }
        const isApprovedForRecycle = asset.inspection?.aiRecommendation === 'RECYCLE' &&
            asset.status === client_1.AssetStatus.INSPECTED;
        return {
            asset,
            canRecycle: isApprovedForRecycle,
            reason: isApprovedForRecycle
                ? 'Panel listo para reciclaje'
                : `Estado actual: ${asset.status}. Se requiere aprobación de reciclaje.`,
        };
    }
    async getRecycleHistory(limit = 50) {
        return this.prisma.recycleRecord.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                asset: {
                    select: {
                        id: true,
                        qrCode: true,
                        brand: true,
                        model: true,
                    },
                },
                operator: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
};
exports.RecycleService = RecycleService;
exports.RecycleService = RecycleService = RecycleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService,
        materials_blockchain_service_1.MaterialsBlockchainService])
], RecycleService);
//# sourceMappingURL=recycle.service.js.map