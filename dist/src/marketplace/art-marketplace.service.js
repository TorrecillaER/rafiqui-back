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
var ArtMarketplaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtMarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const client_1 = require("@prisma/client");
const ethers_1 = require("ethers");
let ArtMarketplaceService = ArtMarketplaceService_1 = class ArtMarketplaceService {
    prisma;
    blockchainService;
    logger = new common_1.Logger(ArtMarketplaceService_1.name);
    constructor(prisma, blockchainService) {
        this.prisma = prisma;
        this.blockchainService = blockchainService;
    }
    async purchaseArt(dto) {
        const { artPieceId, buyerWallet, buyerId, messageToArtist } = dto;
        if (!ethers_1.ethers.isAddress(buyerWallet)) {
            throw new common_1.BadRequestException('Wallet address inválida');
        }
        const artPiece = await this.prisma.artPiece.findUnique({
            where: { id: artPieceId },
            include: {
                sourceAsset: {
                    select: {
                        brand: true,
                        model: true,
                    }
                }
            },
        });
        if (!artPiece) {
            throw new common_1.NotFoundException('Obra de arte no encontrada');
        }
        if (!artPiece.isAvailable) {
            throw new common_1.BadRequestException('Esta obra no está disponible para venta');
        }
        if (!artPiece.tokenId) {
            throw new common_1.BadRequestException('Esta obra no tiene token en blockchain');
        }
        if (buyerId) {
            const userExists = await this.prisma.user.findUnique({
                where: { id: buyerId },
            });
            if (!userExists) {
                throw new common_1.BadRequestException('Usuario comprador no encontrado');
            }
        }
        const order = await this.prisma.artOrder.create({
            data: {
                artPieceId,
                buyerId: buyerId || null,
                buyerWallet,
                price: artPiece.price,
                messageToArtist,
                status: client_1.OrderStatus.PROCESSING,
            },
        });
        let txHash = null;
        try {
            txHash = await this.blockchainService.transferArt(artPiece.tokenId, buyerWallet);
            await this.prisma.artPiece.update({
                where: { id: artPieceId },
                data: {
                    isAvailable: false,
                    soldAt: new Date(),
                    buyerWallet,
                },
            });
            await this.prisma.artOrder.update({
                where: { id: order.id },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    blockchainTxHash: txHash,
                    completedAt: new Date(),
                },
            });
            this.logger.log(`Art piece ${artPieceId} sold to ${buyerWallet}. TxHash: ${txHash}`);
        }
        catch (error) {
            this.logger.error(`Error transferring art ${artPieceId}:`, error);
            await this.prisma.artOrder.update({
                where: { id: order.id },
                data: { status: client_1.OrderStatus.FAILED },
            });
            throw new common_1.BadRequestException('Error al transferir la obra en blockchain');
        }
        return {
            success: true,
            message: 'Obra de arte comprada exitosamente. NFT transferido a tu wallet.',
            order: {
                id: order.id,
                artPieceId,
                tokenId: artPiece.tokenId,
                title: artPiece.title,
                artist: artPiece.artist,
                price: artPiece.price,
                blockchainTxHash: txHash,
            },
        };
    }
    async getAvailableArt() {
        return this.prisma.artPiece.findMany({
            where: {
                isAvailable: true,
                tokenId: { not: null },
            },
            include: {
                sourceAsset: {
                    select: {
                        brand: true,
                        model: true,
                        qrCode: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getArtDetails(artPieceId) {
        const artPiece = await this.prisma.artPiece.findUnique({
            where: { id: artPieceId },
            include: {
                sourceAsset: true,
                orders: {
                    include: {
                        buyer: {
                            select: {
                                name: true,
                                email: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                }
            },
        });
        if (!artPiece) {
            throw new common_1.NotFoundException('Obra de arte no encontrada');
        }
        return artPiece;
    }
    async getArtOrderHistory(buyerId) {
        const where = buyerId ? { buyerId } : {};
        return this.prisma.artOrder.findMany({
            where,
            include: {
                artPiece: {
                    select: {
                        title: true,
                        artist: true,
                        tokenId: true,
                        imageUrl: true,
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
    async getArtMarketplaceStats() {
        const totalAvailable = await this.prisma.artPiece.count({
            where: { isAvailable: true },
        });
        const totalSold = await this.prisma.artPiece.count({
            where: { isAvailable: false, soldAt: { not: null } },
        });
        const totalRevenue = await this.prisma.artOrder.aggregate({
            where: { status: client_1.OrderStatus.COMPLETED },
            _sum: { price: true },
        });
        const averagePrice = await this.prisma.artOrder.aggregate({
            where: { status: client_1.OrderStatus.COMPLETED },
            _avg: { price: true },
        });
        const artByCategory = await this.prisma.artPiece.groupBy({
            by: ['category'],
            _count: true,
            where: { isAvailable: true },
        });
        return {
            totalAvailable,
            totalSold,
            totalRevenue: totalRevenue._sum.price || 0,
            averagePrice: averagePrice._avg.price || 0,
            artByCategory: artByCategory.map(item => ({
                category: item.category,
                count: item._count,
            })),
        };
    }
};
exports.ArtMarketplaceService = ArtMarketplaceService;
exports.ArtMarketplaceService = ArtMarketplaceService = ArtMarketplaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], ArtMarketplaceService);
//# sourceMappingURL=art-marketplace.service.js.map