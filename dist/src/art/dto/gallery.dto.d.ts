export declare enum ArtSortBy {
    NEWEST = "newest",
    PRICE_ASC = "price_asc",
    PRICE_DESC = "price_desc",
    TITLE = "title"
}
export declare class GalleryFiltersDto {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: ArtSortBy;
    page?: number;
    limit?: number;
}
export declare class GalleryArtPieceDto {
    id: string;
    title: string;
    artist: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    imageUrl: string | null;
    isAvailable: boolean;
    tokenId: string | null;
    sourceAssetId: string | null;
    createdAt: Date;
}
export declare class GalleryResponseDto {
    artPieces: GalleryArtPieceDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    availableFilters: {
        categories: string[];
        priceRange: {
            min: number;
            max: number;
        };
        artists: string[];
    };
}
export declare class GalleryStatsDto {
    totalPieces: number;
    availablePieces: number;
    soldPieces: number;
    totalValue: number;
    byCategory: {
        category: string;
        count: number;
        totalValue: number;
    }[];
    topArtists: {
        artist: string;
        count: number;
    }[];
}
