---
description: Módulo de Arte/NFT para la API
---

# Crear Módulo de Arte y NFTs

Este workflow agrega el modelo ArtPiece y endpoints para la galería de arte.

## Contexto

Las obras de arte provienen de paneles solares marcados como "candidatos a arte" durante la inspección. Cada pieza tiene un artista, descripción, precio y categoría (NFT, escultura, instalación).

## Pasos

### 1. Actualizar schema de Prisma

Modificar `prisma/schema.prisma` agregando:

```prisma
// Agregar nuevo enum para categoría de arte
enum ArtCategory {
  NFT
  SCULPTURE
  INSTALLATION
}

// Agregar nuevo modelo ArtPiece
model ArtPiece {
  id          String      @id @default(uuid())
  title       String
  artist      String
  description String
  price       Float
  currency    String      @default("USD") // USD o ETH para NFTs
  category    ArtCategory
  imageUrl    String?
  isAvailable Boolean     @default(true)
  
  // Relación opcional con el Asset de origen
  sourceAssetId String?   @unique
  sourceAsset   Asset?    @relation(fields: [sourceAssetId], references: [id])
  
  // Metadata para NFT
  tokenId     String?     @unique
  contractAddress String?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

// Actualizar modelo Asset para agregar relación con ArtPiece
// Agregar al final del modelo Asset:
//   artPiece    ArtPiece?
```

### 2. Actualizar modelo Asset

En el modelo `Asset` existente, agregar la relación:

```prisma
model Asset {
  // ... campos existentes ...
  
  // Agregar esta línea al final
  artPiece    ArtPiece?
}
```

### 3. Ejecutar migración

```bash
npx prisma migrate dev --name add_art_piece
npx prisma generate
```

### 4. Crear módulo de arte

```bash
nest g module art
nest g service art
nest g controller art
```

### 5. Crear DTOs

Crear `src/art/dto/art.dto.ts`:

```typescript
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum ArtCategory {
  NFT = 'NFT',
  SCULPTURE = 'SCULPTURE',
  INSTALLATION = 'INSTALLATION',
}

export class CreateArtPieceDto {
  @IsString()
  title: string;

  @IsString()
  artist: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(ArtCategory)
  category: ArtCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  sourceAssetId?: string;
}

export class UpdateArtPieceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  tokenId?: string;

  @IsOptional()
  @IsString()
  contractAddress?: string;
}

export class ArtPieceResponseDto {
  id: string;
  title: string;
  artist: string;
  description: string;
  price: number;
  currency: string;
  category: ArtCategory;
  imageUrl: string | null;
  isAvailable: boolean;
  tokenId: string | null;
  sourceAssetId: string | null;
  createdAt: Date;
}
```

### 6. Implementar servicio de arte

Crear `src/art/art.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtPieceDto, UpdateArtPieceDto, ArtPieceResponseDto, ArtCategory } from './dto/art.dto';

@Injectable()
export class ArtService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateArtPieceDto): Promise<ArtPieceResponseDto> {
    const artPiece = await this.prisma.artPiece.create({
      data: {
        title: dto.title,
        artist: dto.artist,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || (dto.category === 'NFT' ? 'ETH' : 'USD'),
        category: dto.category,
        imageUrl: dto.imageUrl,
        sourceAssetId: dto.sourceAssetId,
      },
    });

    return this.toResponseDto(artPiece);
  }

  async findAll(category?: ArtCategory): Promise<ArtPieceResponseDto[]> {
    const where = category ? { category } : {};
    
    const artPieces = await this.prisma.artPiece.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return artPieces.map(this.toResponseDto);
  }

  async findAvailable(category?: ArtCategory): Promise<ArtPieceResponseDto[]> {
    const where: any = { isAvailable: true };
    if (category) {
      where.category = category;
    }

    const artPieces = await this.prisma.artPiece.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return artPieces.map(this.toResponseDto);
  }

  async findOne(id: string): Promise<ArtPieceResponseDto> {
    const artPiece = await this.prisma.artPiece.findUnique({
      where: { id },
    });

    if (!artPiece) {
      throw new NotFoundException(`Art piece with ID ${id} not found`);
    }

    return this.toResponseDto(artPiece);
  }

  async update(id: string, dto: UpdateArtPieceDto): Promise<ArtPieceResponseDto> {
    const artPiece = await this.prisma.artPiece.update({
      where: { id },
      data: dto,
    });

    return this.toResponseDto(artPiece);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.artPiece.delete({
      where: { id },
    });
  }

  // Crear arte desde un Asset marcado como candidato
  async createFromAsset(assetId: string, dto: Omit<CreateArtPieceDto, 'sourceAssetId'>): Promise<ArtPieceResponseDto> {
    // Verificar que el asset existe
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    return this.create({
      ...dto,
      sourceAssetId: assetId,
    });
  }

  // Estadísticas de arte
  async getStats() {
    const [total, available, byCategory] = await Promise.all([
      this.prisma.artPiece.count(),
      this.prisma.artPiece.count({ where: { isAvailable: true } }),
      this.prisma.artPiece.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      available,
      sold: total - available,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private toResponseDto(artPiece: any): ArtPieceResponseDto {
    return {
      id: artPiece.id,
      title: artPiece.title,
      artist: artPiece.artist,
      description: artPiece.description,
      price: artPiece.price,
      currency: artPiece.currency,
      category: artPiece.category,
      imageUrl: artPiece.imageUrl,
      isAvailable: artPiece.isAvailable,
      tokenId: artPiece.tokenId,
      sourceAssetId: artPiece.sourceAssetId,
      createdAt: artPiece.createdAt,
    };
  }
}
```

