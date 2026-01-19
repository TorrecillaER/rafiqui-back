---
description: Crear módulo de metadata en backend NestJS para NFTs
---

# Step 21: Módulo de Metadata para NFTs en Backend NestJS

Este workflow crea el módulo de metadata que servirá los JSON de metadata para los NFTs, permitiendo que las wallets y marketplaces muestren la información correcta.

## Prerrequisitos

- Backend NestJS funcionando
- Prisma configurado con modelos ArtPiece y Asset
- Contrato desplegado con baseURI apuntando al backend

---

## Paso 1: Crear el DTO de metadata

Crear archivo `src/metadata/dto/metadata.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NFTAttribute {
  @ApiProperty({ description: 'Tipo de atributo (trait_type)' })
  trait_type: string;

  @ApiProperty({ description: 'Valor del atributo' })
  value: string | number;

  @ApiPropertyOptional({ description: 'Tipo de display (number, date, etc.)' })
  display_type?: string;
}

export class NFTMetadataDto {
  @ApiProperty({ description: 'Nombre del NFT' })
  name: string;

  @ApiProperty({ description: 'Descripción del NFT' })
  description: string;

  @ApiProperty({ description: 'URL de la imagen del NFT' })
  image: string;

  @ApiPropertyOptional({ description: 'URL externa del NFT' })
  external_url?: string;

  @ApiPropertyOptional({ description: 'Color de fondo (hex sin #)' })
  background_color?: string;

  @ApiPropertyOptional({ description: 'URL de animación (video, audio, etc.)' })
  animation_url?: string;

  @ApiProperty({ description: 'Atributos del NFT', type: [NFTAttribute] })
  attributes: NFTAttribute[];
}
```

---

## Paso 2: Crear el servicio de metadata

