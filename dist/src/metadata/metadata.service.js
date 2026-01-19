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
var MetadataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MetadataService = MetadataService_1 = class MetadataService {
    prisma;
    logger = new common_1.Logger(MetadataService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getArtMetadata(tokenId) {
        this.logger.log(`Fetching art metadata for tokenId: ${tokenId}`);
        const artPiece = await this.prisma.artPiece.findFirst({
            where: { tokenId },
            include: {
                sourceAsset: {
                    select: {
                        brand: true,
                        model: true,
                        qrCode: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!artPiece) {
            this.logger.warn(`Art piece not found for tokenId: ${tokenId}`);
            throw new common_1.NotFoundException(`Art piece with tokenId ${tokenId} not found`);
        }
        const attributes = [
            { trait_type: 'Artist', value: artPiece.artist },
            { trait_type: 'Category', value: artPiece.category },
            { trait_type: 'Currency', value: artPiece.currency },
            { trait_type: 'Price', value: artPiece.price },
        ];
        if (artPiece.sourceAsset) {
            attributes.push({ trait_type: 'Panel Brand', value: artPiece.sourceAsset.brand || 'Unknown' }, { trait_type: 'Panel Model', value: artPiece.sourceAsset.model || 'Unknown' }, { trait_type: 'Panel QR Code', value: artPiece.sourceAsset.qrCode || 'N/A' });
            if (artPiece.sourceAsset.createdAt) {
                attributes.push({
                    trait_type: 'Panel Registered',
                    value: Math.floor(artPiece.sourceAsset.createdAt.getTime() / 1000),
                    display_type: 'date',
                });
            }
        }
        attributes.push({
            trait_type: 'Created',
            value: Math.floor(artPiece.createdAt.getTime() / 1000),
            display_type: 'date',
        });
        const metadata = {
            name: artPiece.title,
            description: artPiece.description || `${artPiece.title} by ${artPiece.artist}. A unique piece of art created from recycled solar panels.`,
            image: artPiece.imageUrl || 'https://rafiqui.com/images/default-art.png',
            external_url: `https://rafiqui.com/gallery/${artPiece.id}`,
            background_color: '102038',
            attributes,
        };
        this.logger.log(`Art metadata generated for tokenId: ${tokenId}`);
        return metadata;
    }
    async getPanelMetadata(tokenId) {
        this.logger.log(`Fetching panel metadata for tokenId: ${tokenId}`);
        const asset = await this.prisma.asset.findFirst({
            where: {
                OR: [
                    { tokenId },
                    { qrCode: tokenId },
                ],
            },
            include: {
                inspection: {
                    select: {
                        measuredVoltage: true,
                        measuredAmps: true,
                        physicalCondition: true,
                        aiRecommendation: true,
                    },
                },
            },
        });
        if (!asset) {
            this.logger.warn(`Panel not found for tokenId: ${tokenId}`);
            throw new common_1.NotFoundException(`Panel with tokenId ${tokenId} not found`);
        }
        const attributes = [
            { trait_type: 'Brand', value: asset.brand || 'Unknown' },
            { trait_type: 'Model', value: asset.model || 'Unknown' },
            { trait_type: 'Status', value: asset.status },
        ];
        if (asset.measuredPowerWatts) {
            attributes.push({ trait_type: 'Power (W)', value: asset.measuredPowerWatts });
        }
        if (asset.measuredVoltage) {
            attributes.push({ trait_type: 'Voltage (V)', value: asset.measuredVoltage });
        }
        if (asset.healthPercentage) {
            attributes.push({ trait_type: 'Health (%)', value: asset.healthPercentage });
        }
        if (asset.capacityRetainedPercent) {
            attributes.push({ trait_type: 'Capacity Retained (%)', value: asset.capacityRetainedPercent });
        }
        if (asset.inspection) {
            attributes.push({ trait_type: 'Inspection Result', value: asset.inspection.aiRecommendation }, { trait_type: 'Physical Condition', value: asset.inspection.physicalCondition });
        }
        attributes.push({
            trait_type: 'Registered',
            value: Math.floor(asset.createdAt.getTime() / 1000),
            display_type: 'date',
        });
        if (asset.refurbishedAt) {
            attributes.push({
                trait_type: 'Refurbished',
                value: Math.floor(asset.refurbishedAt.getTime() / 1000),
                display_type: 'date',
            });
        }
        const metadata = {
            name: `Rafiqui Panel - ${asset.brand || 'Solar'} ${asset.model || 'Panel'}`,
            description: `A refurbished solar panel from Rafiqui's circular economy program. Brand: ${asset.brand || 'Unknown'}, Model: ${asset.model || 'Unknown'}. This panel has been professionally inspected and refurbished for reuse.`,
            image: 'https://rafiqui.com/images/default-panel.png',
            external_url: `https://rafiqui.com/marketplace/panels/${asset.id}`,
            background_color: '93E1D8',
            attributes,
        };
        this.logger.log(`Panel metadata generated for tokenId: ${tokenId}`);
        return metadata;
    }
};
exports.MetadataService = MetadataService;
exports.MetadataService = MetadataService = MetadataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetadataService);
//# sourceMappingURL=metadata.service.js.map