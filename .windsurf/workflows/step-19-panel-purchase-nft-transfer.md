---
description: Implementar compra de paneles reacondicionados con transferencia de NFT ERC-721 al comprador
---

# Step 19: Compra de Paneles con Transferencia de NFT (Backend)

## Descripción
Este workflow implementa el backend para la compra de paneles reacondicionados con transferencia del token ERC-721.

## Prerequisitos
- Contrato RafiquiTracker desplegado y configurado en .env
- Paneles con status LISTED_FOR_SALE y tokenId asignado
- Backend con BlockchainService funcionando

## Pasos de Implementación

### Paso 1: Crear DTO de Orden de Panel

Crear archivo `src/marketplace/dto/panel-order.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum PanelPurchaseDestination {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  RESEARCH = 'RESEARCH',
  RESALE = 'RESALE',
  OTHER = 'OTHER',
}

export class CreatePanelOrderDto {
  @ApiProperty({ description: 'ID del panel a comprar' })
  @IsString()
  assetId: string;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;

  @ApiProperty({ enum: PanelPurchaseDestination })
  @IsEnum(PanelPurchaseDestination)
  destination: PanelPurchaseDestination;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  destinationNotes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buyerId?: string;
}

export class PanelOrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  order: {
    id: string;
    assetId: string;
    tokenId: number;
    price: number;
    blockchainTxHash: string | null;
  };
}
```

### Paso 2: Actualizar Schema Prisma

Agregar a `prisma/schema.prisma`:

```prisma
enum PanelPurchaseDestination {
  RESIDENTIAL
  COMMERCIAL
  INDUSTRIAL
  RESEARCH
  RESALE
  OTHER
}

model PanelOrder {
  id              String       @id @default(uuid())
  assetId         String
  asset           Asset        @relation(fields: [assetId], references: [id])
  
  buyerId         String?
  buyer           User?        @relation("PanelBuyer", fields: [buyerId], references: [id])
  
  buyerWallet     String
  price           Float
  
  destination     PanelPurchaseDestination @default(OTHER)
  destinationNotes String?
  
  status          OrderStatus  @default(PENDING)
  blockchainTxHash String?
  
  createdAt       DateTime     @default(now())
  completedAt     DateTime?
}
```

Agregar campos a modelo Asset:
```prisma
model Asset {
  // ... campos existentes ...
  soldAt          DateTime?
  buyerWallet     String?
  panelOrders     PanelOrder[]
}
```

Agregar relación en User:
```prisma
model User {
  // ... campos existentes ...
  panelOrders     PanelOrder[] @relation("PanelBuyer")
}
```

### Paso 3: Ejecutar Migración

```bash
npx prisma migrate dev --name add_panel_orders
```

### Paso 4: Agregar Método transferPanel en BlockchainService

En `src/blockchain/blockchain.service.ts`, agregar:

```typescript
/**
 * Transfiere un panel (NFT ERC-721) a un comprador
 */
async transferPanel(tokenId: number, toAddress: string): Promise<string> {
  if (!this.contract || !this.wallet) {
    throw new Error('Blockchain not connected');
  }

  this.logger.log(`Transferring panel tokenId ${tokenId} to ${toAddress}`);

  try {
    // El treasury (wallet del backend) transfiere el NFT al comprador
    const tx = await this.contract.safeTransferFrom(
      this.wallet.address,  // from: treasury
      toAddress,            // to: buyer
      tokenId,              // tokenId
    );

    const receipt = await tx.wait();
    this.logger.log(`Panel transferred successfully. TxHash: ${receipt.hash}`);

    return receipt.hash;
  } catch (error) {
    this.logger.error(`Error transferring panel tokenId ${tokenId}:`, error);
    throw error;
  }
}
```

### Paso 5: Crear Servicio de Marketplace de Paneles

