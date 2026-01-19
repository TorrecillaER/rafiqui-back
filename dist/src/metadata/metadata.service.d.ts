import { PrismaService } from '../prisma/prisma.service';
import { NFTMetadataDto } from './dto/metadata.dto';
export declare class MetadataService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getArtMetadata(tokenId: string): Promise<NFTMetadataDto>;
    getPanelMetadata(tokenId: string): Promise<NFTMetadataDto>;
}