### 7. Implementar controlador

Crear `src/art/art.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ArtService } from './art.service';
import { CreateArtPieceDto, UpdateArtPieceDto, ArtCategory } from './dto/art.dto';

@Controller('art')
export class ArtController {
  constructor(private readonly artService: ArtService) {}

  @Post()
  create(@Body() dto: CreateArtPieceDto) {
    return this.artService.create(dto);
  }

  @Get()
  findAll(@Query('category') category?: ArtCategory) {
    return this.artService.findAll(category);
  }

  @Get('available')
  findAvailable(@Query('category') category?: ArtCategory) {
    return this.artService.findAvailable(category);
  }

  @Get('stats')
  getStats() {
    return this.artService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArtPieceDto) {
    return this.artService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.artService.remove(id);
  }

  @Post('from-asset/:assetId')
  createFromAsset(
    @Param('assetId') assetId: string,
    @Body() dto: Omit<CreateArtPieceDto, 'sourceAssetId'>,
  ) {
    return this.artService.createFromAsset(assetId, dto);
  }
}
```

### 8. Registrar módulo

Actualizar `src/art/art.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ArtService } from './art.service';
import { ArtController } from './art.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
```

### 9. Importar en AppModule

Actualizar `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CollectionRequestsModule } from './collection-requests/collection-requests.module';
import { AssetsModule } from './assets/assets.module';
import { InspectionsModule } from './inspections/inspections.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ArtModule } from './art/art.module';

@Module({
  imports: [
    PrismaModule,
    CollectionRequestsModule,
    AssetsModule,
    InspectionsModule,
    StatisticsModule,
    ArtModule,
  ],
})
export class AppModule {}
```

### 10. Agregar endpoint en Statistics para marketplace

Actualizar `src/statistics/statistics.service.ts` agregando:

```typescript
// Agregar import
import { ArtService } from '../art/art.service';

// En el constructor
constructor(
  private prisma: PrismaService,
  private artService: ArtService, // Agregar
) {}

// Agregar método
async getMarketArt() {
  return this.artService.findAvailable();
}
```

Actualizar `src/statistics/statistics.controller.ts` agregando:

```typescript
@Get('market/art')
async getMarketArt() {
  return this.statisticsService.getMarketArt();
}
```

Actualizar `src/statistics/statistics.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ArtModule } from '../art/art.module';

@Module({
  imports: [PrismaModule, ArtModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
```

// turbo
### 11. Verificar endpoints

```bash
npm run start:dev

# Probar endpoints
curl http://localhost:4000/art
curl http://localhost:4000/art/available
curl http://localhost:4000/art/stats
curl http://localhost:4000/statistics/market/art
```

## Endpoints Creados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/art` | Crear nueva obra de arte |
| GET | `/art` | Listar todas las obras |
| GET | `/art/available` | Listar obras disponibles |
| GET | `/art/stats` | Estadísticas de arte |
| GET | `/art/:id` | Obtener obra por ID |
| PUT | `/art/:id` | Actualizar obra |
| DELETE | `/art/:id` | Eliminar obra |
| POST | `/art/from-asset/:assetId` | Crear arte desde un Asset |
| GET | `/statistics/market/art` | Obras disponibles para marketplace |

## Verificación Final

- [ ] Schema de Prisma actualizado con ArtPiece
- [ ] Migración ejecutada
- [ ] Módulo de arte creado
- [ ] Servicio con CRUD completo
- [ ] Controlador con todos los endpoints
- [ ] Endpoint en statistics para marketplace
- [ ] Endpoints responden correctamente

## Siguiente Paso

Ejecuta el workflow `step-7-plan-filters` del frontend para conectar la galería con este endpoint.
