import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PanelsMarketplaceService } from './panels-marketplace.service';
import { CreatePanelOrderDto, PanelOrderResponseDto, PanelDetailsDto } from './dto/panel-order.dto';

@ApiTags('Panels Marketplace')
@Controller('marketplace/panels')
export class PanelsMarketplaceController {
  constructor(private panelsMarketplace: PanelsMarketplaceService) {}

  @Get('available')
  @ApiOperation({ summary: 'Obtener paneles disponibles para venta' })
  @ApiResponse({ status: 200, type: [PanelDetailsDto] })
  async getAvailablePanels() {
    return this.panelsMarketplace.getAvailablePanels();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del marketplace de paneles' })
  async getMarketplaceStats() {
    return this.panelsMarketplace.getMarketplaceStats();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Obtener historial de órdenes de paneles' })
  @ApiQuery({ name: 'buyerId', required: false })
  async getPanelOrderHistory(@Query('buyerId') buyerId?: string) {
    return this.panelsMarketplace.getPanelOrderHistory(buyerId);
  }

  @Get(':assetId')
  @ApiOperation({ summary: 'Obtener detalles de un panel específico' })
  @ApiResponse({ status: 200, type: PanelDetailsDto })
  async getPanelDetails(@Param('assetId') assetId: string) {
    return this.panelsMarketplace.getPanelDetails(assetId);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Comprar panel reacondicionado',
    description: 'Compra un panel y transfiere el NFT ERC-721 a la wallet del comprador'
  })
  @ApiResponse({ status: 200, type: PanelOrderResponseDto })
  async purchasePanel(@Body() dto: CreatePanelOrderDto) {
    if (!dto.buyerId) {
      dto.buyerId = '7b01e47c-728f-4621-ae9a-2e8831c1ce5d';
    }
    return this.panelsMarketplace.purchasePanel(dto);
  }
}
