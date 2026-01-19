import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ArtCategory {
  NFT = 'NFT',
  SCULPTURE = 'SCULPTURE',
  INSTALLATION = 'INSTALLATION',
}

export class CreateArtPieceDto {
  @ApiProperty({ description: 'Título de la obra' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Nombre del artista' })
  @IsString()
  artist: string;

  @ApiProperty({ description: 'Descripción de la obra' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Precio de la obra' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Moneda (USD, ETH)', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: ArtCategory, description: 'Categoría de la obra' })
  @IsEnum(ArtCategory)
  category: ArtCategory;

  @ApiPropertyOptional({ description: 'URL de la imagen de la obra' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'ID del activo origen (panel solar)' })
  @IsOptional()
  @IsString()
  sourceAssetId?: string;
}

export class UpdateArtPieceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  artist?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractAddress?: string;
}

export class ArtPieceResponseDto {
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

  @ApiProperty({ enum: ArtCategory })
  category: ArtCategory;

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
