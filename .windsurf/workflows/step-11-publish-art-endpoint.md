---
description: Crear endpoint para publicar obra de arte desde panel candidato
---

# Step 11: Endpoint para Publicar Obra de Arte

Este workflow crea el endpoint de backend que permite a un artista publicar una obra de arte creada a partir de un panel con estado `ART_CANDIDATE`. Al publicar, el estado cambia a `ART_LISTED_FOR_SALE` en la base de datos y blockchain.

## Prerrequisitos

- [ ] Backend NestJS funcionando
- [ ] Módulo de Assets existente
- [ ] BlockchainService configurado
- [ ] Modelo ArtPiece en Prisma

---

## Paso 1: Agregar Estado ART_LISTED_FOR_SALE al Schema

Modificar `prisma/schema.prisma`, agregar el nuevo estado al enum:

```prisma
enum AssetStatus {
  PENDING_COLLECTION
  IN_TRANSIT
  WAREHOUSE_RECEIVED
  INSPECTING
  INSPECTED
  RECYCLED
  REUSED
  READY_FOR_REUSE
  REFURBISHING
  LISTED_FOR_SALE
  ART_CANDIDATE
  ART_LISTED_FOR_SALE  // NUEVO: Obra de arte publicada para venta
}
```

Ejecutar migración:

```bash
npx prisma db push
# o
npx prisma migrate dev --name add_art_listed_for_sale_status
```

---

## Paso 2: Agregar Estado a BlockchainService

Modificar `src/blockchain/blockchain.service.ts`, agregar al enum `PanelStatus`:

```typescript
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
  ART_LISTED = 9,  // NUEVO: Obra de arte listada para venta
}
```

---

## Paso 3: Crear DTO para Publicar Arte

Crear archivo `src/art/dto/publish-art.dto.ts`:

```typescript
import { IsString, IsNumber, IsOptional, Min, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublishArtDto {
  @ApiProperty({ description: 'ID del asset (panel) candidato a arte' })
  @IsString()
  assetId: string;

  @ApiProperty({ description: 'Nombre de la obra de arte', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Nombre del artista/autor', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  artist: string;

  @ApiProperty({ description: 'Descripción detallada de la obra', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: 'Precio en MXN', minimum: 0 })
  @IsNumber()
  @Min(0)
  priceMxn: number;

  @ApiPropertyOptional({ description: 'URL de la imagen de la obra (Cloudinary)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'ID del artista/usuario que publica' })
  @IsOptional()
  @IsString()
  artistId?: string;
}

export class PublishArtResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  artPiece?: {
    id: string;
    title: string;
    artist: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string | null;
    sourceAssetId: string;
    createdAt: Date;
  };

  @ApiPropertyOptional()
  blockchainTxHash?: string;
}
```

---

## Paso 4: Crear Módulo de Arte

Crear archivo `src/art/art.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ArtService } from './art.service';
import { ArtController } from './art.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
```

---

## Paso 5: Crear Servicio de Arte

