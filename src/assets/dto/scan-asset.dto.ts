import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ScanAssetDto {
  @IsString()
  @IsNotEmpty()
  nfcTagId: string;

  @IsUUID()
  @IsNotEmpty()
  requestId: string;
}
