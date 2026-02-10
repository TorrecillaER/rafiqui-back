import { IsNotEmpty, IsNumber, IsString, IsUUID, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { InspectionResult } from '@prisma/client';

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

  @IsEnum(InspectionResult)
  @IsNotEmpty()
  aiRecommendation: InspectionResult;
}
