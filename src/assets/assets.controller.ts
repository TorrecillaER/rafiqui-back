import { Body, Controller, Get, Param, Patch, Post, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ScanAssetDto } from './dto/scan-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ValidateForInspectionDto, ValidateForInspectionResponseDto } from './dto/validate-for-inspection.dto';
import { CompleteRefurbishmentDto, CompleteRefurbishmentResponseDto } from './dto/complete-refurbishment.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo asset' })
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @Post('scan')
  scan(@Body() scanAssetDto: ScanAssetDto) {
    return this.assetsService.scan(scanAssetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener assets con filtros opcionales' })
  @ApiQuery({ name: 'status', required: false, description: 'Estados separados por coma (e.g. COLLECTED,WAREHOUSE_RECEIVED)' })
  @ApiQuery({ name: 'nfcTagId', required: false })
  @ApiQuery({ name: 'qrCode', required: false })
  @ApiQuery({ name: 'collectionRequestId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('nfcTagId') nfcTagId?: string,
    @Query('qrCode') qrCode?: string,
    @Query('collectionRequestId') collectionRequestId?: string,
  ) {
    return this.assetsService.findAll(status, nfcTagId, collectionRequestId, qrCode);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un asset' })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Post('validate-for-inspection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validar si un panel puede ser inspeccionado y cambiar estado a INSPECTING' })
  @ApiResponse({ status: 200, description: 'Resultado de validación', type: ValidateForInspectionResponseDto })
  async validateForInspection(
    @Body() dto: ValidateForInspectionDto,
    @CurrentUser() user: any,
  ): Promise<ValidateForInspectionResponseDto> {
    // Usar el ID del usuario autenticado en lugar del que viene en el DTO
    return this.assetsService.validateForInspection(dto.qrCode, user.userId);
  }

  @Get('by-qr/:qrCode')
  @ApiOperation({ summary: 'Buscar asset por código QR' })
  async findByQrCode(@Param('qrCode') qrCode: string) {
    const asset = await this.assetsService.findByQrCode(qrCode);
    if (!asset) {
      throw new NotFoundException(`Asset con QR ${qrCode} no encontrado`);
    }
    return asset;
  }

  @Get('by-nfc/:nfcTagId')
  @ApiOperation({ summary: 'Buscar asset por NFC Tag ID' })
  async findByNfcTag(@Param('nfcTagId') nfcTagId: string) {
    const asset = await this.assetsService.findByNfcTag(nfcTagId);
    if (!asset) {
      throw new NotFoundException(`Asset con NFC ${nfcTagId} no encontrado`);
    }
    return asset;
  }

  @Post(':id/complete-refurbishment')
  @ApiOperation({ summary: 'Completar reacondicionamiento y marcar como listo para venta' })
  @ApiResponse({ status: 200, description: 'Reacondicionamiento completado', type: CompleteRefurbishmentResponseDto })
  async completeRefurbishment(
    @Param('id') id: string,
    @Body() dto?: CompleteRefurbishmentDto,
  ): Promise<CompleteRefurbishmentResponseDto> {
    return this.assetsService.completeRefurbishment(id, dto);
  }
}
