---
description: Integrar contrato ERC-1155 de materiales en el backend NestJS
---

# Step 15: Integración del Contrato de Materiales en Backend

Este workflow integra el contrato RafiquiMaterials (ERC-1155) en el backend NestJS para mintear tokens al reciclar y transferirlos al vender.

## Prerequisitos

- Contrato RafiquiMaterials desplegado (step-14)
- Variables de entorno configuradas
- Backend NestJS funcionando

---

## Paso 1: Copiar ABI del Contrato

Después de compilar el contrato, copiar el ABI:

```bash
# Desde el proyecto de contratos
cp artifacts/contracts/RafiquiMaterials.sol/RafiquiMaterials.json \
   ../rafiqui-back/src/blockchain/abi/
```

O crear manualmente `src/blockchain/abi/RafiquiMaterials.json` con el ABI generado.

---

## Paso 2: Crear Servicio de Materiales Blockchain

Crear `src/blockchain/materials-blockchain.service.ts`:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as RafiquiMaterialsABI from './abi/RafiquiMaterials.json';

// Material Token IDs (deben coincidir con el contrato)
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

  /**
   * Verifica si el servicio está conectado
   */
  isConnected(): boolean {
    return !!this.contract;
  }

  /**
   * Mintea tokens de materiales al reciclar un panel
   */
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

  /**
   * Transfiere tokens de un material a un comprador
   */
  async transferToBuyer(
    buyerWallet: string,
    materialId: MaterialTokenId,
    amountKg: number,
    orderId: string,
  ): Promise<TransferResult> {
    if (!this.contract) {
      throw new Error('Materials contract not connected');
    }

    // Validar dirección
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

  /**
   * Transfiere múltiples materiales a un comprador
   */
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

  /**
   * Obtiene el balance de tokens del treasury (disponible para venta)
   */
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

  /**
   * Obtiene el balance de tokens de una wallet específica
   */
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

  /**
   * Obtiene el supply total de todos los materiales
   */
  async getTotalSupplies(): Promise<MaterialBalances> {
    if (!this.contract) {
      return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    }

    try {
      const supplies = await this.contract.getTotalSupplies();
      return {
        aluminum: Number(supplies.aluminum) / this.TOKENS_PER_KG,
        glass: Number(supplies.glass) / this.TOKENS_PER_KG,
        silicon: Number(supplies.silicon) / this.TOKENS_PER_KG,
        copper: Number(supplies.copper) / this.TOKENS_PER_KG,
      };
    } catch (error) {
      this.logger.error('Failed to get total supplies', error);
      return { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    }
  }

  /**
   * Quema tokens cuando el material es canjeado físicamente
   */
  async redeemMaterial(
    holderWallet: string,
    materialId: MaterialTokenId,
    amountKg: number,
    redemptionId: string,
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Materials contract not connected');
    }

    const amountTokens = Math.round(amountKg * this.TOKENS_PER_KG);

    try {
      this.logger.log(`Redeeming ${amountKg}kg of material ${materialId} from ${holderWallet}`);

      const tx = await this.contract.redeemMaterial(
        holderWallet,
        materialId,
        amountTokens,
        redemptionId,
      );

      const receipt = await tx.wait();
      
      this.logger.log(`Redemption successful. Tx: ${receipt?.hash}`);
      return receipt?.hash || tx.hash;
    } catch (error) {
      this.logger.error(`Failed to redeem material ${materialId}`, error);
      throw error;
    }
  }

  /**
   * Convierte el nombre del material a su token ID
   */
  getMaterialTokenId(materialType: string): MaterialTokenId {
    const mapping: Record<string, MaterialTokenId> = {
      ALUMINUM: MaterialTokenId.ALUMINUM,
      GLASS: MaterialTokenId.GLASS,
      SILICON: MaterialTokenId.SILICON,
      COPPER: MaterialTokenId.COPPER,
    };
    return mapping[materialType.toUpperCase()] || MaterialTokenId.ALUMINUM;
  }

  /**
   * Convierte el token ID al nombre del material
   */
  getMaterialName(tokenId: MaterialTokenId): string {
    const mapping: Record<MaterialTokenId, string> = {
      [MaterialTokenId.ALUMINUM]: 'Aluminio',
      [MaterialTokenId.GLASS]: 'Vidrio',
      [MaterialTokenId.SILICON]: 'Silicio',
      [MaterialTokenId.COPPER]: 'Cobre',
    };
    return mapping[tokenId] || 'Desconocido';
  }
}
```

---

## Paso 3: Actualizar BlockchainModule

Modificar `src/blockchain/blockchain.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { MaterialsBlockchainService } from './materials-blockchain.service';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService, MaterialsBlockchainService],
  exports: [BlockchainService, MaterialsBlockchainService],
})
export class BlockchainModule {}
```

---

## Paso 4: Actualizar RecycleService para Mintear Tokens

Modificar `src/recycle/recycle.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';
import { MaterialsBlockchainService } from '../blockchain/materials-blockchain.service';
import { ProcessRecycleDto, RecycleResponseDto, MaterialStockDto } from './dto/recycle.dto';
import { AssetStatus, MaterialType } from '@prisma/client';
import * as crypto from 'crypto';

