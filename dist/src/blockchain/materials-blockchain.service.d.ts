import { OnModuleInit } from '@nestjs/common';
export declare enum MaterialTokenId {
    ALUMINUM = 1,
    GLASS = 2,
    SILICON = 3,
    COPPER = 4
}
export interface MaterialBalances {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
}
export interface MintResult {
    txHash: string;
    aluminumTokens: number;
    glassTokens: number;
    siliconTokens: number;
    copperTokens: number;
}
export interface TransferResult {
    txHash: string;
    materialId: number;
    amount: number;
    to: string;
}
export declare class MaterialsBlockchainService implements OnModuleInit {
    private readonly logger;
    private provider;
    private wallet;
    private contract;
    private readonly TOKENS_PER_KG;
    onModuleInit(): Promise<void>;
    private initialize;
    isConnected(): boolean;
    mintFromRecycle(aluminumKg: number, glassKg: number, siliconKg: number, copperKg: number, recycleRecordId: string): Promise<MintResult>;
    transferToBuyer(buyerWallet: string, materialId: MaterialTokenId, amountKg: number, orderId: string): Promise<TransferResult>;
    batchTransferToBuyer(buyerWallet: string, materials: {
        materialId: MaterialTokenId;
        amountKg: number;
    }[], orderId: string): Promise<{
        txHash: string;
        transfers: {
            materialId: number;
            amount: number;
        }[];
    }>;
    getTreasuryBalances(): Promise<MaterialBalances>;
    getWalletBalances(walletAddress: string): Promise<MaterialBalances>;
    getRecycleRecord(recordId: string): Promise<any>;
}
