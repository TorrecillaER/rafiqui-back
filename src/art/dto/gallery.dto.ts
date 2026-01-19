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
