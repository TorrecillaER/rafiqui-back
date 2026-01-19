import { PartialType } from '@nestjs/swagger';
import { CreateCollectionRequestDto } from './create-collection-request.dto';
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCollectionRequestDto extends PartialType(CreateCollectionRequestDto) {
  @ApiPropertyOptional({ description: 'Estado de la solicitud' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'ID del collector asignado (UUID)' })
  @IsString()
  @IsOptional()
  assignedCollectorId?: string;

  @ApiPropertyOptional({ description: 'Email del collector a asignar (alternativa a assignedCollectorId)' })
  @IsEmail()
  @IsOptional()
  assignedCollectorEmail?: string;
}
