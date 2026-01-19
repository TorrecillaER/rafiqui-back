import { AssetStatus } from '@prisma/client';
export declare class CreateAssetDto {
    nfcTagId?: string;
    qrCode?: string;
    collectionRequestId?: string;
    brand?: string;
    model?: string;
    status?: AssetStatus;
}
