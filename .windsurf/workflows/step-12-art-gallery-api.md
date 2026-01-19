---
description: Crear endpoint dedicado de galería de arte para el marketplace web
---

# Step 12: API de Galería de Arte para Marketplace Web

Este workflow crea un endpoint dedicado para la galería de arte del marketplace web, con filtros, paginación y estadísticas.

## Prerequisitos

- Módulo de Arte (`src/art/`) existente
- Obras de arte publicadas en la BD
- Imágenes en Cloudinary

---

## Paso 1: Crear DTOs para Galería Web

Crear `src/art/dto/gallery.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ArtSortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  TITLE = 'title',
}

export class GalleryFiltersDto {
  @ApiPropertyOptional({ enum: ['NFT', 'SCULPTURE', 'INSTALLATION'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Precio mínimo en USD' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Precio máximo en USD' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Buscar por título o artista' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ArtSortBy, default: ArtSortBy.NEWEST })
  @IsOptional()
  @IsEnum(ArtSortBy)
  sortBy?: ArtSortBy;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class GalleryArtPieceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  artist: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ['NFT', 'SCULPTURE', 'INSTALLATION'] })
  category: string;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty({ nullable: true })
  tokenId: string | null;

  @ApiProperty({ nullable: true })
  sourceAssetId: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class GalleryResponseDto {
  @ApiProperty({ type: [GalleryArtPieceDto] })
  artPieces: GalleryArtPieceDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  availableFilters: {
    categories: string[];
    priceRange: { min: number; max: number };
    artists: string[];
  };
}

export class GalleryStatsDto {
  @ApiProperty()
  totalPieces: number;

  @ApiProperty()
  availablePieces: number;

  @ApiProperty()
  soldPieces: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  byCategory: { category: string; count: number; totalValue: number }[];

  @ApiProperty()
  topArtists: { artist: string; count: number }[];
}
```

---

## Paso 2: Agregar Métodos al ArtService

Agregar en `src/art/art.service.ts`:

```typescript
import { GalleryFiltersDto, GalleryResponseDto, GalleryStatsDto, ArtSortBy } from './dto/gallery.dto';

// ... código existente ...

// Galería para marketplace web
async getGallery(filters: GalleryFiltersDto): Promise<GalleryResponseDto> {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    sortBy = ArtSortBy.NEWEST,
    page = 1,
    limit = 12,
  } = filters;

  // Construir where clause
  const where: any = {
    isAvailable: true,
  };

  if (category) {
    where.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { artist: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Determinar ordenamiento
  let orderBy: any = { createdAt: 'desc' };
  switch (sortBy) {
    case ArtSortBy.PRICE_ASC:
      orderBy = { price: 'asc' };
      break;
    case ArtSortBy.PRICE_DESC:
      orderBy = { price: 'desc' };
      break;
    case ArtSortBy.TITLE:
      orderBy = { title: 'asc' };
      break;
  }

  // Ejecutar consultas en paralelo
  const [artPieces, total, availableFilters] = await Promise.all([
    this.prisma.artPiece.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.artPiece.count({ where }),
    this.getAvailableFilters(),
  ]);

  return {
    artPieces: artPieces.map((piece) => ({
      id: piece.id,
      title: piece.title,
      artist: piece.artist,
      description: piece.description,
      price: piece.price,
      currency: piece.currency,
      category: piece.category,
      imageUrl: piece.imageUrl,
      isAvailable: piece.isAvailable,
      tokenId: piece.tokenId,
      sourceAssetId: piece.sourceAssetId,
      createdAt: piece.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    availableFilters,
  };
}

// Filtros disponibles
private async getAvailableFilters() {
  const [categories, priceRange, artists] = await Promise.all([
    this.prisma.artPiece.groupBy({
      by: ['category'],
      where: { isAvailable: true },
    }),
    this.prisma.artPiece.aggregate({
      where: { isAvailable: true },
      _min: { price: true },
      _max: { price: true },
    }),
    this.prisma.artPiece.groupBy({
      by: ['artist'],
      where: { isAvailable: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    categories: categories.map((c) => c.category),
    priceRange: {
      min: priceRange._min.price || 0,
      max: priceRange._max.price || 10000,
    },
    artists: artists.map((a) => a.artist),
  };
}

// Estadísticas de galería
async getGalleryStats(): Promise<GalleryStatsDto> {
  const [total, available, byCategory, topArtists, totalValue] = await Promise.all([
    this.prisma.artPiece.count(),
    this.prisma.artPiece.count({ where: { isAvailable: true } }),
    this.prisma.artPiece.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { price: true },
    }),
    this.prisma.artPiece.groupBy({
      by: ['artist'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    this.prisma.artPiece.aggregate({
      where: { isAvailable: true },
      _sum: { price: true },
    }),
  ]);

  return {
    totalPieces: total,
    availablePieces: available,
    soldPieces: total - available,
    totalValue: totalValue._sum.price || 0,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
      totalValue: c._sum.price || 0,
    })),
    topArtists: topArtists.map((a) => ({
      artist: a.artist,
      count: a._count.id,
    })),
  };
}

// Obra destacada (más reciente o aleatoria)
async getFeaturedArt() {
  const featured = await this.prisma.artPiece.findFirst({
    where: { isAvailable: true },
    orderBy: { createdAt: 'desc' },
  });

  return featured ? this.toResponseDto(featured) : null;
}
```

