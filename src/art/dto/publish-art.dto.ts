import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
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
    tokenId: string | null | undefined;
    createdAt: Date;
  };

  @ApiPropertyOptional()
  blockchainTxHash?: string;
}

export class FindArtCandidateResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  asset?: {
    id: string;
    qrCode: string | null;
    brand: string | null;
    model: string | null;
    status: string;
    inspection?: {
      id: string;
      result: string;
      notes: string | null;
    };
  };
}
