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
var PanelsMarketplaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelsMarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const client_1 = require("@prisma/client");
const ethers_1 = require("ethers");
let PanelsMarketplaceService = PanelsMarketplaceService_1 = class PanelsMarketplaceService {
    prisma;
    blockchainService;
    logger = new common_1.Logger(PanelsMarketplaceService_1.name);
    constructor(prisma, blockchainService) {
        this.prisma = prisma;
        this.blockchainService = blockchainService;
    }
    async purchasePanel(dto) {
        const { assetId, buyerWallet, destination, destinationNotes, buyerId } = dto;
        if (!ethers_1.ethers.isAddress(buyerWallet)) {
            throw new common_1.BadRequestException('Wallet address inválida');
        }
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Panel no encontrado');
        }
        if (asset.status !== client_1.AssetStatus.LISTED_FOR_SALE) {
            throw new common_1.BadRequestException('Este panel no está disponible para venta');
        }
        const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
        const price = this.calculatePanelPrice(asset);
        if (buyerId) {
            const userExists = await this.prisma.user.findUnique({
                where: { id: buyerId },
            });
            if (!userExists) {
                throw new common_1.BadRequestException('Usuario comprador no encontrado');
            }
        }
        const order = await this.prisma.panelOrder.create({
            data: {
                assetId,
                buyerId: buyerId || null,
                buyerWallet,
                price,
                destination,
                destinationNotes,
                status: client_1.OrderStatus.PROCESSING,
            },
        });
        let txHash = null;
        try {
            if (this.blockchainService.isConnected()) {
                txHash = await this.blockchainService.updatePanelStatus(qrCode, 6, buyerWallet, '');
                this.logger.log(`Panel ${qrCode} status updated to SOLD. TxHash: ${txHash}`);
            }
            await this.prisma.asset.update({
                where: { id: assetId },
                data: {
                    status: client_1.AssetStatus.REUSED,
                    soldAt: new Date(),
                    buyerWallet,
                },
            });
            await this.prisma.panelOrder.update({
                where: { id: order.id },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    blockchainTxHash: txHash,
                    completedAt: new Date(),
                },
            });
            this.logger.log(`Panel ${assetId} sold to ${buyerWallet}. TxHash: ${txHash}`);
        }
        catch (error) {
            this.logger.error(`Error processing panel sale ${assetId}:`, error);
            await this.prisma.panelOrder.update({
                where: { id: order.id },
                data: { status: client_1.OrderStatus.FAILED },
            });
            throw new common_1.BadRequestException('Error al procesar la venta del panel');
        }
        return {
            success: true,
            message: 'Panel comprado exitosamente. La transacción ha sido registrada en blockchain.',
            order: {
                id: order.id,
                assetId,
                tokenId: qrCode,
                price,
                blockchainTxHash: txHash,
            },
        };
    }
    calculatePanelPrice(asset) {
        const basePrice = 150;
        const powerBonus = (asset.measuredPowerWatts || 0) * 0.5;
        const voltageBonus = (asset.measuredVoltage || 0) * 2;
        const healthBonus = (asset.healthPercentage || 0) * 1.5;
        return Math.round(basePrice + powerBonus + voltageBonus + healthBonus);
    }
    async getAvailablePanels() {
        const panels = await this.prisma.asset.findMany({
            where: {
                status: client_1.AssetStatus.LISTED_FOR_SALE,
            },
            orderBy: { refurbishedAt: 'desc' },
        });
        return panels.map(panel => ({
            id: panel.id,
            qrCode: panel.qrCode || '',
            brand: panel.brand || '',
            model: panel.model || '',
            status: panel.status,
            tokenId: panel.tokenId || '',
            price: this.calculatePanelPrice(panel),
            measuredPowerWatts: panel.measuredPowerWatts || 0,
            measuredVoltage: panel.measuredVoltage || 0,
            healthPercentage: panel.healthPercentage || 0,
            capacityRetainedPercent: panel.capacityRetainedPercent || 0,
            dimensionLength: panel.dimensionLength || 0,
            dimensionWidth: panel.dimensionWidth || 0,
            dimensionHeight: panel.dimensionHeight || 0,
            refurbishedAt: panel.refurbishedAt || panel.createdAt,
        }));
    }
    async getPanelDetails(assetId) {
        const panel = await this.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!panel) {
            throw new common_1.NotFoundException('Panel no encontrado');
        }
        return {
            id: panel.id,
            qrCode: panel.qrCode || '',
            brand: panel.brand || '',
            model: panel.model || '',
            status: panel.status,
            tokenId: panel.tokenId || '',
            price: this.calculatePanelPrice(panel),
            measuredPowerWatts: panel.measuredPowerWatts || 0,
            measuredVoltage: panel.measuredVoltage || 0,
            healthPercentage: panel.healthPercentage || 0,
            capacityRetainedPercent: panel.capacityRetainedPercent || 0,
            dimensionLength: panel.dimensionLength || 0,
            dimensionWidth: panel.dimensionWidth || 0,
            dimensionHeight: panel.dimensionHeight || 0,
            refurbishedAt: panel.refurbishedAt || panel.createdAt,
        };
    }
    async getPanelOrderHistory(buyerId) {
        const where = buyerId ? { buyerId } : {};
        return this.prisma.panelOrder.findMany({
            where,
            include: {
                asset: {
                    select: {
                        qrCode: true,
                        brand: true,
                        model: true,
                        tokenId: true,
                    },
                },
                buyer: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getMarketplaceStats() {
        const totalAvailable = await this.prisma.asset.count({
            where: { status: client_1.AssetStatus.LISTED_FOR_SALE },
        });
        const totalSold = await this.prisma.asset.count({
            where: { status: client_1.AssetStatus.REUSED, soldAt: { not: null } },
        });
        const totalRevenue = await this.prisma.panelOrder.aggregate({
            where: { status: client_1.OrderStatus.COMPLETED },
            _sum: { price: true },
        });
        const averagePrice = await this.prisma.panelOrder.aggregate({
            where: { status: client_1.OrderStatus.COMPLETED },
            _avg: { price: true },
        });
        return {
            totalAvailable,
            totalSold,
            totalRevenue: totalRevenue._sum.price || 0,
            averagePrice: averagePrice._avg.price || 0,
        };
    }
};
exports.PanelsMarketplaceService = PanelsMarketplaceService;
exports.PanelsMarketplaceService = PanelsMarketplaceService = PanelsMarketplaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], PanelsMarketplaceService);
//# sourceMappingURL=panels-marketplace.service.js.map