import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf, IsEnum } from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsOptional()
  nfcTagId?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsUUID()
  @IsOptional()
  collectionRequestId?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @ValidateIf((o) => o.status !== undefined && o.status !== null && o.status !== '')
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;
}
