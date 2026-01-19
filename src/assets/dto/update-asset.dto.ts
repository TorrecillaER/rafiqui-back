import { PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

enum AssetStatus {
  PENDING_COLLECTION = 'PENDING_COLLECTION',
  IN_TRANSIT = 'IN_TRANSIT',
  WAREHOUSE_RECEIVED = 'WAREHOUSE_RECEIVED',
  INSPECTING = 'INSPECTING',
  INSPECTED = 'INSPECTED',
  RECYCLED = 'RECYCLED',
  REUSED = 'REUSED',
  READY_FOR_REUSE = 'READY_FOR_REUSE',
  REFURBISHING = 'REFURBISHING',
  LISTED_FOR_SALE = 'LISTED_FOR_SALE',
  ART_CANDIDATE = 'ART_CANDIDATE',
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  qrCode?: string;
}
