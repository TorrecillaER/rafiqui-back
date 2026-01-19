import { MetadataService } from './metadata.service';
import { NFTMetadataDto } from './dto/metadata.dto';
export declare class MetadataController {
    private readonly metadataService;
    constructor(metadataService: MetadataService);
    getArtMetadata(tokenId: string): Promise<NFTMetadataDto>;
    getPanelMetadata(tokenId: string): Promise<NFTMetadataDto>;
}
