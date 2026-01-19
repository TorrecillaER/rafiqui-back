import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Notas sobre el destino' })
  @IsString()
  @IsOptional()
  destinationNotes?: string;

  @ApiPropertyOptional({ description: 'ID del usuario comprador (si está registrado)' })
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
    tokenId: string;
    price: number;
    blockchainTxHash: string | null;
  };
}

export class PanelDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  measuredPowerWatts: number;

  @ApiProperty()
  measuredVoltage: number;

  @ApiProperty()
  healthPercentage: number;

  @ApiProperty()
  capacityRetainedPercent: number;

  @ApiProperty()
  dimensionLength: number;

  @ApiProperty()
  dimensionWidth: number;

  @ApiProperty()
  dimensionHeight: number;

  @ApiProperty()
  refurbishedAt: Date;
}