---

## Paso 3: Agregar Endpoints al ArtController

Agregar en `src/art/art.controller.ts`:

```typescript
import { GalleryFiltersDto, GalleryResponseDto, GalleryStatsDto } from './dto/gallery.dto';

// ... imports existentes ...

// Agregar estos endpoints ANTES de los endpoints con parámetros dinámicos (:id)

@Get('gallery')
@ApiOperation({ 
  summary: 'Obtener galería de arte para marketplace',
  description: 'Lista obras de arte con filtros, paginación y ordenamiento para el marketplace web'
})
@ApiResponse({ status: 200, type: GalleryResponseDto })
getGallery(@Query() filters: GalleryFiltersDto) {
  return this.artService.getGallery(filters);
}

@Get('gallery/stats')
@ApiOperation({ summary: 'Obtener estadísticas de la galería' })
@ApiResponse({ status: 200, type: GalleryStatsDto })
getGalleryStats() {
  return this.artService.getGalleryStats();
}

@Get('gallery/featured')
@ApiOperation({ summary: 'Obtener obra destacada' })
@ApiResponse({ status: 200, type: ArtPieceResponseDto })
getFeaturedArt() {
  return this.artService.getFeaturedArt();
}

@Get('gallery/filters')
@ApiOperation({ summary: 'Obtener filtros disponibles' })
async getGalleryFilters() {
  const gallery = await this.artService.getGallery({ limit: 1 });
  return gallery.availableFilters;
}
```

---

## Paso 4: Actualizar API del Frontend

Agregar en `src/lib/api.ts` del frontend:

```typescript
// Art Gallery API Types
export interface GalleryFilters {
  category?: 'NFT' | 'SCULPTURE' | 'INSTALLATION';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'title';
  page?: number;
  limit?: number;
}

export interface GalleryResponse {
  artPieces: BackendArtPiece[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  availableFilters: {
    categories: string[];
    priceRange: { min: number; max: number };
    artists: string[];
  };
}

export interface GalleryStats {
  totalPieces: number;
  availablePieces: number;
  soldPieces: number;
  totalValue: number;
  byCategory: { category: string; count: number; totalValue: number }[];
  topArtists: { artist: string; count: number }[];
}

// Art Gallery API
export const artGalleryApi = {
  getGallery: (filters?: GalleryFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiRequest<GalleryResponse>(`/art/gallery${queryString ? `?${queryString}` : ''}`);
  },

  getStats: () =>
    apiRequest<GalleryStats>('/art/gallery/stats'),

  getFeatured: () =>
    apiRequest<BackendArtPiece>('/art/gallery/featured'),

  getFilters: () =>
    apiRequest<GalleryResponse['availableFilters']>('/art/gallery/filters'),
};
```

---

## Paso 5: Crear Hook useArtGallery

Crear `src/hooks/useArtGallery.ts` en el frontend:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { artGalleryApi, GalleryFilters, GalleryResponse, BackendArtPiece } from '@/lib/api';
import type { ArtPiece } from '@/types';

