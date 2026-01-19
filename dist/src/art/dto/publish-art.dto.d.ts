export declare class PublishArtDto {
    assetId: string;
    title: string;
    artist: string;
    description: string;
    priceMxn: number;
    imageUrl?: string;
    artistId?: string;
}
export declare class PublishArtResponseDto {
    success: boolean;
    message: string;
    artPiece?: {
        id: string;
        title: string;
        artist: string;
        description: string;
        price: number;
        currency: string;
        imageUrl: string | null;
        sourceAssetId: string;
        tokenId: string | null | undefined;
        createdAt: Date;
    };
    blockchainTxHash?: string;
}
export declare class FindArtCandidateResponseDto {
    success: boolean;
    message: string;
    asset?: {
        id: string;
        qrCode: string | null;
        brand: string | null;
        model: string | null;
        status: string;
        inspection?: {
            id: string;
            result: string;
            notes: string | null;
        };
    };
}
