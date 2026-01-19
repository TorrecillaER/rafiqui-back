import { BlockchainService, PanelStatus } from './blockchain.service';
export declare class RegisterPanelDto {
    qrCode: string;
    brand: string;
    model: string;
    location: string;
    ipfsHash?: string;
}
export declare class UpdateStatusDto {
    qrCode: string;
    status: PanelStatus;
    location: string;
    ipfsHash?: string;
}
export declare class MintArtDto {
    qrCode: string;
    tokenURI: string;
    ownerAddress: string;
}
export declare class BlockchainController {
    private readonly blockchainService;
    constructor(blockchainService: BlockchainService);
    getStatus(): {
        connected: boolean;
    };
    registerPanel(dto: RegisterPanelDto): Promise<{
        success: boolean;
        txHash: string;
    }>;
    updateStatus(dto: UpdateStatusDto): Promise<{
        success: boolean;
        txHash: string;
    }>;
    mintArt(dto: MintArtDto): Promise<{
        txHash: string;
        tokenId: number;
        success: boolean;
    }>;
    getPanel(qrCode: string): Promise<import("./blockchain.service").Panel>;
    getHistory(qrCode: string): Promise<import("./blockchain.service").PanelHistory[]>;
}