Crear archivo `src/art/art.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';
import { PublishArtDto, PublishArtResponseDto } from './dto/publish-art.dto';
import { AssetStatus, ArtCategory } from '@prisma/client';

@Injectable()
export class ArtService {
  private readonly logger = new Logger(ArtService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Buscar asset candidato a arte por QR Code
   */
  async findArtCandidateByQrCode(qrCode: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { qrCode },
      include: {
        artPiece: true,
        inspection: true,
      },
    });

    if (!asset) {
      return { success: false, message: 'Panel no encontrado', asset: null };
    }

    if (asset.status !== AssetStatus.ART_CANDIDATE) {
      return {
        success: false,
        message: `Este panel no es candidato a arte. Estado actual: ${asset.status}`,
        asset: null,
      };
    }

    if (asset.artPiece) {
      return {
        success: false,
        message: 'Este panel ya tiene una obra de arte asociada',
        asset: null,
      };
    }

    return { success: true, message: 'Panel encontrado', asset };
  }

  /**
   * Publicar obra de arte
   * - Crea el registro ArtPiece
   * - Cambia el estado del asset a ART_LISTED_FOR_SALE
   * - Registra en blockchain
   */
  async publishArt(dto: PublishArtDto): Promise<PublishArtResponseDto> {
    const { assetId, title, artist, description, priceMxn, imageUrl, artistId } = dto;

    // Buscar el asset
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { artPiece: true },
    });

    if (!asset) {
      throw new NotFoundException('Asset no encontrado');
    }

    // Validar estado
    if (asset.status !== AssetStatus.ART_CANDIDATE) {
      throw new BadRequestException(
        `El panel no es candidato a arte. Estado actual: ${asset.status}`
      );
    }

    // Validar que no tenga ya una obra
    if (asset.artPiece) {
      throw new BadRequestException('Este panel ya tiene una obra de arte asociada');
    }

    // Convertir precio MXN a USD (aproximado, en producción usar API de tipo de cambio)
    const exchangeRate = 17.5; // MXN por USD
    const priceUsd = Math.round((priceMxn / exchangeRate) * 100) / 100;

    // Transacción: crear ArtPiece y actualizar Asset
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la obra de arte
      const artPiece = await prisma.artPiece.create({
        data: {
          title,
          artist,
          description,
          price: priceUsd,
          currency: 'USD',
          category: ArtCategory.SCULPTURE, // Por defecto, puede ser configurable
          imageUrl: imageUrl || null,
          isAvailable: true,
          sourceAssetId: assetId,
        },
      });

      // Actualizar estado del asset
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.ART_LISTED_FOR_SALE,
        },
      });

      return artPiece;
    });

    this.logger.log(`Art piece published: ${result.id} for asset ${assetId}`);

    // Registrar en blockchain (asíncrono)
    let blockchainTxHash: string | undefined;
    try {
      if (this.blockchainService.isConnected()) {
        const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
        blockchainTxHash = await this.blockchainService.updatePanelStatus(
          qrCode,
          PanelStatus.ART_LISTED,
          'Rafiqui Art Gallery',
          '' // IPFS hash opcional
        );
        this.logger.log(`Blockchain updated for art: ${qrCode}, tx: ${blockchainTxHash}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update blockchain for art ${assetId}`, error);
      // No fallar la operación si blockchain falla
    }

    return {
      success: true,
      message: 'Obra de arte publicada exitosamente. Ya está disponible en el portal web.',
      artPiece: {
        id: result.id,
        title: result.title,
        artist: result.artist,
        description: result.description,
        price: result.price,
        currency: result.currency,
        imageUrl: result.imageUrl,
        sourceAssetId: result.sourceAssetId!,
        createdAt: result.createdAt,
      },
      blockchainTxHash,
    };
  }

  /**
   * Obtener todas las obras de arte disponibles
   */
  async getAvailableArt() {
    return this.prisma.artPiece.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceAsset: {
          select: {
            id: true,
            qrCode: true,
            brand: true,
            model: true,
          },
        },
      },
    });
  }

  /**
   * Obtener obra de arte por ID
   */
  async getArtById(id: string) {
    return this.prisma.artPiece.findUnique({
      where: { id },
      include: {
        sourceAsset: {
          select: {
            id: true,
            qrCode: true,
            brand: true,
            model: true,
            inspection: true,
          },
        },
      },
    });
  }
}
```

---

## Paso 6: Crear Controlador de Arte

Crear archivo `src/art/art.controller.ts`:

```typescript
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArtService } from './art.service';
import { PublishArtDto, PublishArtResponseDto } from './dto/publish-art.dto';

@ApiTags('Art')
@Controller('art')
export class ArtController {
  constructor(private readonly artService: ArtService) {}

  @Post('publish')
  @ApiOperation({ summary: 'Publicar obra de arte desde panel candidato' })
  @ApiResponse({ status: 201, description: 'Obra publicada exitosamente', type: PublishArtResponseDto })
  @ApiResponse({ status: 400, description: 'Panel no es candidato a arte o ya tiene obra' })
  @ApiResponse({ status: 404, description: 'Panel no encontrado' })
  async publishArt(@Body() dto: PublishArtDto): Promise<PublishArtResponseDto> {
    return this.artService.publishArt(dto);
  }

  @Get('candidate/:qrCode')
  @ApiOperation({ summary: 'Buscar panel candidato a arte por QR Code' })
  @ApiResponse({ status: 200, description: 'Panel encontrado' })
  async findArtCandidate(@Param('qrCode') qrCode: string) {
    return this.artService.findArtCandidateByQrCode(qrCode);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las obras de arte disponibles' })
  async getAvailableArt() {
    return this.artService.getAvailableArt();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener obra de arte por ID' })
  async getArtById(@Param('id') id: string) {
    return this.artService.getArtById(id);
  }
}
```

