import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as RafiquiMaterialsABI from './abi/RafiquiMaterials.json';

export enum MaterialTokenId {
  ALUMINUM = 1,
  GLASS = 2,
  SILICON = 3,
  COPPER = 4,
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

@Injectable()
export class MaterialsBlockchainService implements OnModuleInit {
  private readonly logger = new Logger(MaterialsBlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private readonly TOKENS_PER_KG = 10;

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/';
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const contractAddress = process.env.MATERIALS_CONTRACT_ADDRESS;

    if (!privateKey || !contractAddress) {
      this.logger.warn('Materials contract not configured. Token features disabled.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        contractAddress,
        RafiquiMaterialsABI.abi,
        this.wallet
      );

      const network = await this.provider.getNetwork();
      this.logger.log(`Materials contract connected on ${network.name} at ${contractAddress}`);
    } catch (error) {
      this.logger.error('Failed to initialize materials blockchain connection', error);
    }
  }

  isConnected(): boolean {
    return !!this.contract;
  }

  async mintFromRecycle(
    aluminumKg: number,
    glassKg: number,
    siliconKg: number,
    copperKg: number,
    recycleRecordId: string,
  ): Promise<MintResult> {
    if (!this.contract) {
      throw new Error('Materials contract not connected');
    }

    try {
      this.logger.log(`Minting materials for recycle record: ${recycleRecordId}`);
      this.logger.log(`Amounts (kg): Al=${aluminumKg}, Gl=${glassKg}, Si=${siliconKg}, Cu=${copperKg}`);

      const tx = await this.contract.mintFromRecycle(
        Math.round(aluminumKg),
        Math.round(glassKg),
        Math.round(siliconKg),
        Math.round(copperKg),
        recycleRecordId,
      );

      const receipt = await tx.wait();
      
      this.logger.log(`Materials minted successfully. Tx: ${receipt?.hash}`);

      return {
        txHash: receipt?.hash || tx.hash,
        aluminumTokens: Math.round(aluminumKg) * this.TOKENS_PER_KG,
        glassTokens: Math.round(glassKg) * this.TOKENS_PER_KG,
        siliconTokens: Math.round(siliconKg) * this.TOKENS_PER_KG,
        copperTokens: Math.round(copperKg) * this.TOKENS_PER_KG,
      };
    } catch (error) {
      this.logger.error(`Failed to mint materials for ${recycleRecordId}`, error);
      throw error;
    }
  }

  async transferToBuyer(
    buyerWallet: string,
    materialId: MaterialTokenId,
    amountKg: number,
    orderId: string,
  ): Promise<TransferResult> {
    if (!this.contract) {
      throw new Error('Materials contract not connected');
    }

    if (!ethers.isAddress(buyerWallet)) {
      throw new Error('Invalid buyer wallet address');
    }

    const amountTokens = Math.round(amountKg * this.TOKENS_PER_KG);

    try {
      this.logger.log(`Transferring ${amountKg}kg (${amountTokens} tokens) of material ${materialId} to ${buyerWallet}`);

      const tx = await this.contract.transferToBuyer(
        buyerWallet,
        materialId,
        amountTokens,
        orderId,
      );

      const receipt = await tx.wait();
      
      this.logger.log(`Transfer successful. Tx: ${receipt?.hash}`);

      return {
        txHash: receipt?.hash || tx.hash,
        materialId,
        amount: amountTokens,
        to: buyerWallet,
      };
    } catch (error) {
      this.logger.error(`Failed to transfer material ${materialId} to ${buyerWallet}`, error);
      throw error;
    }
  }

  async batchTransferToBuyer(
    buyerWallet: string,
    materials: { materialId: MaterialTokenId; amountKg: number }[],
    orderId: string,
  ): Promise<{ txHash: string; transfers: { materialId: number; amount: number }[] }> {
    if (!this.contract) {
      throw new Error('Materials contract not connected');
    }

    if (!ethers.isAddress(buyerWallet)) {
      throw new Error('Invalid buyer wallet address');
    }

    const materialIds = materials.map(m => m.materialId);
    const amounts = materials.map(m => Math.round(m.amountKg * this.TOKENS_PER_KG));

    try {
      this.logger.log(`Batch transferring ${materials.length} materials to ${buyerWallet}`);

      const tx = await this.contract.batchTransferToBuyer(
        buyerWallet,
        materialIds,
        amounts,
        orderId,
      );

      const receipt = await tx.wait();
      
      this.logger.log(`Batch transfer successful. Tx: ${receipt?.hash}`);

      return {
        txHash: receipt?.hash || tx.hash,
        transfers: materials.map((m, i) => ({
          materialId: m.materialId,
          amount: amounts[i],
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to batch transfer to ${buyerWallet}`, error);
      throw error;
    }
  }

  async getTreasuryBalances(): Promise<MaterialBalances> {
    if (!this.contract) {
      return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    }

    try {
      const balances = await this.contract.getTreasuryBalances();
      return {
        aluminum: Number(balances.aluminum) / this.TOKENS_PER_KG,
        glass: Number(balances.glass) / this.TOKENS_PER_KG,
        silicon: Number(balances.silicon) / this.TOKENS_PER_KG,
        copper: Number(balances.copper) / this.TOKENS_PER_KG,
      };
    } catch (error) {
      this.logger.error('Failed to get treasury balances', error);
      return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    }
  }

  async getWalletBalances(walletAddress: string): Promise<MaterialBalances> {
    if (!this.contract) {
      return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    try {
      const balances = await this.contract.getAllBalances(walletAddress);
      return {
        aluminum: Number(balances.aluminum) / this.TOKENS_PER_KG,
        glass: Number(balances.glass) / this.TOKENS_PER_KG,
        silicon: Number(balances.silicon) / this.TOKENS_PER_KG,
        copper: Number(balances.copper) / this.TOKENS_PER_KG,
      };
    } catch (error) {
      this.logger.error(`Failed to get balances for ${walletAddress}`, error);
      return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    }
  }

  async getRecycleRecord(recordId: string): Promise<any> {
    if (!this.contract) {
      return null;
    }

    try {
      const record = await this.contract.getRecycleRecord(recordId);
      return {
        recordId: record.recordId,
        aluminumKg: Number(record.aluminumKg),
        glassKg: Number(record.glassKg),
        siliconKg: Number(record.siliconKg),
        copperKg: Number(record.copperKg),
        timestamp: Number(record.timestamp),
        minted: record.minted,
      };
    } catch (error) {
      this.logger.error(`Failed to get recycle record ${recordId}`, error);
      return null;
    }
  }
}