Crear archivo `src/metadata/metadata.service.ts`:

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NFTMetadataDto, NFTAttribute } from './dto/metadata.dto';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene metadata de una obra de arte por tokenId
   */
  async getArtMetadata(tokenId: string): Promise<NFTMetadataDto> {
    this.logger.log(`Fetching art metadata for tokenId: ${tokenId}`);

    const artPiece = await this.prisma.artPiece.findFirst({
      where: { tokenId },
      include: {
        sourceAsset: {
          select: {
            brand: true,
            model: true,
            qrCode: true,
            collectedAt: true,
          },
        },
      },
    });

    if (!artPiece) {
      this.logger.warn(`Art piece not found for tokenId: ${tokenId}`);
      throw new NotFoundException(`Art piece with tokenId ${tokenId} not found`);
    }

    const attributes: NFTAttribute[] = [
      { trait_type: 'Artist', value: artPiece.artist },
      { trait_type: 'Category', value: artPiece.category },
      { trait_type: 'Currency', value: artPiece.currency },
      { trait_type: 'Price', value: artPiece.price },
    ];

    // Agregar atributos del panel origen si existe
    if (artPiece.sourceAsset) {
      attributes.push(
        { trait_type: 'Panel Brand', value: artPiece.sourceAsset.brand || 'Unknown' },
        { trait_type: 'Panel Model', value: artPiece.sourceAsset.model || 'Unknown' },
        { trait_type: 'Panel QR Code', value: artPiece.sourceAsset.qrCode || 'N/A' },
      );

      if (artPiece.sourceAsset.collectedAt) {
        attributes.push({
          trait_type: 'Panel Collected',
          value: Math.floor(artPiece.sourceAsset.collectedAt.getTime() / 1000),
          display_type: 'date',
        });
      }
    }

    // Agregar fecha de creación
    attributes.push({
      trait_type: 'Created',
      value: Math.floor(artPiece.createdAt.getTime() / 1000),
      display_type: 'date',
    });

    const metadata: NFTMetadataDto = {
      name: artPiece.title,
      description: artPiece.description || `${artPiece.title} by ${artPiece.artist}. A unique piece of art created from recycled solar panels.`,
      image: artPiece.imageUrl || 'https://rafiqui.com/images/default-art.png',
      external_url: `https://rafiqui.com/gallery/${artPiece.id}`,
      background_color: '102038', // Oxford Blue sin #
      attributes,
    };

    this.logger.log(`Art metadata generated for tokenId: ${tokenId}`);
    return metadata;
  }

  /**
   * Obtiene metadata de un panel por tokenId
   */
  async getPanelMetadata(tokenId: string): Promise<NFTMetadataDto> {
    this.logger.log(`Fetching panel metadata for tokenId: ${tokenId}`);

    // Para paneles, el tokenId podría ser el qrCode
    const asset = await this.prisma.asset.findFirst({
      where: {
        OR: [
          { tokenId },
          { qrCode: tokenId },
        ],
      },
      include: {
        inspection: {
          select: {
            measuredVoltage: true,
            measuredAmps: true,
            physicalCondition: true,
            aiRecommendation: true,
          },
        },
      },
    });

    if (!asset) {
      this.logger.warn(`Panel not found for tokenId: ${tokenId}`);
      throw new NotFoundException(`Panel with tokenId ${tokenId} not found`);
    }

    const attributes: NFTAttribute[] = [
      { trait_type: 'Brand', value: asset.brand || 'Unknown' },
      { trait_type: 'Model', value: asset.model || 'Unknown' },
      { trait_type: 'Status', value: asset.status },
    ];

    // Agregar datos técnicos si existen
    if (asset.measuredPowerWatts) {
      attributes.push({ trait_type: 'Power (W)', value: asset.measuredPowerWatts });
    }
    if (asset.measuredVoltage) {
      attributes.push({ trait_type: 'Voltage (V)', value: asset.measuredVoltage });
    }
    if (asset.healthPercentage) {
      attributes.push({ trait_type: 'Health (%)', value: asset.healthPercentage });
    }
    if (asset.capacityRetainedPercent) {
      attributes.push({ trait_type: 'Capacity Retained (%)', value: asset.capacityRetainedPercent });
    }

    // Agregar datos de inspección si existen
    if (asset.inspection) {
      attributes.push(
        { trait_type: 'Inspection Result', value: asset.inspection.aiRecommendation },
        { trait_type: 'Physical Condition', value: asset.inspection.physicalCondition },
      );
    }

    // Agregar fechas
    if (asset.collectedAt) {
      attributes.push({
        trait_type: 'Collected',
        value: Math.floor(asset.collectedAt.getTime() / 1000),
        display_type: 'date',
      });
    }
    if (asset.refurbishedAt) {
      attributes.push({
        trait_type: 'Refurbished',
        value: Math.floor(asset.refurbishedAt.getTime() / 1000),
        display_type: 'date',
      });
    }

    const metadata: NFTMetadataDto = {
      name: `Rafiqui Panel - ${asset.brand || 'Solar'} ${asset.model || 'Panel'}`,
      description: `A refurbished solar panel from Rafiqui's circular economy program. Brand: ${asset.brand || 'Unknown'}, Model: ${asset.model || 'Unknown'}. This panel has been professionally inspected and refurbished for reuse.`,
      image: 'https://rafiqui.com/images/default-panel.png',
      external_url: `https://rafiqui.com/marketplace/panels/${asset.id}`,
      background_color: '93E1D8', // Tiffany Blue sin #
      attributes,
    };

    this.logger.log(`Panel metadata generated for tokenId: ${tokenId}`);
    return metadata;
  }
}
```

---

## Paso 3: Crear el controlador de metadata

Crear archivo `src/metadata/metadata.controller.ts`:

```typescript
import { Controller, Get, Param, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MetadataService } from './metadata.service';
import { NFTMetadataDto } from './dto/metadata.dto';

