import { ArtService } from './art.service';
import { CreateArtPieceDto, UpdateArtPieceDto, ArtCategory } from './dto/art.dto';
import { PublishArtDto, PublishArtResponseDto, FindArtCandidateResponseDto } from './dto/publish-art.dto';
import { GalleryFiltersDto, GalleryResponseDto, GalleryStatsDto } from './dto/gallery.dto';
import { ArtPieceResponseDto } from './dto/art.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class ArtController {
    private readonly artService;
    private readonly cloudinaryService;
    constructor(artService: ArtService, cloudinaryService: CloudinaryService);
    uploadArtImage(file: Express.Multer.File): Promise<{
        success: boolean;
        imageUrl: string;
        publicId: string;
        width: number;
        height: number;
        format: string;
    }>;
    create(dto: CreateArtPieceDto): Promise<ArtPieceResponseDto>;
    getGallery(filters: GalleryFiltersDto): Promise<GalleryResponseDto>;
    getGalleryStats(): Promise<GalleryStatsDto>;
    getFeaturedArt(): Promise<ArtPieceResponseDto | null>;
    findAll(category?: ArtCategory): Promise<ArtPieceResponseDto[]>;
    findAvailable(category?: ArtCategory): Promise<ArtPieceResponseDto[]>;
    getStats(): Promise<{
        total: number;
        available: number;
        sold: number;
        byCategory: Record<string, number>;
    }>;
    findOne(id: string): Promise<ArtPieceResponseDto>;
    update(id: string, dto: UpdateArtPieceDto): Promise<ArtPieceResponseDto>;
    remove(id: string): Promise<void>;
    createFromAsset(assetId: string, dto: CreateArtPieceDto): Promise<ArtPieceResponseDto>;
    findArtCandidate(qrCode: string): Promise<FindArtCandidateResponseDto>;
    publishArt(dto: PublishArtDto): Promise<PublishArtResponseDto>;
}
