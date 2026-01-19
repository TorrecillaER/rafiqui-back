---
description: Implementar compra de obras de arte con transferencia de NFT ERC-721 al comprador
---

# Step 20: Compra de Obras de Arte con Transferencia de NFT (Backend)

## Descripción
Este workflow implementa el backend para la compra de obras de arte con transferencia del token ERC-721.

## Prerequisitos
- Contrato RafiquiTracker desplegado y configurado en .env
- Obras de arte con status PUBLISHED y tokenId asignado
- Backend con BlockchainService funcionando

## Pasos de Implementación

### Paso 1: Crear DTO de Orden de Arte

Crear archivo `src/marketplace/dto/art-order.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateArtOrderDto {
  @ApiProperty({ description: 'ID de la obra de arte' })
  @IsString()
  artPieceId: string;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiProperty({ required: false, description: 'Mensaje para el artista' })
  @IsString()
  @IsOptional()
  messageToArtist?: string;
}

export class ArtOrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  order: {
    id: string;
    artPieceId: string;
    tokenId: string;
    title: string;
    artistName: string;
    price: number;
    blockchainTxHash: string | null;
  };
}
```

### Paso 2: Actualizar Schema Prisma

Agregar a `prisma/schema.prisma`:

```prisma
model ArtOrder {
  id              String       @id @default(uuid())
  artPieceId      String
  artPiece        ArtPiece     @relation(fields: [artPieceId], references: [id])
  
  buyerId         String?
  buyer           User?        @relation("ArtBuyer", fields: [buyerId], references: [id])
  
  buyerWallet     String
  price           Float
  
  messageToArtist String?
  
  status          OrderStatus  @default(PENDING)
  blockchainTxHash String?
  
  createdAt       DateTime     @default(now())
  completedAt     DateTime?
}
```

Agregar relación en ArtPiece:
```prisma
model ArtPiece {
  // ... campos existentes ...
  orders          ArtOrder[]
  soldAt          DateTime?
  buyerWallet     String?
}
```

Agregar relación en User:
```prisma
model User {
  // ... campos existentes ...
  artOrders       ArtOrder[] @relation("ArtBuyer")
}
```

### Paso 3: Ejecutar Migración

```bash
npx prisma migrate dev --name add_art_orders
```

### Paso 4: Agregar Método transferArt en BlockchainService

En `src/blockchain/blockchain.service.ts`, agregar:

```typescript
/**
 * Transfiere una obra de arte (NFT ERC-721) a un comprador
 */
async transferArt(tokenId: string, toAddress: string): Promise<string> {
  if (!this.contract || !this.wallet) {
    throw new Error('Blockchain not connected');
  }

  this.logger.log(`Transferring art tokenId ${tokenId} to ${toAddress}`);

  try {
    const tx = await this.contract.safeTransferFrom(
      this.wallet.address,  // from: treasury
      toAddress,            // to: buyer
      tokenId,              // tokenId
    );

    const receipt = await tx.wait();
    this.logger.log(`Art transferred successfully. TxHash: ${receipt.hash}`);

    return receipt.hash;
  } catch (error) {
    this.logger.error(`Error transferring art tokenId ${tokenId}:`, error);
    throw error;
  }
}
```

### Paso 5: Crear Servicio de Marketplace de Arte

