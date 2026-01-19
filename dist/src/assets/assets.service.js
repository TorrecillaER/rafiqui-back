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
var AssetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let AssetsService = AssetsService_1 = class AssetsService {
    prisma;
    blockchainService;
    logger = new common_1.Logger(AssetsService_1.name);
    constructor(prisma, blockchainService) {
        this.prisma = prisma;
        this.blockchainService = blockchainService;
    }
    async create(createAssetDto) {
        const { nfcTagId, qrCode, collectionRequestId, brand, model, status } = createAssetDto;
        let existingAsset = null;
        if (nfcTagId) {
            existingAsset = await this.prisma.asset.findUnique({
                where: { nfcTagId },
            });
        }
        if (!existingAsset && qrCode) {
            existingAsset = await this.prisma.asset.findFirst({
                where: { qrCode },
            });
        }
        if (existingAsset) {
            const updatedAsset = await this.prisma.asset.update({
                where: { id: existingAsset.id },
                data: {
                    status: status || client_1.AssetStatus.IN_TRANSIT,
                    collectionRequestId: collectionRequestId || existingAsset.collectionRequestId,
                    brand: brand || existingAsset.brand,
                    model: model || existingAsset.model,
                    nfcTagId: nfcTagId || existingAsset.nfcTagId,
                    qrCode: qrCode || existingAsset.qrCode,
                },
            });
            this.updateStatusInBlockchain(updatedAsset.qrCode || updatedAsset.nfcTagId || updatedAsset.id, updatedAsset.status, 'Updated').catch(err => {
                this.logger.error(`Failed to update asset in blockchain`, err);
            });
            return updatedAsset;
        }
        else {
            const newAsset = await this.prisma.asset.create({
                data: {
                    nfcTagId,
                    qrCode,
                    collectionRequestId,
                    brand,
                    model,
                    status: client_1.AssetStatus.IN_TRANSIT,
                },
            });
            this.registerInBlockchain(newAsset).catch(err => {
                this.logger.error(`Failed to register asset ${newAsset.id} in blockchain`, err);
            });
            return newAsset;
        }
    }
    async scan(scanAssetDto) {
        return this.create({
            nfcTagId: scanAssetDto.nfcTagId,
            collectionRequestId: scanAssetDto.requestId,
        });
    }
    async findAll(status, nfcTagId, collectionRequestId, qrCode) {
        const where = {};
        if (status) {
            const statuses = status.split(',').map((s) => s.trim());
            where.status = { in: statuses };
        }
        if (nfcTagId) {
            where.nfcTagId = nfcTagId;
        }
        if (qrCode) {
            where.qrCode = qrCode;
        }
        if (collectionRequestId) {
            where.collectionRequestId = collectionRequestId;
        }
        return this.prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                collectionRequest: true,
            }
        });
    }
    async update(id, data) {
        const updatedAsset = await this.prisma.asset.update({
            where: { id },
            data,
        });
        if (data.status) {
            this.updateStatusInBlockchain(updatedAsset.qrCode || updatedAsset.nfcTagId || updatedAsset.id, updatedAsset.status, 'Updated').catch(err => {
                this.logger.error(`Failed to update asset status in blockchain`, err);
            });
        }
        return updatedAsset;
    }
    async registerInBlockchain(asset) {
        if (!this.blockchainService.isConnected()) {
            this.logger.warn('Blockchain not connected, skipping registration');
            return;
        }
        try {
            const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
            const txHash = await this.blockchainService.registerPanel(qrCode, asset.brand || 'Unknown', asset.model || 'Unknown', 'Warehouse', '');
            this.logger.log(`Asset ${qrCode} registered in blockchain: ${txHash}`);
        }
        catch (error) {
            this.logger.error(`Blockchain registration failed for asset ${asset.id}`, error);
        }
    }
    mapStatusToBlockchain(status) {
        const statusMap = {
            [client_1.AssetStatus.PENDING_COLLECTION]: blockchain_service_1.PanelStatus.COLLECTED,
            [client_1.AssetStatus.IN_TRANSIT]: blockchain_service_1.PanelStatus.COLLECTED,
            [client_1.AssetStatus.WAREHOUSE_RECEIVED]: blockchain_service_1.PanelStatus.WAREHOUSE_RECEIVED,
            [client_1.AssetStatus.INSPECTING]: blockchain_service_1.PanelStatus.WAREHOUSE_RECEIVED,
            [client_1.AssetStatus.INSPECTED]: blockchain_service_1.PanelStatus.INSPECTED,
            [client_1.AssetStatus.RECYCLED]: blockchain_service_1.PanelStatus.RECYCLED,
            [client_1.AssetStatus.REUSED]: blockchain_service_1.PanelStatus.SOLD,
            [client_1.AssetStatus.READY_FOR_REUSE]: blockchain_service_1.PanelStatus.REUSE_APPROVED,
            [client_1.AssetStatus.REFURBISHING]: blockchain_service_1.PanelStatus.REUSE_APPROVED,
            [client_1.AssetStatus.LISTED_FOR_SALE]: blockchain_service_1.PanelStatus.REUSE_APPROVED,
            [client_1.AssetStatus.ART_CANDIDATE]: blockchain_service_1.PanelStatus.ART_APPROVED,
            [client_1.AssetStatus.ART_LISTED_FOR_SALE]: blockchain_service_1.PanelStatus.ART_LISTED,
        };
        return statusMap[status] ?? blockchain_service_1.PanelStatus.COLLECTED;
    }
    async updateStatusInBlockchain(identifier, status, location) {
        if (!this.blockchainService.isConnected()) {
            return;
        }
        try {
            const blockchainStatus = this.mapStatusToBlockchain(status);
            const txHash = await this.blockchainService.updatePanelStatus(identifier, blockchainStatus, location, '');
            this.logger.log(`Asset ${identifier} status updated in blockchain: ${txHash}`);
        }
        catch (error) {
            this.logger.error(`Blockchain status update failed for ${identifier}`, error);
        }
    }
    async validateForInspection(qrCode, inspectorId) {
        const asset = await this.prisma.asset.findFirst({
            where: { qrCode },
            include: {
                collectionRequest: true,
                inspection: true,
            },
        });
        if (!asset) {
            return {
                valid: false,
                message: 'Panel no encontrado',
                error: 'Este panel no existe en los registros. Verifica el código QR.',
            };
        }
        const processedStatuses = [
            client_1.AssetStatus.INSPECTED,
            client_1.AssetStatus.READY_FOR_REUSE,
            client_1.AssetStatus.REUSED,
            client_1.AssetStatus.RECYCLED,
        ];
        if (processedStatuses.includes(asset.status)) {
            return {
                valid: false,
                message: 'Panel ya procesado',
                error: `Este panel ya ha sido inspeccionado previamente. Estado actual: ${asset.status}`,
                asset: asset,
            };
        }
        const validStatuses = [
            client_1.AssetStatus.IN_TRANSIT,
            client_1.AssetStatus.WAREHOUSE_RECEIVED,
            client_1.AssetStatus.INSPECTING,
        ];
        if (!validStatuses.includes(asset.status)) {
            return {
                valid: false,
                message: 'Estado no válido',
                error: `Este panel no está disponible para inspección. Estado actual: ${asset.status}`,
                asset: asset,
            };
        }
        if (asset.status === client_1.AssetStatus.IN_TRANSIT ||
            asset.status === client_1.AssetStatus.WAREHOUSE_RECEIVED) {
            const updatedAsset = await this.prisma.asset.update({
                where: { id: asset.id },
                data: {
                    status: client_1.AssetStatus.INSPECTING,
                    inspectorId: inspectorId,
                    inspectionStartedAt: new Date(),
                },
                include: {
                    collectionRequest: true,
                    inspection: true,
                },
            });
            this.logger.log(`Panel ${qrCode} cambiado a INSPECTING por inspector ${inspectorId || 'unknown'}`);
            this.updateStatusInBlockchain(updatedAsset.qrCode || updatedAsset.nfcTagId || updatedAsset.id, updatedAsset.status, 'Inspection Started').catch(err => {
                this.logger.error(`Failed to update inspection status in blockchain`, err);
            });
            return {
                valid: true,
                message: 'Panel válido para inspección',
                asset: updatedAsset,
            };
        }
        return {
            valid: true,
            message: 'Panel válido para inspección',
            asset: asset,
        };
    }
    async findByQrCode(qrCode) {
        return this.prisma.asset.findFirst({
            where: { qrCode },
            include: {
                collectionRequest: true,
                inspection: true,
                artPiece: true,
            },
        });
    }
    async findByNfcTag(nfcTagId) {
        return this.prisma.asset.findUnique({
            where: { nfcTagId },
            include: {
                collectionRequest: true,
                inspection: true,
                artPiece: true,
            },
        });
    }
    async completeRefurbishment(assetId, dto) {
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            return {
                success: false,
                message: 'Asset no encontrado',
            };
        }
        const validStatuses = [
            client_1.AssetStatus.READY_FOR_REUSE,
            client_1.AssetStatus.REFURBISHING,
        ];
        if (!validStatuses.includes(asset.status)) {
            return {
                success: false,
                message: `El panel no está en estado válido para completar reacondicionamiento. Estado actual: ${asset.status}`,
            };
        }
        const updatedAsset = await this.prisma.asset.update({
            where: { id: assetId },
            data: {
                status: client_1.AssetStatus.LISTED_FOR_SALE,
                refurbishedAt: new Date(),
                refurbishedById: dto?.technicianId,
                refurbishmentNotes: dto?.notes,
                measuredPowerWatts: dto?.measuredPowerWatts,
                measuredVoltage: dto?.measuredVoltage,
                capacityRetainedPercent: dto?.capacityRetainedPercent,
                healthPercentage: dto?.healthPercentage,
                dimensionLength: dto?.dimensionLength,
                dimensionWidth: dto?.dimensionWidth,
                dimensionHeight: dto?.dimensionHeight,
            },
        });
        this.logger.log(`Asset ${assetId} marked as LISTED_FOR_SALE with technical data`);
        this.logger.log(`Technical data: Power=${dto?.measuredPowerWatts}W, Voltage=${dto?.measuredVoltage}V, Health=${dto?.healthPercentage}%`);
        return {
            success: true,
            message: 'Panel marcado como listo para venta',
            asset: updatedAsset,
        };
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = AssetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map