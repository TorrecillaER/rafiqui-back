import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecycleService } from './recycle.service';
import { ProcessRecycleDto, RecycleResponseDto, MaterialStockDto, MaterialBalancesDto } from './dto/recycle.dto';

@ApiTags('Recycle')
@Controller('recycle')
export class RecycleController {
  constructor(private readonly recycleService: RecycleService) {}

  @Post('process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Procesar reciclaje de panel',
    description: 'Recicla un panel, separa los materiales, actualiza inventario y mintea tokens ERC-1155'
  })
  @ApiResponse({ status: 200, type: RecycleResponseDto })
  processRecycle(@Body() dto: ProcessRecycleDto, @CurrentUser() user: any) {
    return this.recycleService.processRecycle({ ...dto, operatorId: user.userId });
  }

  @Get('check/:qrCode')
  @ApiOperation({ summary: 'Verificar si un panel puede ser reciclado' })
  checkRecycle(@Param('qrCode') qrCode: string) {
    return this.recycleService.findAssetForRecycle(qrCode);
  }

  @Get('materials')
  @ApiOperation({ summary: 'Obtener stock actual de materiales en BD' })
  @ApiResponse({ status: 200, type: [MaterialStockDto] })
  getMaterialStock() {
    return this.recycleService.getMaterialStock();
  }

  @Get('materials/treasury')
  @ApiOperation({ 
    summary: 'Obtener balance de tokens ERC-1155 en treasury',
    description: 'Consulta el contrato RafiquiMaterials para obtener los balances de tokens disponibles para venta'
  })
  @ApiResponse({ status: 200, type: MaterialBalancesDto })
  getTreasuryBalances() {
    return this.recycleService.getTreasuryBalances();
  }

  @Get('materials/wallet/:address')
  @ApiOperation({ 
    summary: 'Obtener balance de tokens ERC-1155 de una wallet',
    description: 'Consulta los balances de materiales de una wallet específica'
  })
  @ApiResponse({ status: 200, type: MaterialBalancesDto })
  getWalletBalances(@Param('address') address: string) {
    return this.recycleService.getWalletBalances(address);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de reciclajes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(@Query('limit') limit?: number) {
    return this.recycleService.getRecycleHistory(limit);
  }
}
