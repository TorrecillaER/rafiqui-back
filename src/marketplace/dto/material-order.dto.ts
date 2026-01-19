import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';

export enum MaterialDestination {
  MANUFACTURING = 'MANUFACTURING',
  CONSTRUCTION = 'CONSTRUCTION',
  RESEARCH = 'RESEARCH',
  RECYCLING_CENTER = 'RECYCLING_CENTER',
  OTHER = 'OTHER',
}

export class CreateMaterialOrderDto {
  @ApiProperty({ description: 'ID del comprador' })
  @IsString()
  buyerId: string;

  @ApiProperty({ enum: ['ALUMINUM', 'GLASS', 'SILICON', 'COPPER'] })
  @IsString()
  materialType: string;

  @ApiProperty({ description: 'Cantidad en kg' })
  @IsNumber()
  @Min(0.1)
  quantityKg: number;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;

  @ApiProperty({ enum: MaterialDestination, description: 'Destino del material' })
  @IsEnum(MaterialDestination)
  destination: MaterialDestination;

  @ApiProperty({ description: 'Notas adicionales sobre el destino', required: false })
  @IsString()
  @IsOptional()
  destinationNotes?: string;
}

export class MaterialOrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  order: {
    id: string;
    materialType: string;
    quantityKg: number;
    totalPrice: number;
    status: string;
    blockchainTxHash: string | null;
    tokensTransferred: number;
  };
}

export class MaterialAvailabilityDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  availableKg: number;

  @ApiProperty()
  availableTokens: number;

  @ApiProperty()
  pricePerKg: number;

  @ApiProperty()
  totalValue: number;
}
