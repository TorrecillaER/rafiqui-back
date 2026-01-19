import { IsNotEmpty, IsNumber, IsString, IsUUID, IsUrl, IsOptional } from 'class-validator';

export class CreateInspectionDto {
  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  inspectorId: string;

  @IsNumber()
  @IsNotEmpty()
  measuredVoltage: number;

  @IsNumber()
  @IsNotEmpty()
  measuredAmps: number;

  @IsString()
  @IsNotEmpty()
  physicalCondition: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
