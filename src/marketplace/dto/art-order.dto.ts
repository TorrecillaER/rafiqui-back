import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateArtOrderDto {
  @ApiProperty({ description: 'ID de la obra de arte' })
  @IsString()
  artPieceId: string;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;

  @ApiPropertyOptional({ description: 'ID del usuario comprador (si está registrado)' })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiPropertyOptional({ description: 'Mensaje para el artista' })
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
    artist: string;
    price: number;
    blockchainTxHash: string | null;
  };
}
