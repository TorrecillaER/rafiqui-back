import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { CollectionRequestsService } from './collection-requests.service';
import { CreateCollectionRequestDto } from './dto/create-collection-request.dto';
import { ApiOperation, ApiQuery, ApiBearerAuth, ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UpdateCollectionRequestDto } from './dto/update-collection-request.dto';

@ApiTags('Collection Requests')
@Controller('collection-requests')
export class CollectionRequestsController {
  constructor(private readonly collectionRequestsService: CollectionRequestsService) {}

  @Post()
  create(@Body() createCollectionRequestDto: CreateCollectionRequestDto) {
    return this.collectionRequestsService.create(createCollectionRequestDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener solicitudes con filtros opcionales' })
  @ApiQuery({ name: 'status', required: false, description: 'Estados separados por coma (e.g. PENDING,ASSIGNED)' })
  @ApiQuery({ name: 'myRequests', required: false, description: 'Si es true, filtra solo las solicitudes asignadas al usuario autenticado' })
  findAll(
    @Query('status') status?: string,
    @Query('myRequests') myRequests?: string,
    @CurrentUser() user?: any,
  ) {
    // Si myRequests=true, usar el ID del usuario autenticado
    const assignedCollectorId = myRequests === 'true' ? user?.userId : undefined;
    return this.collectionRequestsService.findAll(status, assignedCollectorId);
  }

  @Get('history/:collectorId')
  @ApiOperation({ summary: 'Obtener historial de recolecciones de un collector' })
  @ApiParam({ name: 'collectorId', description: 'ID del collector' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Estados separados por coma (por defecto: COMPLETED)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de recolecciones obtenido exitosamente' 
  })
  async getCollectorHistory(
    @Param('collectorId') collectorId: string,
    @Query('status') status?: string,
  ) {
    return this.collectionRequestsService.getCollectorHistory(collectorId, status);
  }

  @Get('history-by-email/:email')
  @ApiOperation({ summary: 'Obtener historial de recolecciones por email del collector' })
  @ApiParam({ name: 'email', description: 'Email del collector' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Estados separados por coma (por defecto: COMPLETED)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de recolecciones obtenido exitosamente' 
  })
  async getCollectorHistoryByEmail(
    @Param('email') email: string,
    @Query('status') status?: string,
  ) {
    return this.collectionRequestsService.getCollectorHistoryByEmail(email, status);
  }

  @Get('stats/:collectorId')
  @ApiOperation({ summary: 'Obtener estadísticas de un collector' })
  @ApiParam({ name: 'collectorId', description: 'ID del collector' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas del collector obtenidas exitosamente',
    schema: {
      example: {
        completedCollections: 15,
        activeCollections: 2,
        totalPanelsCollected: 850,
        estimatedWeightKg: 17000,
        estimatedWeightTons: 17,
      },
    },
  })
  async getCollectorStats(@Param('collectorId') collectorId: string) {
    return this.collectionRequestsService.getCollectorStats(collectorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una solicitud por ID' })
  findOne(@Param('id') id: string) {
    return this.collectionRequestsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una solicitud' })
  update(
    @Param('id') id: string, 
    @Body() updateData: UpdateCollectionRequestDto,
    @CurrentUser() user: any,
  ) {
    // Si no se proporciona assignedCollectorId ni assignedCollectorEmail,
    // y el body tiene assignToMe=true, asignar al usuario autenticado
    if ((updateData as any).assignToMe && !updateData.assignedCollectorId && !updateData.assignedCollectorEmail) {
      updateData.assignedCollectorId = user.userId;
    }
    return this.collectionRequestsService.update(id, updateData);
  }
}
