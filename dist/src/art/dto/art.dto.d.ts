export declare enum ArtCategory {
    NFT = "NFT",
    SCULPTURE = "SCULPTURE",
    INSTALLATION = "INSTALLATION"
}
export declare class CreateArtPieceDto {
    title: string;
    artist: string;
    description: string;
    price: number;
    currency?: string;
    category: ArtCategory;
    imageUrl?: string;
    sourceAssetId?: string;
}
export declare class UpdateArtPieceDto {
    title?: string;
    artist?: string;
    description?: string;
    price?: number;
    isAvailable?: boolean;
    imageUrl?: string;
    tokenId?: string;
    contractAddress?: string;
}
export declare class ArtPieceResponseDto {
    id: string;
    title: string;
    artist: string;
    description: string;
    price: number;
    currency: string;
    category: ArtCategory;
    imageUrl: string | null;
    isAvailable: boolean;
    tokenId: string | null;
    sourceAssetId: string | null;
    createdAt: Date;
}
