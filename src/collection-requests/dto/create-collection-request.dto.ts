import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCollectionRequestDto {
  @IsUUID()
  @IsOptional()
  donorId?: string;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsNumber()
  @IsNotEmpty()
  estimatedCount: number;

  @IsString()
  @IsNotEmpty()
  panelType: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
