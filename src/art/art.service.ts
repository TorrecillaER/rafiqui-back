import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtPieceDto, UpdateArtPieceDto, ArtPieceResponseDto, ArtCategory } from './dto/art.dto';
import { PublishArtDto, PublishArtResponseDto, FindArtCandidateResponseDto } from './dto/publish-art.dto';
import { GalleryFiltersDto, GalleryResponseDto, GalleryStatsDto, ArtSortBy } from './dto/gallery.dto';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';
import { AssetStatus, ArtCategory as PrismaArtCategory } from '@prisma/client';

@Injectable()
export class ArtService {
  private readonly logger = new Logger(ArtService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async create(dto: CreateArtPieceDto): Promise<ArtPieceResponseDto> {
    const artPiece = await this.prisma.artPiece.create({
      data: {
        title: dto.title,
        artist: dto.artist,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || (dto.category === ArtCategory.NFT ? 'ETH' : 'USD'),
        category: dto.category as any, // Cast to any to avoid strict enum checking issues if mismatch occurs
        imageUrl: dto.imageUrl,
        sourceAssetId: dto.sourceAssetId,
      },
    });

    return this.toResponseDto(artPiece);
  }

  async findAll(category?: ArtCategory): Promise<ArtPieceResponseDto[]> {
    const where = category ? { category: category as any } : {};
    
    const artPieces = await this.prisma.artPiece.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return artPieces.map(this.toResponseDto);
  }

  async findAvailable(category?: ArtCategory): Promise<ArtPieceResponseDto[]> {
    const where: any = { isAvailable: true };
    if (category) {
      where.category = category;
    }

    const artPieces = await this.prisma.artPiece.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return artPieces.map(this.toResponseDto);
  }

  async findOne(id: string): Promise<ArtPieceResponseDto> {
    const artPiece = await this.prisma.artPiece.findUnique({
      where: { id },
    });

    if (!artPiece) {
      throw new NotFoundException(`Art piece with ID ${id} not found`);
    }

    return this.toResponseDto(artPiece);
  }

  async update(id: string, dto: UpdateArtPieceDto): Promise<ArtPieceResponseDto> {
    const artPiece = await this.prisma.artPiece.update({
      where: { id },
      data: {
        ...dto,
        category: undefined, // Prevent category update through generic update DTO if not intended
      },
    });

    return this.toResponseDto(artPiece);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.artPiece.delete({
      where: { id },
    });
  }

  // Crear arte desde un Asset marcado como candidato
  async createFromAsset(assetId: string, dto: Omit<CreateArtPieceDto, 'sourceAssetId'>): Promise<ArtPieceResponseDto> {
    // Verificar que el asset existe
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    return this.create({
      ...dto,
      sourceAssetId: assetId,
    });
  }

  // Buscar asset candidato a arte por QR Code
  async findArtCandidateByQrCode(qrCode: string): Promise<FindArtCandidateResponseDto> {
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

    if (asset.status !== AssetStatus.ART_CANDIDATE) {
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

  // Publicar obra de arte
  async publishArt(dto: PublishArtDto): Promise<PublishArtResponseDto> {
    const { assetId, title, artist, description, priceMxn, imageUrl } = dto;

    this.logger.log(`[publishArt] DTO recibido: ${JSON.stringify(dto)}`);
    this.logger.log(`[publishArt] priceMxn: ${priceMxn}, tipo: ${typeof priceMxn}`);

    // Buscar el asset
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { artPiece: true },
    });

    if (!asset) {
      throw new NotFoundException('Asset no encontrado');
    }

    // Validar estado
    if (asset.status !== AssetStatus.ART_CANDIDATE) {
      throw new BadRequestException(
        `El panel no es candidato a arte. Estado actual: ${asset.status}`
      );
    }

    // Validar que no tenga ya una obra
    if (asset.artPiece) {
      throw new BadRequestException('Este panel ya tiene una obra de arte asociada');
    }

    // Convertir precio MXN a USD (aproximado)
    const exchangeRate = 17.5;
    const priceUsd = Math.round((priceMxn / exchangeRate) * 100) / 100;
    
    this.logger.log(`[publishArt] priceUsd calculado: ${priceUsd}`);

    // Transacción: crear ArtPiece y actualizar Asset
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la obra de arte
      const artPiece = await prisma.artPiece.create({
        data: {
          title,
          artist,
          description,
          price: priceUsd,
          currency: 'USD',
          category: PrismaArtCategory.SCULPTURE,
          imageUrl: imageUrl || null,
          isAvailable: true,
          sourceAssetId: assetId,
        },
      });

      // Actualizar estado del asset
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.ART_LISTED_FOR_SALE,
        },
      });

      return artPiece;
    });

    this.logger.log(`Art piece published: ${result.id} for asset ${assetId}`);

    // Mintear NFT en blockchain y guardar tokenId
    let tokenId: string | undefined;
    let blockchainTxHash: string | undefined;
    
    if (this.blockchainService.isConnected()) {
      const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
      this.logger.log(`Attempting to mint NFT for qrCode: ${qrCode}`);
      
      try {
        // Paso 1: Verificar si el panel existe en blockchain
        let panelInfo = await this.blockchainService.getPanel(qrCode);
        this.logger.log(`Panel info from blockchain: ${JSON.stringify(panelInfo)}`);
        
        // Paso 2: Si el panel no existe, registrarlo
        if (!panelInfo) {
          this.logger.log(`Panel ${qrCode} not found in blockchain, registering...`);
          await this.blockchainService.registerPanel(
            qrCode,
            asset.brand || 'Unknown',
            asset.model || 'Unknown',
            'Art Gallery',
            ''
          );
          this.logger.log(`Panel ${qrCode} registered in blockchain`);
          
          // Obtener info del panel recién registrado
          panelInfo = await this.blockchainService.getPanel(qrCode);
        }
        
        // Paso 3: Si el panel no está marcado como arte, actualizarlo a ART_APPROVED
        if (panelInfo && !panelInfo.isArt) {
          this.logger.log(`Panel ${qrCode} exists but isArt=false, updating to ART_APPROVED...`);
          await this.blockchainService.updatePanelStatus(
            qrCode,
            PanelStatus.ART_APPROVED,
            'Art Gallery',
            ''
          );
          this.logger.log(`Panel ${qrCode} marked as ART_APPROVED (isArt=true)`);
          
          // IMPORTANTE: Refrescar panelInfo después de actualizar el estado
          panelInfo = await this.blockchainService.getPanel(qrCode);
          this.logger.log(`Panel info refreshed: ${JSON.stringify(panelInfo)}`);
        }
        
        // Paso 4: Verificar si ya tiene un NFT minteado
        if (panelInfo && panelInfo.artTokenId && Number(panelInfo.artTokenId) > 0) {
          tokenId = panelInfo.artTokenId.toString();
          this.logger.log(`Panel already has NFT with tokenId: ${tokenId}`);
        } else {
          // Paso 5: Mintear el NFT de arte - esto crea el token ERC-721
          const metadataBaseUrl = process.env.NFT_METADATA_BASE_URL || 'https://karla-leporine-healthfully.ngrok-free.dev/metadata/art/';
          
          this.logger.log(`Minting NFT with metadata base URL: ${metadataBaseUrl}`);
          const mintResult = await this.blockchainService.mintArtNFT(
            qrCode,
            metadataBaseUrl,
            this.blockchainService.getTreasuryAddress()
          );
          
          blockchainTxHash = mintResult.txHash;
          tokenId = mintResult.tokenId.toString();
          
          this.logger.log(`Art NFT minted successfully: tokenId=${tokenId}, tx: ${blockchainTxHash}`);
        }
        
        // Paso 6: Guardar el tokenId en la obra de arte y en el asset
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
      } catch (error: any) {
        this.logger.error(`Failed to mint NFT for art ${assetId}: ${error.message}`, error.stack);
        if (error.reason) {
          this.logger.error(`Blockchain error reason: ${error.reason}`);
        }
      }
    } else {
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
        sourceAssetId: result.sourceAssetId!,
        createdAt: result.createdAt,
        tokenId,
      },
      blockchainTxHash,
    };
  }

  // Estadísticas de arte
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
      }, {} as Record<string, number>),
    };
  }

  // Galería para marketplace web
  async getGallery(filters: GalleryFiltersDto): Promise<GalleryResponseDto> {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = ArtSortBy.NEWEST,
      page = 1,
      limit = 12,
    } = filters;

    // Construir where clause
    const where: any = {
      isAvailable: true,
    };

    if (category) {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determinar ordenamiento
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case ArtSortBy.PRICE_ASC:
        orderBy = { price: 'asc' };
        break;
      case ArtSortBy.PRICE_DESC:
        orderBy = { price: 'desc' };
        break;
      case ArtSortBy.TITLE:
        orderBy = { title: 'asc' };
        break;
    }

    // Ejecutar consultas en paralelo
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

  // Filtros disponibles
  private async getAvailableFilters() {
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

  // Estadísticas de galería
  async getGalleryStats(): Promise<GalleryStatsDto> {
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

  // Obra destacada (más reciente)
  async getFeaturedArt() {
    const featured = await this.prisma.artPiece.findFirst({
      where: { isAvailable: true },
      orderBy: { createdAt: 'desc' },
    });

    return featured ? this.toResponseDto(featured) : null;
  }

  private toResponseDto(artPiece: any): ArtPieceResponseDto {
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
}

