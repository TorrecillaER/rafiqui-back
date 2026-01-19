import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProcessRecycleDto {
  @ApiProperty({ description: 'ID del asset a reciclar' })
  @IsString()
  assetId: string;

  @ApiPropertyOptional({ description: 'ID del operador que procesa (se obtiene del usuario autenticado)' })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiPropertyOptional({ description: 'Peso del panel en kg (default: 20)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  panelWeightKg?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecycleResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  recycleRecord: {
    id: string;
    assetId: string;
    panelWeightKg: number;
    materials: {
      aluminum: number;
      glass: number;
      silicon: number;
      copper: number;
    };
    blockchainTxHash: string | null;
    materialsTxHash: string | null;
    tokensMinted: {
      aluminum: number;
      glass: number;
      silicon: number;
      copper: number;
    };
  };

  @ApiProperty()
  updatedStock: {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
  };
}

export class MaterialStockDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalKg: number;

  @ApiProperty()
  availableKg: number;

  @ApiProperty()
  pricePerKg: number;
}

export class MaterialBalancesDto {
  @ApiProperty()
  aluminum: number;

  @ApiProperty()
  glass: number;

  @ApiProperty()
  silicon: number;

  @ApiProperty()
  copper: number;
}
