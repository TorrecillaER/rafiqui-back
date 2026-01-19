import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateForInspectionDto {
  @ApiProperty({ description: 'Código QR del panel' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}

export class ValidateForInspectionResponseDto {
  @ApiProperty({ description: 'Indica si el panel es válido para inspección' })
  valid: boolean;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado' })
  message: string;

  @ApiPropertyOptional({ description: 'Datos del asset si fue encontrado' })
  asset?: any;

  @ApiPropertyOptional({ description: 'Mensaje de error detallado si valid es false' })
  error?: string;
}
