import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ArtMarketplaceService } from './art-marketplace.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';

@ApiTags('Art Marketplace')
@Controller('marketplace/art')
export class ArtMarketplaceController {
  constructor(private artMarketplace: ArtMarketplaceService) {}

  @Get('available')
  @ApiOperation({ summary: 'Obtener obras de arte disponibles para venta' })
  async getAvailableArt() {
    return this.artMarketplace.getAvailableArt();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del marketplace de arte' })
  async getArtMarketplaceStats() {
    return this.artMarketplace.getArtMarketplaceStats();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Obtener historial de órdenes de arte' })
  @ApiQuery({ name: 'buyerId', required: false })
  async getArtOrderHistory(@Query('buyerId') buyerId?: string) {
    return this.artMarketplace.getArtOrderHistory(buyerId);
  }

  @Get(':artPieceId')
  @ApiOperation({ summary: 'Obtener detalles de una obra de arte' })
  async getArtDetails(@Param('artPieceId') artPieceId: string) {
    return this.artMarketplace.getArtDetails(artPieceId);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Comprar obra de arte',
    description: 'Compra una obra de arte y transfiere el NFT ERC-721 a la wallet del comprador'
  })
  @ApiResponse({ status: 200, type: ArtOrderResponseDto })
  async purchaseArt(@Body() dto: CreateArtOrderDto): Promise<ArtOrderResponseDto> {
    if (!dto.buyerId) {
      dto.buyerId = '7b01e47c-728f-4621-ae9a-2e8831c1ce5d';
    }
    return this.artMarketplace.purchaseArt(dto);
  }
}
