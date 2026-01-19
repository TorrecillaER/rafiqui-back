import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceFiltersDto, MarketplaceResponseDto, MarketplacePanelsResponseDto } from '../assets/dto/marketplace.dto';
export declare class MarketplaceService {
    private prisma;
    private readonly logger;
    private readonly CLOUDINARY_CLOUD_NAME;
    private readonly CLOUDINARY_FOLDER;
    private readonly BRAND_IMAGE_MAP;
    constructor(prisma: PrismaService);
    getMarketplaceListings(filters: MarketplaceFiltersDto): Promise<MarketplaceResponseDto>;
    getMarketplacePanels(filters: MarketplaceFiltersDto): Promise<MarketplacePanelsResponseDto>;
    private buildWhereClause;
    private buildOrderBy;
    private groupPanels;
    private createGroupDto;
    private calculateHealthGrade;
    private getPowerBucket;
    private getImageUrl;
    private mapToMarketplacePanel;
    private getAvailableFilters;
}
