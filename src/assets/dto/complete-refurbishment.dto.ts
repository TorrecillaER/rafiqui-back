import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteRefurbishmentDto {
  @ApiPropertyOptional({ description: 'Notas del técnico sobre el reacondicionamiento' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Nueva potencia medida en watts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  measuredPowerWatts?: number;

  @ApiPropertyOptional({ description: 'Voltaje medido en V' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  measuredVoltage?: number;

  @ApiPropertyOptional({ description: 'Porcentaje de capacidad retenida (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  capacityRetainedPercent?: number;

  @ApiPropertyOptional({ description: 'Porcentaje de estado de salud (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  healthPercentage?: number;

  @ApiPropertyOptional({ description: 'Largo del panel en cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dimensionLength?: number;

  @ApiPropertyOptional({ description: 'Ancho del panel en cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dimensionWidth?: number;

  @ApiPropertyOptional({ description: 'Alto/grosor del panel en cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dimensionHeight?: number;

  @ApiPropertyOptional({ description: 'ID del técnico que realizó el reacondicionamiento' })
  @IsOptional()
  @IsString()
  technicianId?: string;
}

export class CompleteRefurbishmentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  asset?: any;

  @ApiPropertyOptional()
  blockchainTxHash?: string;
}
