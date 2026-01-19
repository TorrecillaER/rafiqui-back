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
var MaterialsMarketplaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialsMarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const materials_blockchain_service_1 = require("../blockchain/materials-blockchain.service");
const client_1 = require("@prisma/client");
const ethers_1 = require("ethers");
const TOKENS_PER_KG = 10;
const MATERIAL_NAMES = {
    ALUMINUM: 'Aluminio Reciclado',
    GLASS: 'Vidrio Solar Premium',
    SILICON: 'Silicio Purificado',
    COPPER: 'Cobre Recuperado',
};
const MATERIAL_TYPE_TO_TOKEN_ID = {
    ALUMINUM: materials_blockchain_service_1.MaterialTokenId.ALUMINUM,
    GLASS: materials_blockchain_service_1.MaterialTokenId.GLASS,
    SILICON: materials_blockchain_service_1.MaterialTokenId.SILICON,
    COPPER: materials_blockchain_service_1.MaterialTokenId.COPPER,
};
let MaterialsMarketplaceService = MaterialsMarketplaceService_1 = class MaterialsMarketplaceService {
    prisma;
    materialsBlockchain;
    logger = new common_1.Logger(MaterialsMarketplaceService_1.name);
    constructor(prisma, materialsBlockchain) {
        this.prisma = prisma;
        this.materialsBlockchain = materialsBlockchain;
    }
    async getAvailability() {
        const stocks = await this.prisma.materialStock.findMany({
            orderBy: { type: 'asc' },
        });
        let blockchainBalances = null;
        if (this.materialsBlockchain.isConnected()) {
            try {
                blockchainBalances = await this.materialsBlockchain.getTreasuryBalances();
            }
            catch (error) {
                this.logger.warn('Could not fetch blockchain balances, using DB only');
            }
        }
        return stocks.map(stock => {
            const blockchainKg = blockchainBalances
                ? blockchainBalances[stock.type.toLowerCase()]
                : stock.availableKg;
            const availableKg = Math.min(stock.availableKg, blockchainKg || stock.availableKg);
            return {
                type: stock.type,
                name: stock.name,
                availableKg,
                availableTokens: Math.floor(availableKg * TOKENS_PER_KG),
                pricePerKg: stock.pricePerKg,
                totalValue: availableKg * stock.pricePerKg,
            };
        });
    }
    async createOrder(dto) {
        const { buyerId, materialType, quantityKg, buyerWallet, destination, destinationNotes } = dto;
        if (!ethers_1.ethers.isAddress(buyerWallet)) {
            throw new common_1.BadRequestException('Wallet address inválida');
        }
        const validTypes = ['ALUMINUM', 'GLASS', 'SILICON', 'COPPER'];
        if (!validTypes.includes(materialType.toUpperCase())) {
            throw new common_1.BadRequestException('Tipo de material inválido');
        }
        const materialTypeEnum = materialType.toUpperCase();
        const stock = await this.prisma.materialStock.findUnique({
            where: { type: materialTypeEnum },
        });
        if (!stock) {
            throw new common_1.NotFoundException('Material no encontrado');
        }
        if (stock.availableKg < quantityKg) {
            throw new common_1.BadRequestException(`Stock insuficiente. Disponible: ${stock.availableKg} kg, Solicitado: ${quantityKg} kg`);
        }
        const totalPrice = quantityKg * stock.pricePerKg;
        const tokensToTransfer = Math.round(quantityKg * TOKENS_PER_KG);
        const order = await this.prisma.materialOrder.create({
            data: {
                buyerId: buyerId && buyerId !== 'demo-buyer-id' ? buyerId : null,
                materialType: materialTypeEnum,
                quantityKg,
                pricePerKg: stock.pricePerKg,
                totalPrice,
                buyerWallet,
                destination: destination || 'OTHER',
                destinationNotes: destinationNotes || null,
                status: client_1.OrderStatus.PROCESSING,
            },
        });
        this.logger.log(`Order created: ${order.id} for ${quantityKg}kg of ${materialType}`);
        let txHash = null;
        let orderStatus = client_1.OrderStatus.COMPLETED;
        try {
            if (this.materialsBlockchain.isConnected()) {
                this.logger.log(`Transferring ${tokensToTransfer} tokens to ${buyerWallet}`);
                const materialTokenId = MATERIAL_TYPE_TO_TOKEN_ID[materialTypeEnum];
                const transferResult = await this.materialsBlockchain.transferToBuyer(buyerWallet, materialTokenId, quantityKg, order.id);
                txHash = transferResult.txHash;
                this.logger.log(`Blockchain transfer successful. TxHash: ${txHash}`);
            }
            else {
                this.logger.warn('Blockchain not connected, order completed without token transfer');
            }
            await this.prisma.materialStock.update({
                where: { type: materialTypeEnum },
                data: {
                    availableKg: { decrement: quantityKg },
                    reservedKg: { increment: quantityKg },
                },
            });
        }
        catch (error) {
            this.logger.error(`Error processing order ${order.id}:`, error);
            orderStatus = client_1.OrderStatus.FAILED;
        }
        const updatedOrder = await this.prisma.materialOrder.update({
            where: { id: order.id },
            data: {
                status: orderStatus,
                blockchainTxHash: txHash,
                completedAt: orderStatus === client_1.OrderStatus.COMPLETED ? new Date() : null,
            },
        });
        return {
            success: orderStatus === client_1.OrderStatus.COMPLETED,
            message: orderStatus === client_1.OrderStatus.COMPLETED
                ? `Compra exitosa. ${tokensToTransfer} tokens transferidos a tu wallet.`
                : 'Error al procesar la compra. Por favor contacta soporte.',
            order: {
                id: updatedOrder.id,
                materialType: updatedOrder.materialType,
                quantityKg: updatedOrder.quantityKg,
                totalPrice: updatedOrder.totalPrice,
                status: updatedOrder.status,
                blockchainTxHash: updatedOrder.blockchainTxHash,
                tokensTransferred: orderStatus === client_1.OrderStatus.COMPLETED ? tokensToTransfer : 0,
            },
        };
    }
    async getOrdersByBuyer(buyerId) {
        return this.prisma.materialOrder.findMany({
            where: { buyerId },
            orderBy: { createdAt: 'desc' },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getOrderById(orderId) {
        const order = await this.prisma.materialOrder.findUnique({
            where: { id: orderId },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        walletAddress: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden no encontrada');
        }
        return order;
    }
};
exports.MaterialsMarketplaceService = MaterialsMarketplaceService;
exports.MaterialsMarketplaceService = MaterialsMarketplaceService = MaterialsMarketplaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        materials_blockchain_service_1.MaterialsBlockchainService])
], MaterialsMarketplaceService);
//# sourceMappingURL=materials-marketplace.service.js.map