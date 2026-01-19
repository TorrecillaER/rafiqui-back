export declare class CreateArtOrderDto {
    artPieceId: string;
    buyerWallet: string;
    buyerId?: string;
    messageToArtist?: string;
}
export declare class ArtOrderResponseDto {
    success: boolean;
    message: string;
    order: {
        id: string;
        artPieceId: string;
        tokenId: string;
        title: string;
        artist: string;
        price: number;
        blockchainTxHash: string | null;
    };
}