Crear archivo `src/marketplace/panels-marketplace.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreatePanelOrderDto, PanelOrderResponseDto } from './dto/panel-order.dto';
import { AssetStatus, OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class PanelsMarketplaceService {
  private readonly logger = new Logger(PanelsMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async purchasePanel(dto: CreatePanelOrderDto): Promise<PanelOrderResponseDto> {
    const { assetId, buyerWallet, destination, destinationNotes, buyerId } = dto;

    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Panel no encontrado');
    }

    if (asset.status !== AssetStatus.LISTED_FOR_SALE) {
      throw new BadRequestException('Este panel no está disponible para venta');
    }

    if (!asset.tokenId) {
      throw new BadRequestException('Este panel no tiene token en blockchain');
    }

    const price = this.calculatePanelPrice(asset);

    const order = await this.prisma.panelOrder.create({
      data: {
        assetId,
        buyerId: buyerId || null,
        buyerWallet,
        price,
        destination,
        destinationNotes,
        status: OrderStatus.PROCESSING,
      },
    });

    let txHash: string | null = null;

    try {
      txHash = await this.blockchainService.transferPanel(
        asset.tokenId,
        buyerWallet,
      );

      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.REUSED,
          soldAt: new Date(),
          buyerWallet,
        },
      });

      await this.prisma.panelOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          blockchainTxHash: txHash,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Panel ${assetId} sold to ${buyerWallet}. TxHash: ${txHash}`);

    } catch (error) {
      this.logger.error(`Error transferring panel ${assetId}:`, error);
      
      await this.prisma.panelOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      throw new BadRequestException('Error al transferir el panel en blockchain');
    }

    return {
      success: true,
      message: 'Panel comprado exitosamente. NFT transferido a tu wallet.',
      order: {
        id: order.id,
        assetId,
        tokenId: asset.tokenId,
        price,
        blockchainTxHash: txHash,
      },
    };
  }

  private calculatePanelPrice(asset: any): number {
    const basePrice = 150;
    const powerBonus = (asset.measuredPower || 0) * 0.5;
    const voltageBonus = (asset.measuredVoltage || 0) * 2;
    return Math.round(basePrice + powerBonus + voltageBonus);
  }

  async getAvailablePanels() {
    return this.prisma.asset.findMany({
      where: { status: AssetStatus.LISTED_FOR_SALE },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### Paso 6: Crear Controlador

Crear o actualizar `src/marketplace/panels-marketplace.controller.ts`:

```typescript
import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PanelsMarketplaceService } from './panels-marketplace.service';
import { CreatePanelOrderDto, PanelOrderResponseDto } from './dto/panel-order.dto';

@ApiTags('Panels Marketplace')
@Controller('marketplace/panels')
export class PanelsMarketplaceController {
  constructor(private panelsMarketplace: PanelsMarketplaceService) {}

  @Get('available')
  @ApiOperation({ summary: 'Obtener paneles disponibles para venta' })
  async getAvailablePanels() {
    return this.panelsMarketplace.getAvailablePanels();
  }

  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comprar un panel reacondicionado' })
  @ApiResponse({ status: 201, type: PanelOrderResponseDto })
  async purchasePanel(@Body() dto: CreatePanelOrderDto): Promise<PanelOrderResponseDto> {
    return this.panelsMarketplace.purchasePanel(dto);
  }
}
```

### Paso 7: Registrar en Módulo

Actualizar `src/marketplace/marketplace.module.ts`:

```typescript
import { PanelsMarketplaceService } from './panels-marketplace.service';
import { PanelsMarketplaceController } from './panels-marketplace.controller';

@Module({
  imports: [BlockchainModule],
  controllers: [
    MarketplaceController,
    MaterialsMarketplaceController,
    PanelsMarketplaceController,  // Agregar
  ],
  providers: [
    MarketplaceService,
    MaterialsMarketplaceService,
    PanelsMarketplaceService,  // Agregar
  ],
  exports: [MarketplaceService, MaterialsMarketplaceService, PanelsMarketplaceService],
})
export class MarketplaceModule {}
```

## Verificación

1. Reiniciar backend
2. Verificar endpoint disponible: `GET /marketplace/panels/available`
3. Probar compra: `POST /marketplace/panels/purchase`
4. Verificar transferencia en PolygonScan

## Endpoints Resultantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/marketplace/panels/available` | Lista paneles en venta |
| POST | `/marketplace/panels/purchase` | Comprar panel |
