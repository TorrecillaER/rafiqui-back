import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ApiOperation, ApiQuery, ApiBearerAuth, ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Inspections')
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva inspección' })
  create(
    @Body() createInspectionDto: CreateInspectionDto,
    @CurrentUser() user: any,
  ) {
    // Usar el ID del usuario autenticado como inspectorId
    return this.inspectionsService.create({
      ...createInspectionDto,
      inspectorId: user.userId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar inspecciones' })
  @ApiQuery({ name: 'myInspections', required: false, description: 'Si es true, filtra solo las inspecciones del usuario autenticado' })
  findAll(
    @Query('myInspections') myInspections?: string,
    @CurrentUser() user?: any,
  ) {
    // Si myInspections=true, usar el ID del usuario autenticado
    const inspectorId = myInspections === 'true' ? user?.userId : undefined;
    return this.inspectionsService.findAll(inspectorId);
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas del inspector autenticado' })
  getMyStats(@CurrentUser() user: any) {
    // Usar el ID del usuario autenticado
    return this.inspectionsService.getStats(user.userId);
  }

  @Get('stats/:inspectorId')
  @ApiOperation({ summary: 'Obtener estadísticas detalladas de un inspector' })
  @ApiParam({ name: 'inspectorId', description: 'ID del inspector' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas del inspector obtenidas exitosamente',
    schema: {
      example: {
        recyclingCount: 45,
        reuseCount: 120,
        artCount: 8,
        totalInspections: 173,
        monthlyGoalProgress: 0.65,
        impactHighlight: '173 paneles',
        impactMessage: 'inspeccionados contribuyendo a la economia circular de energia solar.',
        inspectorName: 'Juan Pérez',
        stationId: '#03',
      },
    },
  })
  async getInspectorStats(@Param('inspectorId') inspectorId: string) {
    return this.inspectionsService.getInspectorStats(inspectorId);
  }

  @Get('stats-by-email/:email')
  @ApiOperation({ summary: 'Obtener estadísticas detalladas por email del inspector' })
  @ApiParam({ name: 'email', description: 'Email del inspector' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas del inspector obtenidas exitosamente' 
  })
  async getInspectorStatsByEmail(@Param('email') email: string) {
    return this.inspectionsService.getInspectorStatsByEmail(email);
  }

  @Get('recent/:inspectorId')
  @ApiOperation({ summary: 'Obtener últimas inspecciones de un inspector' })
  @ApiParam({ name: 'inspectorId', description: 'ID del inspector' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Número de inspecciones a retornar (por defecto: 10)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Últimas inspecciones obtenidas exitosamente',
    schema: {
      example: [
        {
          id: 'ID-A1B2',
          panelId: 'uuid-panel-1',
          panelType: 'SunPower X22',
          status: 'approved',
          result: 'REUSE',
          inspectedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
    },
  })
  async getRecentInspections(
    @Param('inspectorId') inspectorId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.inspectionsService.getRecentInspections(inspectorId, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una inspección por ID' })
  findOne(@Param('id') id: string) {
    return this.inspectionsService.findOne(id);
  }
}