@ApiTags('NFT Metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('art/:tokenId')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600') // Cache por 1 hora
  @ApiOperation({ 
    summary: 'Obtener metadata de obra de arte',
    description: 'Retorna el JSON de metadata en formato ERC-721/OpenSea para una obra de arte'
  })
  @ApiParam({ name: 'tokenId', description: 'Token ID del NFT de arte' })
  @ApiResponse({ status: 200, description: 'Metadata del NFT', type: NFTMetadataDto })
  @ApiResponse({ status: 404, description: 'NFT no encontrado' })
  async getArtMetadata(@Param('tokenId') tokenId: string): Promise<NFTMetadataDto> {
    return this.metadataService.getArtMetadata(tokenId);
  }

  @Get('panel/:tokenId')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ 
    summary: 'Obtener metadata de panel',
    description: 'Retorna el JSON de metadata en formato ERC-721/OpenSea para un panel reacondicionado'
  })
  @ApiParam({ name: 'tokenId', description: 'Token ID o QR Code del panel' })
  @ApiResponse({ status: 200, description: 'Metadata del NFT', type: NFTMetadataDto })
  @ApiResponse({ status: 404, description: 'Panel no encontrado' })
  async getPanelMetadata(@Param('tokenId') tokenId: string): Promise<NFTMetadataDto> {
    return this.metadataService.getPanelMetadata(tokenId);
  }
}
```

---

## Paso 4: Crear el módulo de metadata

Crear archivo `src/metadata/metadata.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
```

---

## Paso 5: Registrar el módulo en AppModule

Modificar `src/app.module.ts` para importar el MetadataModule:

```typescript
// Agregar import
import { MetadataModule } from './metadata/metadata.module';

@Module({
  imports: [
    // ... otros módulos existentes
    MetadataModule,
  ],
  // ...
})
export class AppModule {}
```

---

## Paso 6: Configurar CORS (si no está configurado)

En `src/main.ts`, asegurar que CORS está habilitado:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para permitir peticiones desde wallets/marketplaces
  app.enableCors({
    origin: '*', // En producción, especificar dominios permitidos
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });
  
  // ... resto de la configuración
  
  await app.listen(3000);
}
bootstrap();
```

---

## Paso 7: Crear archivo index para exportaciones

Crear archivo `src/metadata/index.ts`:

```typescript
export * from './metadata.module';
export * from './metadata.service';
export * from './metadata.controller';
export * from './dto/metadata.dto';
```

---

## Estructura final de archivos

```
src/
├── metadata/
│   ├── dto/
│   │   └── metadata.dto.ts
│   ├── metadata.controller.ts
│   ├── metadata.service.ts
│   ├── metadata.module.ts
│   └── index.ts
```

---

## Endpoints creados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/metadata/art/:tokenId` | Metadata JSON de obra de arte |
| GET | `/metadata/panel/:tokenId` | Metadata JSON de panel |

---

## Ejemplo de respuesta JSON

```json
{
  "name": "Solar Dreams #1",
  "description": "A unique piece of art created from recycled solar panels.",
  "image": "https://cloudinary.com/rafiqui/art/solar-dreams.jpg",
  "external_url": "https://rafiqui.com/gallery/abc123",
  "background_color": "102038",
  "attributes": [
    { "trait_type": "Artist", "value": "María García" },
    { "trait_type": "Category", "value": "SCULPTURE" },
    { "trait_type": "Panel Brand", "value": "SunPower" },
    { "trait_type": "Panel Model", "value": "SPR-X22-360" },
    { "trait_type": "Created", "value": 1705276800, "display_type": "date" }
  ]
}
```

---

## Notas importantes

1. **URL pública** - El backend debe ser accesible desde Internet (no localhost)
2. **HTTPS** - Se recomienda usar HTTPS para producción
3. **Imágenes** - Las URLs de imágenes deben ser accesibles públicamente
4. **Cache** - Se configura cache de 1 hora para reducir carga
5. **Formato OpenSea** - El JSON sigue el estándar de OpenSea para máxima compatibilidad
