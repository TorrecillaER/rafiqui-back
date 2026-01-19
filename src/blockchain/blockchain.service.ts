import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as RafiquiTrackerABI from './abi/RafiquiTracker.json';

// Enum que coincide con el contrato
export enum PanelStatus {
  COLLECTED = 0,
  WAREHOUSE_RECEIVED = 1,
  INSPECTED = 2,
  REUSE_APPROVED = 3,
  RECYCLE_APPROVED = 4,
  ART_APPROVED = 5,
  SOLD = 6,
  RECYCLED = 7,
  ART_MINTED = 8,
  ART_LISTED = 9,
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

// Configuración de gas para Polygon Amoy (testnet)
// El mínimo de la red es 25 gwei, usamos 26 gwei con margen
const GAS_CONFIG = {
  gasPrice: ethers.parseUnits('26', 'gwei'), // 26 gwei (mínimo de red es 25 gwei)
  gasLimit: 500000, // Límite de gas por transacción
};

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/';
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

    if (!privateKey || !contractAddress) {
      this.logger.warn('Blockchain credentials not configured. Blockchain features disabled.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        contractAddress,
        RafiquiTrackerABI.abi,
        this.wallet
      );

      const network = await this.provider.getNetwork();
      this.logger.log(`Connected to blockchain: ${network.name} (chainId: ${network.chainId})`);
    } catch (error) {
      this.logger.error('Failed to initialize blockchain connection', error);
    }
  }

  /**
   * Verifica si el servicio está conectado
   */
  isConnected(): boolean {
    return !!this.contract;
  }

  /**
   * Obtiene la dirección del treasury (wallet del backend)
   */
  getTreasuryAddress(): string {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.address;
  }

  /**
   * Registra un nuevo panel en la blockchain
   */
  async registerPanel(
    qrCode: string,
    brand: string,
    model: string,
    location: string,
    ipfsHash: string = ''
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    try {
      this.logger.log(`Registering panel: ${qrCode}, brand: ${brand}, model: ${model}`);
      
      // Llamar al contrato sin opciones de gas adicionales (usar defaults de la red)
      const tx = await this.contract.registerPanel(
        qrCode,
        brand,
        model,
        location,
        ipfsHash || ''
      );
      
      this.logger.log(`Tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      this.logger.log(`Panel registered: ${qrCode}, tx: ${receipt?.hash}, block: ${receipt?.blockNumber}`);
      return receipt?.hash || tx.hash;
    } catch (error) {
      this.logger.error(`Failed to register panel ${qrCode}`, error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un panel
   */
  async updatePanelStatus(
    qrCode: string,
    status: PanelStatus,
    location: string,
    ipfsHash: string = ''
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    try {
      const tx = await this.contract.updateStatus(
        qrCode,
        status,
        location,
        ipfsHash || ''
      );
      const receipt = await tx.wait();
      this.logger.log(`Panel status updated: ${qrCode} -> ${PanelStatus[status]}, tx: ${receipt?.hash}`);
      return receipt?.hash || tx.hash;
    } catch (error) {
      this.logger.error(`Failed to update panel ${qrCode}`, error);
      throw error;
    }
  }

  /**
   * Mintea un NFT de arte
   */
  async mintArtNFT(
    qrCode: string,
    tokenURI: string,
    ownerAddress: string
  ): Promise<{ txHash: string; tokenId: number }> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    try {
      const tx = await this.contract.mintArtNFT(
        qrCode,
        tokenURI,
        ownerAddress
      );
      const receipt = await tx.wait();

      // Obtener el tokenId del evento
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === 'ArtNFTMinted'
      );
      const tokenId = event ? Number(event.args[1]) : 0;

      this.logger.log(`Art NFT minted: ${qrCode}, tokenId: ${tokenId}, tx: ${receipt?.hash}`);
      return { txHash: receipt?.hash || tx.hash, tokenId };
    } catch (error) {
      this.logger.error(`Failed to mint NFT for ${qrCode}`, error);
      throw error;
    }
  }

  /**
   * Obtiene información de un panel
   */
  async getPanel(qrCode: string): Promise<Panel | null> {
    if (!this.contract) {
      return null;
    }

    try {
      const panel = await this.contract.getPanel(qrCode);
      return {
        qrCode: panel.qrCode,
        brand: panel.brand,
        model: panel.model,
        collector: panel.collector,
        inspector: panel.inspector,
        createdAt: Number(panel.createdAt),
        isArt: panel.isArt,
        artTokenId: Number(panel.artTokenId),
      };
    } catch (error) {
      this.logger.error(`Failed to get panel ${qrCode}`, error);
      return null;
    }
  }

  /**
   * Obtiene el historial de un panel
   */
  async getPanelHistory(qrCode: string): Promise<PanelHistory[]> {
    if (!this.contract) {
      return [];
    }

    try {
      const history = await this.contract.getPanelHistory(qrCode);
      return history.map((h: any) => ({
        status: Number(h.status) as PanelStatus,
        location: h.location,
        timestamp: Number(h.timestamp),
        ipfsHash: h.ipfsHash,
        updatedBy: h.updatedBy,
      }));
    } catch (error) {
      this.logger.error(`Failed to get history for ${qrCode}`, error);
      return [];
    }
  }

  /**
   * Obtiene el estado actual de un panel
   */
  async getCurrentStatus(qrCode: string): Promise<PanelHistory | null> {
    if (!this.contract) {
      return null;
    }

    try {
      const status = await this.contract.getCurrentStatus(qrCode);
      return {
        status: Number(status.status) as PanelStatus,
        location: status.location,
        timestamp: Number(status.timestamp),
        ipfsHash: status.ipfsHash,
        updatedBy: status.updatedBy,
      };
    } catch (error) {
      this.logger.error(`Failed to get current status for ${qrCode}`, error);
      return null;
    }
  }

  /**
   * Transfiere un panel (NFT ERC-721) a un comprador
   */
  async transferPanel(tokenId: string, toAddress: string): Promise<string> {
    if (!this.contract || !this.wallet) {
      throw new Error('Blockchain not connected');
    }

    this.logger.log(`Transferring panel tokenId ${tokenId} to ${toAddress}`);

    try {
      const tx = await this.contract['safeTransferFrom(address,address,uint256)'](
        this.wallet.address,
        toAddress,
        tokenId,
        GAS_CONFIG,
      );

      const receipt = await tx.wait();
      this.logger.log(`Panel transferred successfully. TxHash: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      this.logger.error(`Error transferring panel tokenId ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Transfiere una obra de arte (NFT ERC-721) a un comprador
   */
  async transferArt(tokenId: string, toAddress: string): Promise<string> {
    if (!this.contract || !this.wallet) {
      throw new Error('Blockchain not connected');
    }

    this.logger.log(`Transferring art tokenId ${tokenId} to ${toAddress}`);

    try {
      const tx = await this.contract['safeTransferFrom(address,address,uint256)'](
        this.wallet.address,
        toAddress,
        tokenId,
        GAS_CONFIG,
      );

      const receipt = await tx.wait();
      this.logger.log(`Art transferred successfully. TxHash: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      this.logger.error(`Error transferring art tokenId ${tokenId}:`, error);
      throw error;
    }
  }
}
