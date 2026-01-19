import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MaterialsMarketplaceService } from './materials-marketplace.service';
import { CreateMaterialOrderDto, MaterialOrderResponseDto, MaterialAvailabilityDto } from './dto/material-order.dto';

@ApiTags('Materials Marketplace')
@Controller('marketplace/materials')
export class MaterialsMarketplaceController {
  constructor(private readonly materialsMarketplace: MaterialsMarketplaceService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Obtener disponibilidad de materiales para compra' })
  @ApiResponse({ status: 200, description: 'Lista de materiales disponibles', type: [MaterialAvailabilityDto] })
  async getAvailability(): Promise<MaterialAvailabilityDto[]> {
    return this.materialsMarketplace.getAvailability();
  }

  @Post('order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear orden de compra de materiales' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente', type: MaterialOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  async createOrder(@Body() dto: CreateMaterialOrderDto): Promise<MaterialOrderResponseDto> {
    return this.materialsMarketplace.createOrder(dto);
  }

  @Get('orders/buyer/:buyerId')
  @ApiOperation({ summary: 'Obtener órdenes de un comprador' })
  @ApiResponse({ status: 200, description: 'Lista de órdenes del comprador' })
  async getOrdersByBuyer(@Param('buyerId') buyerId: string) {
    return this.materialsMarketplace.getOrdersByBuyer(buyerId);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Obtener detalles de una orden' })
  @ApiResponse({ status: 200, description: 'Detalles de la orden' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async getOrderById(@Param('orderId') orderId: string) {
    return this.materialsMarketplace.getOrderById(orderId);
  }
}
