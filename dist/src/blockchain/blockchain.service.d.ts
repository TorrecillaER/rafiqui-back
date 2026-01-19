import { OnModuleInit } from '@nestjs/common';
export declare enum PanelStatus {
    COLLECTED = 0,
    WAREHOUSE_RECEIVED = 1,
    INSPECTED = 2,
    REUSE_APPROVED = 3,
    RECYCLE_APPROVED = 4,
    ART_APPROVED = 5,
    SOLD = 6,
    RECYCLED = 7,
    ART_MINTED = 8,
    ART_LISTED = 9
}
export interface PanelHistory {
    status: PanelStatus;
    location: string;
    timestamp: number;
    ipfsHash: string;
    updatedBy: string;
}
export interface Panel {
    qrCode: string;
    brand: string;
    model: string;
    collector: string;
    inspector: string;
    createdAt: number;
    isArt: boolean;
    artTokenId: number;
}
export declare class BlockchainService implements OnModuleInit {
    private readonly logger;
    private provider;
    private wallet;
    private contract;
    onModuleInit(): Promise<void>;
    private initialize;
    isConnected(): boolean;
    getTreasuryAddress(): string;
    registerPanel(qrCode: string, brand: string, model: string, location: string, ipfsHash?: string): Promise<string>;
    updatePanelStatus(qrCode: string, status: PanelStatus, location: string, ipfsHash?: string): Promise<string>;
    mintArtNFT(qrCode: string, tokenURI: string, ownerAddress: string): Promise<{
        txHash: string;
        tokenId: number;
    }>;
    getPanel(qrCode: string): Promise<Panel | null>;
    getPanelHistory(qrCode: string): Promise<PanelHistory[]>;
    getCurrentStatus(qrCode: string): Promise<PanelHistory | null>;
    transferPanel(tokenId: string, toAddress: string): Promise<string>;
    transferArt(tokenId: string, toAddress: string): Promise<string>;
}
