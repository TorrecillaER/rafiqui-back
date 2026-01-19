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
var MaterialsBlockchainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialsBlockchainService = exports.MaterialTokenId = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const RafiquiMaterialsABI = __importStar(require("./abi/RafiquiMaterials.json"));
var MaterialTokenId;
(function (MaterialTokenId) {
    MaterialTokenId[MaterialTokenId["ALUMINUM"] = 1] = "ALUMINUM";
    MaterialTokenId[MaterialTokenId["GLASS"] = 2] = "GLASS";
    MaterialTokenId[MaterialTokenId["SILICON"] = 3] = "SILICON";
    MaterialTokenId[MaterialTokenId["COPPER"] = 4] = "COPPER";
})(MaterialTokenId || (exports.MaterialTokenId = MaterialTokenId = {}));
let MaterialsBlockchainService = MaterialsBlockchainService_1 = class MaterialsBlockchainService {
    logger = new common_1.Logger(MaterialsBlockchainService_1.name);
    provider;
    wallet;
    contract;
    TOKENS_PER_KG = 10;
    async onModuleInit() {
        await this.initialize();
    }
    async initialize() {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/';
        const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
        const contractAddress = process.env.MATERIALS_CONTRACT_ADDRESS;
        if (!privateKey || !contractAddress) {
            this.logger.warn('Materials contract not configured. Token features disabled.');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers_1.ethers.Contract(contractAddress, RafiquiMaterialsABI.abi, this.wallet);
            const network = await this.provider.getNetwork();
            this.logger.log(`Materials contract connected on ${network.name} at ${contractAddress}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize materials blockchain connection', error);
        }
    }
    isConnected() {
        return !!this.contract;
    }
    async mintFromRecycle(aluminumKg, glassKg, siliconKg, copperKg, recycleRecordId) {
        if (!this.contract) {
            throw new Error('Materials contract not connected');
        }
        try {
            this.logger.log(`Minting materials for recycle record: ${recycleRecordId}`);
            this.logger.log(`Amounts (kg): Al=${aluminumKg}, Gl=${glassKg}, Si=${siliconKg}, Cu=${copperKg}`);
            const tx = await this.contract.mintFromRecycle(Math.round(aluminumKg), Math.round(glassKg), Math.round(siliconKg), Math.round(copperKg), recycleRecordId);
            const receipt = await tx.wait();
            this.logger.log(`Materials minted successfully. Tx: ${receipt?.hash}`);
            return {
                txHash: receipt?.hash || tx.hash,
                aluminumTokens: Math.round(aluminumKg) * this.TOKENS_PER_KG,
                glassTokens: Math.round(glassKg) * this.TOKENS_PER_KG,
                siliconTokens: Math.round(siliconKg) * this.TOKENS_PER_KG,
                copperTokens: Math.round(copperKg) * this.TOKENS_PER_KG,
            };
        }
        catch (error) {
            this.logger.error(`Failed to mint materials for ${recycleRecordId}`, error);
            throw error;
        }
    }
    async transferToBuyer(buyerWallet, materialId, amountKg, orderId) {
        if (!this.contract) {
            throw new Error('Materials contract not connected');
        }
        if (!ethers_1.ethers.isAddress(buyerWallet)) {
            throw new Error('Invalid buyer wallet address');
        }
        const amountTokens = Math.round(amountKg * this.TOKENS_PER_KG);
        try {
            this.logger.log(`Transferring ${amountKg}kg (${amountTokens} tokens) of material ${materialId} to ${buyerWallet}`);
            const tx = await this.contract.transferToBuyer(buyerWallet, materialId, amountTokens, orderId);
            const receipt = await tx.wait();
            this.logger.log(`Transfer successful. Tx: ${receipt?.hash}`);
            return {
                txHash: receipt?.hash || tx.hash,
                materialId,
                amount: amountTokens,
                to: buyerWallet,
            };
        }
        catch (error) {
            this.logger.error(`Failed to transfer material ${materialId} to ${buyerWallet}`, error);
            throw error;
        }
    }
    async batchTransferToBuyer(buyerWallet, materials, orderId) {
        if (!this.contract) {
            throw new Error('Materials contract not connected');
        }
        if (!ethers_1.ethers.isAddress(buyerWallet)) {
            throw new Error('Invalid buyer wallet address');
        }
        const materialIds = materials.map(m => m.materialId);
        const amounts = materials.map(m => Math.round(m.amountKg * this.TOKENS_PER_KG));
        try {
            this.logger.log(`Batch transferring ${materials.length} materials to ${buyerWallet}`);
            const tx = await this.contract.batchTransferToBuyer(buyerWallet, materialIds, amounts, orderId);
            const receipt = await tx.wait();
            this.logger.log(`Batch transfer successful. Tx: ${receipt?.hash}`);
            return {
                txHash: receipt?.hash || tx.hash,
                transfers: materials.map((m, i) => ({
                    materialId: m.materialId,
                    amount: amounts[i],
                })),
            };
        }
        catch (error) {
            this.logger.error(`Failed to batch transfer to ${buyerWallet}`, error);
            throw error;
        }
    }
    async getTreasuryBalances() {
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
        }
        catch (error) {
            this.logger.error('Failed to get treasury balances', error);
            return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
        }
    }
    async getWalletBalances(walletAddress) {
        if (!this.contract) {
            return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
        }
        if (!ethers_1.ethers.isAddress(walletAddress)) {
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
        }
        catch (error) {
            this.logger.error(`Failed to get balances for ${walletAddress}`, error);
            return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
        }
    }
    async getRecycleRecord(recordId) {
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
        }
        catch (error) {
            this.logger.error(`Failed to get recycle record ${recordId}`, error);
            return null;
        }
    }
};
exports.MaterialsBlockchainService = MaterialsBlockchainService;
exports.MaterialsBlockchainService = MaterialsBlockchainService = MaterialsBlockchainService_1 = __decorate([
    (0, common_1.Injectable)()
], MaterialsBlockchainService);
//# sourceMappingURL=materials-blockchain.service.js.map