// Porcentajes de materiales en un panel solar
const MATERIAL_PERCENTAGES = {
  ALUMINUM: 0.35,
  GLASS: 0.40,
  SILICON: 0.15,
  COPPER: 0.10,
};

// Precios por kg (en USD)
const MATERIAL_PRICES = {
  ALUMINUM: 2.80,
  GLASS: 0.45,
  SILICON: 15.00,
  COPPER: 8.50,
};

// Nombres de materiales
const MATERIAL_NAMES = {
  ALUMINUM: 'Aluminio Reciclado',
  GLASS: 'Vidrio Solar Premium',
  SILICON: 'Silicio Purificado',
  COPPER: 'Cobre Recuperado',
};

@Injectable()
export class RecycleService {
  private readonly logger = new Logger(RecycleService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private materialsBlockchainService: MaterialsBlockchainService,
  ) {}

  /**
   * Procesa el reciclaje de un panel
   */
  async processRecycle(dto: ProcessRecycleDto): Promise<RecycleResponseDto> {
    const { assetId, operatorId, panelWeightKg = 20.0 } = dto;

    // 1. Verificar que el asset existe y tiene estado correcto
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { inspection: true },
    });

    if (!asset) {
      throw new NotFoundException('Asset no encontrado');
    }

    // Verificar estado
    const validStatuses = [AssetStatus.RECYCLED, AssetStatus.INSPECTED];
    if (!validStatuses.includes(asset.status)) {
      if (asset.inspection?.aiRecommendation !== 'RECYCLE') {
        throw new BadRequestException(
          `El panel no está aprobado para reciclaje. Estado actual: ${asset.status}`
        );
      }
    }

    // Verificar que no haya sido reciclado antes
    const existingRecord = await this.prisma.recycleRecord.findUnique({
      where: { assetId },
    });

    if (existingRecord) {
      throw new BadRequestException('Este panel ya fue reciclado');
    }

    // 2. Calcular materiales
    const materials = {
      aluminum: panelWeightKg * MATERIAL_PERCENTAGES.ALUMINUM,
      glass: panelWeightKg * MATERIAL_PERCENTAGES.GLASS,
      silicon: panelWeightKg * MATERIAL_PERCENTAGES.SILICON,
      copper: panelWeightKg * MATERIAL_PERCENTAGES.COPPER,
    };

    // 3. Crear hash para blockchain
    const recycleData = {
      assetId,
      operatorId,
      panelWeightKg,
      materials,
      timestamp: new Date().toISOString(),
    };
    const ipfsHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(recycleData))
      .digest('hex');

    // 4. Transacción en base de datos
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear registro de reciclaje
      const recycleRecord = await prisma.recycleRecord.create({
        data: {
          assetId,
          operatorId,
          panelWeightKg,
          aluminumKg: materials.aluminum,
          glassKg: materials.glass,
          siliconKg: materials.silicon,
          copperKg: materials.copper,
          ipfsHash,
        },
      });

      // Actualizar estado del asset
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.RECYCLED },
      });

      // Actualizar stock de materiales en BD
      await Promise.all([
        this.upsertMaterialStock(prisma, MaterialType.ALUMINUM, materials.aluminum),
        this.upsertMaterialStock(prisma, MaterialType.GLASS, materials.glass),
        this.upsertMaterialStock(prisma, MaterialType.SILICON, materials.silicon),
        this.upsertMaterialStock(prisma, MaterialType.COPPER, materials.copper),
      ]);

      return { recycleRecord };
    });

    // 5. Actualizar blockchain - Panel status
    let blockchainTxHash: string | null = null;
    try {
      const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
      blockchainTxHash = await this.blockchainService.updatePanelStatus(
        qrCode,
        PanelStatus.RECYCLED,
        'Recycling Facility',
        ipfsHash,
      );
    } catch (error) {
      this.logger.error('Error updating panel status on blockchain', error);
    }

    // 6. Mintear tokens de materiales en blockchain
    let materialsTxHash: string | null = null;
    let mintedTokens = { aluminum: 0, glass: 0, silicon: 0, copper: 0 };
    
    try {
      if (this.materialsBlockchainService.isConnected()) {
        const mintResult = await this.materialsBlockchainService.mintFromRecycle(
          materials.aluminum,
          materials.glass,
          materials.silicon,
          materials.copper,
          result.recycleRecord.id,
        );
        
        materialsTxHash = mintResult.txHash;
        mintedTokens = {
          aluminum: mintResult.aluminumTokens,
          glass: mintResult.glassTokens,
          silicon: mintResult.siliconTokens,
          copper: mintResult.copperTokens,
        };

        this.logger.log(`Material tokens minted: ${JSON.stringify(mintedTokens)}`);
      }
    } catch (error) {
      this.logger.error('Error minting material tokens', error);
    }

    // 7. Actualizar registro con hashes de blockchain
    await this.prisma.recycleRecord.update({
      where: { id: result.recycleRecord.id },
      data: { 
        blockchainTxHash,
        materialsTxHash,
      },
    });

    // 8. Obtener stock actualizado
    const updatedStock = await this.getMaterialStock();

    return {
      success: true,
      message: 'Panel reciclado exitosamente. Materiales separados y tokens minteados.',
      recycleRecord: {
        id: result.recycleRecord.id,
        assetId,
        panelWeightKg,
        materials,
        blockchainTxHash,
        materialsTxHash,
        mintedTokens,
      },
      updatedStock: {
        aluminum: updatedStock.find(s => s.type === 'ALUMINUM')?.availableKg || 0,
        glass: updatedStock.find(s => s.type === 'GLASS')?.availableKg || 0,
        silicon: updatedStock.find(s => s.type === 'SILICON')?.availableKg || 0,
        copper: updatedStock.find(s => s.type === 'COPPER')?.availableKg || 0,
      },
    };
  }

  /**
   * Actualiza o crea el stock de un material
   */
  private async upsertMaterialStock(
    prisma: any,
    type: MaterialType,
    addKg: number,
  ) {
    const existing = await prisma.materialStock.findUnique({
      where: { type },
    });

    if (existing) {
      return prisma.materialStock.update({
        where: { type },
        data: {
          totalKg: { increment: addKg },
          availableKg: { increment: addKg },
        },
      });
    } else {
      return prisma.materialStock.create({
        data: {
          type,
          name: MATERIAL_NAMES[type],
          totalKg: addKg,
          availableKg: addKg,
          pricePerKg: MATERIAL_PRICES[type],
        },
      });
    }
  }

  /**
   * Obtiene el stock actual de materiales
   */
  async getMaterialStock(): Promise<MaterialStockDto[]> {
    const stocks = await this.prisma.materialStock.findMany({
      orderBy: { type: 'asc' },
    });

    if (stocks.length === 0) {
      return Object.entries(MATERIAL_NAMES).map(([type, name]) => ({
        type,
        name,
        totalKg: 0,
        availableKg: 0,
        pricePerKg: MATERIAL_PRICES[type as keyof typeof MATERIAL_PRICES],
      }));
    }

    return stocks.map(s => ({
      type: s.type,
      name: s.name,
      totalKg: s.totalKg,
      availableKg: s.availableKg,
      pricePerKg: s.pricePerKg,
    }));
  }

  /**
   * Obtiene balances de tokens desde blockchain
   */
  async getTokenBalances() {
    if (!this.materialsBlockchainService.isConnected()) {
      return null;
    }

    const [treasury, totalSupply] = await Promise.all([
      this.materialsBlockchainService.getTreasuryBalances(),
      this.materialsBlockchainService.getTotalSupplies(),
    ]);

    return {
      treasury,
      totalSupply,
    };
  }

  // ... resto de métodos existentes (findAssetForRecycle, getRecycleHistory, etc.)
}
```

---

## Paso 5: Actualizar DTOs de Reciclaje

Modificar `src/recycle/dto/recycle.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProcessRecycleDto {
  @ApiProperty({ description: 'ID del asset a reciclar' })
  @IsString()
  assetId: string;

  @ApiProperty({ description: 'ID del operador que procesa' })
  @IsString()
  operatorId: string;

  @ApiPropertyOptional({ description: 'Peso del panel en kg (default: 20)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  panelWeightKg?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecycleResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  recycleRecord: {
    id: string;
    assetId: string;
    panelWeightKg: number;
    materials: {
      aluminum: number;
      glass: number;
      silicon: number;
      copper: number;
    };
    blockchainTxHash: string | null;
    materialsTxHash: string | null;
    mintedTokens: {
      aluminum: number;
      glass: number;
      silicon: number;
      copper: number;
    };
  };

  @ApiProperty()
  updatedStock: {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
  };
}

export class MaterialStockDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalKg: number;

  @ApiProperty()
  availableKg: number;

  @ApiProperty()
  pricePerKg: number;
}

