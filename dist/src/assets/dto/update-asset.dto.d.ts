import { CreateAssetDto } from './create-asset.dto';
declare enum AssetStatus {
    PENDING_COLLECTION = "PENDING_COLLECTION",
    IN_TRANSIT = "IN_TRANSIT",
    WAREHOUSE_RECEIVED = "WAREHOUSE_RECEIVED",
    INSPECTING = "INSPECTING",
    INSPECTED = "INSPECTED",
    RECYCLED = "RECYCLED",
    REUSED = "REUSED",
    READY_FOR_REUSE = "READY_FOR_REUSE",
    REFURBISHING = "REFURBISHING",
    LISTED_FOR_SALE = "LISTED_FOR_SALE",
    ART_CANDIDATE = "ART_CANDIDATE"
}
declare const UpdateAssetDto_base: import("@nestjs/common").Type<Partial<CreateAssetDto>>;
export declare class UpdateAssetDto extends UpdateAssetDto_base {
    status?: AssetStatus;
    qrCode?: string;
}
export {};
