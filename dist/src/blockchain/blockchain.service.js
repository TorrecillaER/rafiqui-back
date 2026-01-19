"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var BlockchainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = exports.PanelStatus = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const RafiquiTrackerABI = __importStar(require("./abi/RafiquiTracker.json"));
var PanelStatus;
(function (PanelStatus) {
    PanelStatus[PanelStatus["COLLECTED"] = 0] = "COLLECTED";
    PanelStatus[PanelStatus["WAREHOUSE_RECEIVED"] = 1] = "WAREHOUSE_RECEIVED";
    PanelStatus[PanelStatus["INSPECTED"] = 2] = "INSPECTED";
    PanelStatus[PanelStatus["REUSE_APPROVED"] = 3] = "REUSE_APPROVED";
    PanelStatus[PanelStatus["RECYCLE_APPROVED"] = 4] = "RECYCLE_APPROVED";
    PanelStatus[PanelStatus["ART_APPROVED"] = 5] = "ART_APPROVED";
    PanelStatus[PanelStatus["SOLD"] = 6] = "SOLD";
    PanelStatus[PanelStatus["RECYCLED"] = 7] = "RECYCLED";
    PanelStatus[PanelStatus["ART_MINTED"] = 8] = "ART_MINTED";
    PanelStatus[PanelStatus["ART_LISTED"] = 9] = "ART_LISTED";
})(PanelStatus || (exports.PanelStatus = PanelStatus = {}));
const GAS_CONFIG = {
    gasPrice: ethers_1.ethers.parseUnits('26', 'gwei'),
    gasLimit: 500000,
};
let BlockchainService = BlockchainService_1 = class BlockchainService {
    logger = new common_1.Logger(BlockchainService_1.name);
    provider;
    wallet;
    contract;
    async onModuleInit() {
        await this.initialize();
    }
    async initialize() {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/';
        const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
        const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
        if (!privateKey || !contractAddress) {
            this.logger.warn('Blockchain credentials not configured. Blockchain features disabled.');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers_1.ethers.Contract(contractAddress, RafiquiTrackerABI.abi, this.wallet);
            const network = await this.provider.getNetwork();
            this.logger.log(`Connected to blockchain: ${network.name} (chainId: ${network.chainId})`);
        }
        catch (error) {
            this.logger.error('Failed to initialize blockchain connection', error);
        }
    }
    isConnected() {
        return !!this.contract;
    }
    getTreasuryAddress() {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }
        return this.wallet.address;
    }
    async registerPanel(qrCode, brand, model, location, ipfsHash = '') {
        if (!this.contract) {
            throw new Error('Blockchain not connected');
        }
        try {
            this.logger.log(`Registering panel: ${qrCode}, brand: ${brand}, model: ${model}`);
            const tx = await this.contract.registerPanel(qrCode, brand, model, location, ipfsHash || '');
            this.logger.log(`Tx sent: ${tx.hash}`);
            const receipt = await tx.wait();
            this.logger.log(`Panel registered: ${qrCode}, tx: ${receipt?.hash}, block: ${receipt?.blockNumber}`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            this.logger.error(`Failed to register panel ${qrCode}`, error);
            throw error;
        }
    }
    async updatePanelStatus(qrCode, status, location, ipfsHash = '') {
        if (!this.contract) {
            throw new Error('Blockchain not connected');
        }
        try {
            const tx = await this.contract.updateStatus(qrCode, status, location, ipfsHash || '');
            const receipt = await tx.wait();
            this.logger.log(`Panel status updated: ${qrCode} -> ${PanelStatus[status]}, tx: ${receipt?.hash}`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            this.logger.error(`Failed to update panel ${qrCode}`, error);
            throw error;
        }
    }
    async mintArtNFT(qrCode, tokenURI, ownerAddress) {
        if (!this.contract) {
            throw new Error('Blockchain not connected');
        }
        try {
            const tx = await this.contract.mintArtNFT(qrCode, tokenURI, ownerAddress);
            const receipt = await tx.wait();
            const event = receipt?.logs.find((log) => log.fragment?.name === 'ArtNFTMinted');
            const tokenId = event ? Number(event.args[1]) : 0;
            this.logger.log(`Art NFT minted: ${qrCode}, tokenId: ${tokenId}, tx: ${receipt?.hash}`);
            return { txHash: receipt?.hash || tx.hash, tokenId };
        }
        catch (error) {
            this.logger.error(`Failed to mint NFT for ${qrCode}`, error);
            throw error;
        }
    }
    async getPanel(qrCode) {
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
        }
        catch (error) {
            this.logger.error(`Failed to get panel ${qrCode}`, error);
            return null;
        }
    }
    async getPanelHistory(qrCode) {
        if (!this.contract) {
            return [];
        }
        try {
            const history = await this.contract.getPanelHistory(qrCode);
            return history.map((h) => ({
                status: Number(h.status),
                location: h.location,
                timestamp: Number(h.timestamp),
                ipfsHash: h.ipfsHash,
                updatedBy: h.updatedBy,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get history for ${qrCode}`, error);
            return [];
        }
    }
    async getCurrentStatus(qrCode) {
        if (!this.contract) {
            return null;
        }
        try {
            const status = await this.contract.getCurrentStatus(qrCode);
            return {
                status: Number(status.status),
                location: status.location,
                timestamp: Number(status.timestamp),
                ipfsHash: status.ipfsHash,
                updatedBy: status.updatedBy,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get current status for ${qrCode}`, error);
            return null;
        }
    }
    async transferPanel(tokenId, toAddress) {
        if (!this.contract || !this.wallet) {
            throw new Error('Blockchain not connected');
        }
        this.logger.log(`Transferring panel tokenId ${tokenId} to ${toAddress}`);
        try {
            const tx = await this.contract['safeTransferFrom(address,address,uint256)'](this.wallet.address, toAddress, tokenId, GAS_CONFIG);
            const receipt = await tx.wait();
            this.logger.log(`Panel transferred successfully. TxHash: ${receipt.hash}`);
            return receipt.hash;
        }
        catch (error) {
            this.logger.error(`Error transferring panel tokenId ${tokenId}:`, error);
            throw error;
        }
    }
    async transferArt(tokenId, toAddress) {
        if (!this.contract || !this.wallet) {
            throw new Error('Blockchain not connected');
        }
        this.logger.log(`Transferring art tokenId ${tokenId} to ${toAddress}`);
        try {
            const tx = await this.contract['safeTransferFrom(address,address,uint256)'](this.wallet.address, toAddress, tokenId, GAS_CONFIG);
            const receipt = await tx.wait();
            this.logger.log(`Art transferred successfully. TxHash: ${receipt.hash}`);
            return receipt.hash;
        }
        catch (error) {
            this.logger.error(`Error transferring art tokenId ${tokenId}:`, error);
            throw error;
        }
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)()
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map