interface UseArtGalleryReturn {
  artPieces: ArtPiece[];
  total: number;
  page: number;
  totalPages: number;
  availableFilters: GalleryResponse['availableFilters'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: GalleryFilters) => Promise<void>;
  setPage: (page: number) => void;
}

// Transformar categoría del backend al formato del frontend
const categoryMap: Record<string, 'nft' | 'sculpture' | 'installation'> = {
  NFT: 'nft',
  SCULPTURE: 'sculpture',
  INSTALLATION: 'installation',
};

export function useArtGallery(initialFilters?: GalleryFilters): UseArtGalleryReturn {
  const [artPieces, setArtPieces] = useState<ArtPiece[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialFilters?.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [availableFilters, setAvailableFilters] = useState<GalleryResponse['availableFilters'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<GalleryFilters>(initialFilters || {});

  const fetchData = useCallback(async (filters?: GalleryFilters) => {
    setIsLoading(true);
    setError(null);

    const mergedFilters = { ...currentFilters, ...filters, page };

    try {
      const response = await artGalleryApi.getGallery(mergedFilters);

      if (response.data) {
        const transformedArt: ArtPiece[] = response.data.artPieces.map((a) => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          description: a.description,
          price: a.price,
          image: a.imageUrl || '/art/default.jpg',
          category: categoryMap[a.category] || 'sculpture',
          isAvailable: a.isAvailable,
        }));

        setArtPieces(transformedArt);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setAvailableFilters(response.data.availableFilters);
        
        if (filters) {
          setCurrentFilters(mergedFilters);
        }
      }

      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Error al cargar la galería de arte');
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters, page]);

  useEffect(() => {
    fetchData();
  }, [page]);

  return {
    artPieces,
    total,
    page,
    totalPages,
    availableFilters,
    isLoading,
    error,
    refetch: fetchData,
    setPage,
  };
}
```

---

## Verificación

### Probar endpoints del backend

```bash
# Galería con filtros
curl "http://localhost:4000/art/gallery?category=SCULPTURE&sortBy=price_desc&limit=6"

# Estadísticas
curl http://localhost:4000/art/gallery/stats

# Obra destacada
curl http://localhost:4000/art/gallery/featured

# Filtros disponibles
curl http://localhost:4000/art/gallery/filters
```

### Respuesta esperada de galería

```json
{
  "artPieces": [
    {
      "id": "...",
      "title": "Mi Obra",
      "artist": "Artista Rafiki",
      "description": "...",
      "price": 285.71,
      "currency": "USD",
      "category": "SCULPTURE",
      "imageUrl": "https://res.cloudinary.com/xxx/...",
      "isAvailable": true,
      "tokenId": null,
      "sourceAssetId": "...",
      "createdAt": "2026-01-12T..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12,
  "totalPages": 1,
  "availableFilters": {
    "categories": ["SCULPTURE"],
    "priceRange": { "min": 285.71, "max": 285.71 },
    "artists": ["Artista Rafiki"]
  }
}
```

---

## Resumen de Archivos

### Backend
| Archivo | Descripción |
|---------|-------------|
| `src/art/dto/gallery.dto.ts` | DTOs para galería con filtros y paginación |
| `src/art/art.service.ts` | Métodos getGallery, getGalleryStats, getFeaturedArt |
| `src/art/art.controller.ts` | Endpoints /art/gallery, /art/gallery/stats, etc. |

### Frontend
| Archivo | Descripción |
|---------|-------------|
| `src/lib/api.ts` | Tipos y funciones para artGalleryApi |
| `src/hooks/useArtGallery.ts` | Hook para consumir la galería con filtros |

---

## Flujo Completo

```
1. Usuario abre /market y selecciona "Galería de Arte"
2. Frontend llama a GET /art/gallery
3. Backend retorna obras disponibles con filtros
4. Usuario puede filtrar por categoría, precio, búsqueda
5. Usuario puede ordenar por fecha, precio, título
6. Paginación automática para grandes colecciones
7. Imágenes de Cloudinary se muestran en las cards
```