---

## Paso 7: Registrar Módulo en App

Modificar `src/app.module.ts`, agregar el import:

```typescript
import { ArtModule } from './art/art.module';

@Module({
  imports: [
    // ... otros módulos
    ArtModule,
  ],
  // ...
})
export class AppModule {}
```

---

## Paso 8: Actualizar Mapeo de Estados en AssetsService

Modificar `src/assets/assets.service.ts`, agregar el nuevo estado al mapeo:

```typescript
private mapStatusToBlockchain(status: AssetStatus): PanelStatus {
  const statusMap: Record<AssetStatus, PanelStatus> = {
    [AssetStatus.PENDING_COLLECTION]: PanelStatus.COLLECTED,
    [AssetStatus.IN_TRANSIT]: PanelStatus.COLLECTED,
    [AssetStatus.WAREHOUSE_RECEIVED]: PanelStatus.WAREHOUSE_RECEIVED,
    [AssetStatus.INSPECTING]: PanelStatus.WAREHOUSE_RECEIVED,
    [AssetStatus.INSPECTED]: PanelStatus.INSPECTED,
    [AssetStatus.RECYCLED]: PanelStatus.RECYCLED,
    [AssetStatus.REUSED]: PanelStatus.SOLD,
    [AssetStatus.READY_FOR_REUSE]: PanelStatus.REUSE_APPROVED,
    [AssetStatus.REFURBISHING]: PanelStatus.REUSE_APPROVED,
    [AssetStatus.LISTED_FOR_SALE]: PanelStatus.REUSE_APPROVED,
    [AssetStatus.ART_CANDIDATE]: PanelStatus.ART_APPROVED,
    [AssetStatus.ART_LISTED_FOR_SALE]: PanelStatus.ART_LISTED,  // NUEVO
  };
  
  return statusMap[status] ?? PanelStatus.COLLECTED;
}
```

---

## Verificación

### Probar endpoint de búsqueda

```bash
curl http://localhost:4000/art/candidate/QR-123456
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Panel encontrado",
  "asset": {
    "id": "...",
    "qrCode": "QR-123456",
    "status": "ART_CANDIDATE",
    "brand": "Trina",
    "model": "TSM-DE09"
  }
}
```

### Probar endpoint de publicación

```bash
curl -X POST http://localhost:4000/art/publish \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset-id-here",
    "title": "Sol Renacido",
    "artist": "María García",
    "description": "Escultura creada a partir de un panel solar reciclado, representando el ciclo de la energía renovable.",
    "priceMxn": 15000,
    "imageUrl": "https://res.cloudinary.com/rafiqui/image/upload/art/sol-renacido.jpg"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Obra de arte publicada exitosamente. Ya está disponible en el portal web.",
  "artPiece": {
    "id": "art-piece-id",
    "title": "Sol Renacido",
    "artist": "María García",
    "description": "Escultura creada a partir de un panel solar reciclado...",
    "price": 857.14,
    "currency": "USD",
    "imageUrl": "https://res.cloudinary.com/rafiqui/image/upload/art/sol-renacido.jpg",
    "sourceAssetId": "asset-id-here",
    "createdAt": "2026-01-11T..."
  },
  "blockchainTxHash": "0x..."
}
```

### Verificar en base de datos

```sql
-- Asset debe tener status ART_LISTED_FOR_SALE
SELECT id, status FROM "Asset" WHERE id = 'asset-id-here';

-- ArtPiece debe existir
SELECT * FROM "ArtPiece" WHERE "sourceAssetId" = 'asset-id-here';
```

---

## Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Agregar `ART_LISTED_FOR_SALE` al enum |
| `src/blockchain/blockchain.service.ts` | Agregar `ART_LISTED = 9` al enum |
| `src/art/dto/publish-art.dto.ts` | DTO para publicar arte |
| `src/art/art.service.ts` | Lógica de negocio |
| `src/art/art.controller.ts` | Endpoints REST |
| `src/art/art.module.ts` | Módulo NestJS |
| `src/app.module.ts` | Registrar ArtModule |
| `src/assets/assets.service.ts` | Actualizar mapeo de estados |