export class TokenBalancesDto {
  @ApiProperty()
  treasury: {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
  };

  @ApiProperty()
  totalSupply: {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
  };
}
```

---

## Paso 6: Actualizar Schema de Prisma

Agregar campo `materialsTxHash` a `RecycleRecord`:

```prisma
model RecycleRecord {
  id              String   @id @default(uuid())
  assetId         String   @unique
  asset           Asset    @relation(fields: [assetId], references: [id])
  operatorId      String
  operator        User     @relation("RecycleOperator", fields: [operatorId], references: [id])
  
  panelWeightKg   Float    @default(20.0)
  
  aluminumKg      Float
  glassKg         Float
  siliconKg       Float
  copperKg        Float
  
  blockchainTxHash String?  // Tx del cambio de estado del panel
  materialsTxHash  String?  // Tx del minteo de tokens de materiales
  ipfsHash         String?
  
  createdAt       DateTime @default(now())
}
```

Ejecutar migración:
```bash
npx prisma migrate dev --name add_materials_tx_hash
```

---

## Paso 7: Agregar Endpoint de Token Balances

Agregar en `src/recycle/recycle.controller.ts`:

```typescript
@Get('tokens')
@ApiOperation({ summary: 'Obtener balances de tokens de materiales desde blockchain' })
@ApiResponse({ status: 200, type: TokenBalancesDto })
async getTokenBalances() {
  const balances = await this.recycleService.getTokenBalances();
  if (!balances) {
    return {
      message: 'Materials contract not connected',
      treasury: null,
      totalSupply: null,
    };
  }
  return balances;
}
```

---

## Verificación

### Probar el flujo completo

```bash
# 1. Procesar reciclaje (ahora mintea tokens)
curl -X POST http://localhost:4000/recycle/process \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset-uuid-here",
    "operatorId": "operator-uuid-here",
    "panelWeightKg": 20
  }'

