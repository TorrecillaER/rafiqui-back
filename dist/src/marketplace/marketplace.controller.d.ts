import { MarketplaceService } from './marketplace.service';
import { MarketplaceFiltersDto, MarketplaceResponseDto, MarketplacePanelsResponseDto } from '../assets/dto/marketplace.dto';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    getListings(filters: MarketplaceFiltersDto): Promise<MarketplaceResponseDto>;
    getPanels(filters: MarketplaceFiltersDto): Promise<MarketplacePanelsResponseDto>;
}
