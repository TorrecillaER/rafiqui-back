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
var ArtService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const art_dto_1 = require("./dto/art.dto");
const gallery_dto_1 = require("./dto/gallery.dto");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const client_1 = require("@prisma/client");
let ArtService = ArtService_1 = class ArtService {
    prisma;
    blockchainService;
    logger = new common_1.Logger(ArtService_1.name);
    constructor(prisma, blockchainService) {
        this.prisma = prisma;
        this.blockchainService = blockchainService;
    }
    async create(dto) {
        const artPiece = await this.prisma.artPiece.create({
            data: {
                title: dto.title,
                artist: dto.artist,
                description: dto.description,
                price: dto.price,
                currency: dto.currency || (dto.category === art_dto_1.ArtCategory.NFT ? 'ETH' : 'USD'),
                category: dto.category,
                imageUrl: dto.imageUrl,
                sourceAssetId: dto.sourceAssetId,
            },
        });
        return this.toResponseDto(artPiece);
    }
    async findAll(category) {
        const where = category ? { category: category } : {};
        const artPieces = await this.prisma.artPiece.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return artPieces.map(this.toResponseDto);
    }
    async findAvailable(category) {
        const where = { isAvailable: true };
        if (category) {
            where.category = category;
        }
        const artPieces = await this.prisma.artPiece.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return artPieces.map(this.toResponseDto);
    }
    async findOne(id) {
        const artPiece = await this.prisma.artPiece.findUnique({
            where: { id },
        });
        if (!artPiece) {
            throw new common_1.NotFoundException(`Art piece with ID ${id} not found`);
        }
        return this.toResponseDto(artPiece);
    }
    async update(id, dto) {
        const artPiece = await this.prisma.artPiece.update({
            where: { id },
            data: {
                ...dto,
                category: undefined,
            },
        });
        return this.toResponseDto(artPiece);
    }
    async remove(id) {
        await this.prisma.artPiece.delete({
            where: { id },
        });
    }
    async createFromAsset(assetId, dto) {
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            throw new common_1.NotFoundException(`Asset with ID ${assetId} not found`);
        }
        return this.create({
            ...dto,
            sourceAssetId: assetId,
        });
    }
    async findArtCandidateByQrCode(qrCode) {
        const asset = await this.prisma.asset.findFirst({
            where: { qrCode },
            include: {
                artPiece: true,
                inspection: true,
            },
        });
        if (!asset) {
            return { success: false, message: 'Panel no encontrado' };
        }
        if (asset.status !== client_1.AssetStatus.ART_CANDIDATE) {
            return {
                success: false,
                message: `Este panel no es candidato a arte. Estado actual: ${asset.status}`,
            };
        }
        if (asset.artPiece) {
            return {
                success: false,
                message: 'Este panel ya tiene una obra de arte asociada',
            };
        }
        return {
            success: true,
            message: 'Panel encontrado',
            asset: {
                id: asset.id,
                qrCode: asset.qrCode,
                brand: asset.brand,
                model: asset.model,
                status: asset.status,
                inspection: asset.inspection ? {
                    id: asset.inspection.id,
                    result: asset.inspection.aiRecommendation,
                    notes: asset.inspection.notes,
                } : undefined,
            },
        };
    }
    async publishArt(dto) {
        const { assetId, title, artist, description, priceMxn, imageUrl } = dto;
        this.logger.log(`[publishArt] DTO recibido: ${JSON.stringify(dto)}`);
        this.logger.log(`[publishArt] priceMxn: ${priceMxn}, tipo: ${typeof priceMxn}`);
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
            include: { artPiece: true },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset no encontrado');
        }
        if (asset.status !== client_1.AssetStatus.ART_CANDIDATE) {
            throw new common_1.BadRequestException(`El panel no es candidato a arte. Estado actual: ${asset.status}`);
        }
        if (asset.artPiece) {
            throw new common_1.BadRequestException('Este panel ya tiene una obra de arte asociada');
        }
        const exchangeRate = 17.5;
        const priceUsd = Math.round((priceMxn / exchangeRate) * 100) / 100;
        this.logger.log(`[publishArt] priceUsd calculado: ${priceUsd}`);
        const result = await this.prisma.$transaction(async (prisma) => {
            const artPiece = await prisma.artPiece.create({
                data: {
                    title,
                    artist,
                    description,
                    price: priceUsd,
                    currency: 'USD',
                    category: client_1.ArtCategory.SCULPTURE,
                    imageUrl: imageUrl || null,
                    isAvailable: true,
                    sourceAssetId: assetId,
                },
            });
            await prisma.asset.update({
                where: { id: assetId },
                data: {
                    status: client_1.AssetStatus.ART_LISTED_FOR_SALE,
                },
            });
            return artPiece;
        });
        this.logger.log(`Art piece published: ${result.id} for asset ${assetId}`);
        let tokenId;
        let blockchainTxHash;
        if (this.blockchainService.isConnected()) {
            const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
            this.logger.log(`Attempting to mint NFT for qrCode: ${qrCode}`);
            try {
                let panelInfo = await this.blockchainService.getPanel(qrCode);
                this.logger.log(`Panel info from blockchain: ${JSON.stringify(panelInfo)}`);
                if (!panelInfo) {
                    this.logger.log(`Panel ${qrCode} not found in blockchain, registering...`);
                    await this.blockchainService.registerPanel(qrCode, asset.brand || 'Unknown', asset.model || 'Unknown', 'Art Gallery', '');
                    this.logger.log(`Panel ${qrCode} registered in blockchain`);
                    panelInfo = await this.blockchainService.getPanel(qrCode);
                }
                if (panelInfo && !panelInfo.isArt) {
                    this.logger.log(`Panel ${qrCode} exists but isArt=false, updating to ART_APPROVED...`);
                    await this.blockchainService.updatePanelStatus(qrCode, blockchain_service_1.PanelStatus.ART_APPROVED, 'Art Gallery', '');
                    this.logger.log(`Panel ${qrCode} marked as ART_APPROVED (isArt=true)`);
                    panelInfo = await this.blockchainService.getPanel(qrCode);
                    this.logger.log(`Panel info refreshed: ${JSON.stringify(panelInfo)}`);
                }
                if (panelInfo && panelInfo.artTokenId && Number(panelInfo.artTokenId) > 0) {
                    tokenId = panelInfo.artTokenId.toString();
                    this.logger.log(`Panel already has NFT with tokenId: ${tokenId}`);
                }
                else {
                    const metadataBaseUrl = process.env.NFT_METADATA_BASE_URL || 'https://karla-leporine-healthfully.ngrok-free.dev/metadata/art/';
                    this.logger.log(`Minting NFT with metadata base URL: ${metadataBaseUrl}`);
                    const mintResult = await this.blockchainService.mintArtNFT(qrCode, metadataBaseUrl, this.blockchainService.getTreasuryAddress());
                    blockchainTxHash = mintResult.txHash;
                    tokenId = mintResult.tokenId.toString();
                    this.logger.log(`Art NFT minted successfully: tokenId=${tokenId}, tx: ${blockchainTxHash}`);
                }
                if (tokenId) {
                    await this.prisma.artPiece.update({
                        where: { id: result.id },
                        data: { tokenId },
                    });
                    await this.prisma.asset.update({
                        where: { id: assetId },
                        data: { tokenId },
                    });
                    this.logger.log(`TokenId ${tokenId} saved for art piece ${result.id} and asset ${assetId}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to mint NFT for art ${assetId}: ${error.message}`, error.stack);
                if (error.reason) {
                    this.logger.error(`Blockchain error reason: ${error.reason}`);
                }
            }
        }
        else {
            this.logger.warn('Blockchain not connected, skipping NFT minting');
        }
        return {
            success: true,
            message: 'Obra de arte publicada exitosamente. Ya está disponible en el portal web.',
            artPiece: {
                id: result.id,
                title: result.title,
                artist: result.artist,
                description: result.description,
                price: result.price,
                currency: result.currency,
                imageUrl: result.imageUrl,
                sourceAssetId: result.sourceAssetId,
                createdAt: result.createdAt,
                tokenId,
            },
            blockchainTxHash,
        };
    }
    async getStats() {
        const [total, available, byCategory] = await Promise.all([
            this.prisma.artPiece.count(),
            this.prisma.artPiece.count({ where: { isAvailable: true } }),
            this.prisma.artPiece.groupBy({
                by: ['category'],
                _count: { id: true },
            }),
        ]);
        return {
            total,
            available,
            sold: total - available,
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = item._count.id;
                return acc;
            }, {}),
        };
    }
    async getGallery(filters) {
        const { category, minPrice, maxPrice, search, sortBy = gallery_dto_1.ArtSortBy.NEWEST, page = 1, limit = 12, } = filters;
        const where = {
            isAvailable: true,
        };
        if (category) {
            where.category = category;
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined)
                where.price.gte = minPrice;
            if (maxPrice !== undefined)
                where.price.lte = maxPrice;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { artist: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        let orderBy = { createdAt: 'desc' };
        switch (sortBy) {
            case gallery_dto_1.ArtSortBy.PRICE_ASC:
                orderBy = { price: 'asc' };
                break;
            case gallery_dto_1.ArtSortBy.PRICE_DESC:
                orderBy = { price: 'desc' };
                break;
            case gallery_dto_1.ArtSortBy.TITLE:
                orderBy = { title: 'asc' };
                break;
        }
        const [artPieces, total, availableFilters] = await Promise.all([
            this.prisma.artPiece.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.artPiece.count({ where }),
            this.getAvailableFilters(),
        ]);
        return {
            artPieces: artPieces.map((piece) => ({
                id: piece.id,
                title: piece.title,
                artist: piece.artist,
                description: piece.description,
                price: piece.price,
                currency: piece.currency,
                category: piece.category,
                imageUrl: piece.imageUrl,
                isAvailable: piece.isAvailable,
                tokenId: piece.tokenId,
                sourceAssetId: piece.sourceAssetId,
                createdAt: piece.createdAt,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            availableFilters,
        };
    }
    async getAvailableFilters() {
        const [categories, priceRange, artists] = await Promise.all([
            this.prisma.artPiece.groupBy({
                by: ['category'],
                where: { isAvailable: true },
            }),
            this.prisma.artPiece.aggregate({
                where: { isAvailable: true },
                _min: { price: true },
                _max: { price: true },
            }),
            this.prisma.artPiece.groupBy({
                by: ['artist'],
                where: { isAvailable: true },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
        ]);
        return {
            categories: categories.map((c) => c.category),
            priceRange: {
                min: priceRange._min.price || 0,
                max: priceRange._max.price || 10000,
            },
            artists: artists.map((a) => a.artist),
        };
    }
    async getGalleryStats() {
        const [total, available, byCategory, topArtists, totalValue] = await Promise.all([
            this.prisma.artPiece.count(),
            this.prisma.artPiece.count({ where: { isAvailable: true } }),
            this.prisma.artPiece.groupBy({
                by: ['category'],
                _count: { id: true },
                _sum: { price: true },
            }),
            this.prisma.artPiece.groupBy({
                by: ['artist'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),
            this.prisma.artPiece.aggregate({
                where: { isAvailable: true },
                _sum: { price: true },
            }),
        ]);
        return {
            totalPieces: total,
            availablePieces: available,
            soldPieces: total - available,
            totalValue: totalValue._sum.price || 0,
            byCategory: byCategory.map((c) => ({
                category: c.category,
                count: c._count.id,
                totalValue: c._sum.price || 0,
            })),
            topArtists: topArtists.map((a) => ({
                artist: a.artist,
                count: a._count.id,
            })),
        };
    }
    async getFeaturedArt() {
        const featured = await this.prisma.artPiece.findFirst({
            where: { isAvailable: true },
            orderBy: { createdAt: 'desc' },
        });
        return featured ? this.toResponseDto(featured) : null;
    }
    toResponseDto(artPiece) {
        return {
            id: artPiece.id,
            title: artPiece.title,
            artist: artPiece.artist,
            description: artPiece.description,
            price: artPiece.price,
            currency: artPiece.currency,
            category: artPiece.category,
            imageUrl: artPiece.imageUrl,
            isAvailable: artPiece.isAvailable,
            tokenId: artPiece.tokenId,
            sourceAssetId: artPiece.sourceAssetId,
            createdAt: artPiece.createdAt,
        };
    }
};
exports.ArtService = ArtService;
exports.ArtService = ArtService = ArtService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], ArtService);
//# sourceMappingURL=art.service.js.map