# Respuesta esperada:
{
  "success": true,
  "message": "Panel reciclado exitosamente. Materiales separados y tokens minteados.",
  "recycleRecord": {
    "id": "uuid",
    "assetId": "asset-uuid",
    "panelWeightKg": 20,
    "materials": {
      "aluminum": 7.0,
      "glass": 8.0,
      "silicon": 3.0,
      "copper": 2.0
    },
    "blockchainTxHash": "0x...",
    "materialsTxHash": "0x...",
    "mintedTokens": {
      "aluminum": 70,
      "glass": 80,
      "silicon": 30,
      "copper": 20
    }
  },
  ...
}

# 2. Ver balances de tokens
curl http://localhost:4000/recycle/tokens

# Respuesta:
{
  "treasury": {
    "aluminum": 7.0,
    "glass": 8.0,
    "silicon": 3.0,
    "copper": 2.0
  },
  "totalSupply": {
    "aluminum": 7.0,
    "glass": 8.0,
    "silicon": 3.0,
    "copper": 2.0
  }
}
```

---

## Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/blockchain/abi/RafiquiMaterials.json` | ABI del contrato ERC-1155 |
| `src/blockchain/materials-blockchain.service.ts` | Servicio para interactuar con contrato |
| `src/blockchain/blockchain.module.ts` | Módulo actualizado |
| `src/recycle/recycle.service.ts` | Servicio actualizado con minteo |
| `src/recycle/dto/recycle.dto.ts` | DTOs actualizados |
| `prisma/schema.prisma` | Campo materialsTxHash agregado |

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESO DE RECICLAJE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. POST /recycle/process                                   │
│                     ↓                                       │
│  2. Calcular materiales (kg)                                │
│     Al: 7kg, Gl: 8kg, Si: 3kg, Cu: 2kg                     │
│                     ↓                                       │
│  3. Guardar en BD:                                          │
│     - RecycleRecord                                         │
│     - MaterialStock (actualizar)                            │
│     - Asset → RECYCLED                                      │
│                     ↓                                       │
│  4. Blockchain - Panel:                                     │
│     updatePanelStatus(RECYCLED)                             │
│     → blockchainTxHash                                      │
│                     ↓                                       │
│  5. Blockchain - Tokens:                                    │
│     mintFromRecycle(7, 8, 3, 2)                             │
│     → 70 rALU, 80 rGLS, 30 rSIL, 20 rCOP                   │
│     → materialsTxHash                                       │
│                     ↓                                       │
│  6. Tokens en Treasury Wallet                               │
│     Listos para vender                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
