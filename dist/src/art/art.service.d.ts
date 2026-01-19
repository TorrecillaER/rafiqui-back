import { PrismaService } from '../prisma/prisma.service';
import { CreateArtPieceDto, UpdateArtPieceDto, ArtPieceResponseDto, ArtCategory } from './dto/art.dto';
import { PublishArtDto, PublishArtResponseDto, FindArtCandidateResponseDto } from './dto/publish-art.dto';
import { GalleryFiltersDto, GalleryResponseDto, GalleryStatsDto } from './dto/gallery.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
export declare class ArtService {
    private prisma;
    private blockchainService;
    private readonly logger;
    constructor(prisma: PrismaService, blockchainService: BlockchainService);
    create(dto: CreateArtPieceDto): Promise<ArtPieceResponseDto>;
    findAll(category?: ArtCategory): Promise<ArtPieceResponseDto[]>;
    findAvailable(category?: ArtCategory): Promise<ArtPieceResponseDto[]>;
    findOne(id: string): Promise<ArtPieceResponseDto>;
    update(id: string, dto: UpdateArtPieceDto): Promise<ArtPieceResponseDto>;
    remove(id: string): Promise<void>;
    createFromAsset(assetId: string, dto: Omit<CreateArtPieceDto, 'sourceAssetId'>): Promise<ArtPieceResponseDto>;
    findArtCandidateByQrCode(qrCode: string): Promise<FindArtCandidateResponseDto>;
    publishArt(dto: PublishArtDto): Promise<PublishArtResponseDto>;
    getStats(): Promise<{
        total: number;
        available: number;
        sold: number;
        byCategory: Record<string, number>;
    }>;
    getGallery(filters: GalleryFiltersDto): Promise<GalleryResponseDto>;
    private getAvailableFilters;
    getGalleryStats(): Promise<GalleryStatsDto>;
    getFeaturedArt(): Promise<ArtPieceResponseDto | null>;
    private toResponseDto;
}
