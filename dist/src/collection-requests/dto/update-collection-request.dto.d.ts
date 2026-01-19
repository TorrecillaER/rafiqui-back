import { CreateCollectionRequestDto } from './create-collection-request.dto';
declare const UpdateCollectionRequestDto_base: import("@nestjs/common").Type<Partial<CreateCollectionRequestDto>>;
export declare class UpdateCollectionRequestDto extends UpdateCollectionRequestDto_base {
    status?: string;
    assignedCollectorId?: string;
    assignedCollectorEmail?: string;
}
export {};