Crear archivo `src/marketplace/art-marketplace.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';
import { OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class ArtMarketplaceService {
  private readonly logger = new Logger(ArtMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async purchaseArt(dto: CreateArtOrderDto): Promise<ArtOrderResponseDto> {
    const { artPieceId, buyerWallet, buyerId, messageToArtist } = dto;

    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    const artPiece = await this.prisma.artPiece.findUnique({
      where: { id: artPieceId },
      include: { asset: true },
    });

    if (!artPiece) {
      throw new NotFoundException('Obra de arte no encontrada');
    }

    if (artPiece.status !== 'PUBLISHED') {
      throw new BadRequestException('Esta obra no está disponible para venta');
    }

    if (!artPiece.tokenId) {
      throw new BadRequestException('Esta obra no tiene token en blockchain');
    }

    const order = await this.prisma.artOrder.create({
      data: {
        artPieceId,
        buyerId: buyerId || null,
        buyerWallet,
        price: artPiece.price,
        messageToArtist,
        status: OrderStatus.PROCESSING,
      },
    });

    let txHash: string | null = null;

    try {
      txHash = await this.blockchainService.transferArt(
        artPiece.tokenId,
        buyerWallet,
      );

      await this.prisma.artPiece.update({
        where: { id: artPieceId },
        data: {
          status: 'SOLD',
          soldAt: new Date(),
          buyerWallet,
        },
      });

      await this.prisma.artOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          blockchainTxHash: txHash,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Art piece ${artPieceId} sold to ${buyerWallet}. TxHash: ${txHash}`);

    } catch (error) {
      this.logger.error(`Error transferring art ${artPieceId}:`, error);
      
      await this.prisma.artOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      throw new BadRequestException('Error al transferir la obra en blockchain');
    }

    return {
      success: true,
      message: 'Obra de arte comprada exitosamente. NFT transferido a tu wallet.',
      order: {
        id: order.id,
        artPieceId,
        tokenId: artPiece.tokenId,
        title: artPiece.title,
        artistName: artPiece.artistName,
        price: artPiece.price,
        blockchainTxHash: txHash,
      },
    };
  }

  async getAvailableArt() {
    return this.prisma.artPiece.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        asset: {
          select: {
            brand: true,
            model: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtDetails(artPieceId: string) {
    return this.prisma.artPiece.findUnique({
      where: { id: artPieceId },
      include: { asset: true },
    });
  }
}
```

### Paso 6: Crear Controlador

Crear archivo `src/marketplace/art-marketplace.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArtMarketplaceService } from './art-marketplace.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';

@ApiTags('Art Marketplace')
@Controller('marketplace/art')
export class ArtMarketplaceController {
  constructor(private artMarketplace: ArtMarketplaceService) {}

  @Get('available')
  @ApiOperation({ summary: 'Obtener obras de arte disponibles para venta' })
  async getAvailableArt() {
    return this.artMarketplace.getAvailableArt();
  }

  @Get(':artPieceId')
  @ApiOperation({ summary: 'Obtener detalles de una obra de arte' })
  async getArtDetails(@Param('artPieceId') artPieceId: string) {
    return this.artMarketplace.getArtDetails(artPieceId);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comprar una obra de arte' })
  @ApiResponse({ status: 201, type: ArtOrderResponseDto })
  async purchaseArt(@Body() dto: CreateArtOrderDto): Promise<ArtOrderResponseDto> {
    return this.artMarketplace.purchaseArt(dto);
  }
}
```

### Paso 7: Registrar en Módulo

Actualizar `src/marketplace/marketplace.module.ts`:

```typescript
import { ArtMarketplaceService } from './art-marketplace.service';
import { ArtMarketplaceController } from './art-marketplace.controller';

@Module({
  imports: [BlockchainModule],
  controllers: [
    MarketplaceController,
    MaterialsMarketplaceController,
    PanelsMarketplaceController,
    ArtMarketplaceController,  // Agregar
  ],
  providers: [
    MarketplaceService,
    MaterialsMarketplaceService,
    PanelsMarketplaceService,
    ArtMarketplaceService,  // Agregar
  ],
  exports: [
    MarketplaceService, 
    MaterialsMarketplaceService, 
    PanelsMarketplaceService,
    ArtMarketplaceService,
  ],
})
export class MarketplaceModule {}
```

## Verificación

1. Reiniciar backend
2. Verificar endpoint disponible: `GET /marketplace/art/available`
3. Probar compra: `POST /marketplace/art/purchase`
4. Verificar transferencia en PolygonScan

## Endpoints Resultantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/marketplace/art/available` | Lista obras en venta |
| GET | `/marketplace/art/:id` | Detalles de obra |
| POST | `/marketplace/art/purchase` | Comprar obra |

## Notas Importantes

- El `tokenId` de las obras de arte es un String (puede ser el hash del asset)
- El precio lo define el artista al publicar la obra
- El status cambia de PUBLISHED a SOLD al completar la compra
- Se guarda la wallet del comprador y fecha de venta
