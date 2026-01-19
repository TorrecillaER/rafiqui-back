import { Controller, Get, Param, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MetadataService } from './metadata.service';
import { NFTMetadataDto } from './dto/metadata.dto';

@ApiTags('NFT Metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('art/:tokenId')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ 
    summary: 'Obtener metadata de obra de arte',
    description: 'Retorna el JSON de metadata en formato ERC-721 para obras de arte NFT'
  })
  @ApiParam({ name: 'tokenId', description: 'Token ID del NFT de arte' })
  @ApiResponse({ status: 200, type: NFTMetadataDto })
  async getArtMetadata(@Param('tokenId') tokenId: string): Promise<NFTMetadataDto> {
    return this.metadataService.getArtMetadata(tokenId);
  }

  @Get('panel/:tokenId')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ 
    summary: 'Obtener metadata de panel',
    description: 'Retorna el JSON de metadata en formato ERC-721 para paneles NFT'
  })
  @ApiParam({ name: 'tokenId', description: 'Token ID o QR Code del panel' })
  @ApiResponse({ status: 200, type: NFTMetadataDto })
  async getPanelMetadata(@Param('tokenId') tokenId: string): Promise<NFTMetadataDto> {
    return this.metadataService.getPanelMetadata(tokenId);
  }
}
