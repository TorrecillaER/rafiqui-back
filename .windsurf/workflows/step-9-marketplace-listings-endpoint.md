---
description: Endpoint de marketplace para listar paneles reacondicionados con filtros y agrupación
---

# Step 9: Endpoint de Marketplace para Paneles Reacondicionados

Este workflow crea un endpoint especializado para el marketplace que:
1. Solo trae paneles con estado `LISTED_FOR_SALE`
2. Permite filtrar por marca, potencia, voltaje, dimensiones y grado de salud
3. Agrupa paneles por características similares para mostrar cards en el marketplace

## Prerrequisitos

- [ ] Backend NestJS funcionando
- [ ] Módulo de Assets existente
- [ ] Campos de reacondicionamiento en el schema de Asset
- [ ] Cuenta de Cloudinary configurada con imágenes en `Assets_Refurbished/`

---

## Paso 1: Crear DTOs para Marketplace

Crear archivo `src/assets/dto/marketplace.dto.ts`:

```typescript
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsArray } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// Grados de salud del panel
export enum HealthGrade {
  A = 'A', // >85%
  B = 'B', // >75% y <=85%
  C = 'C', // <=75%
}

// Rangos de potencia predefinidos
export enum PowerRange {
  LOW = 'LOW',       // <200W
  MEDIUM = 'MEDIUM', // 200-300W
  HIGH = 'HIGH',     // >300W
}

// DTO para filtros de búsqueda
export class MarketplaceFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por marca(s)', example: 'SunPower,LG' })
  @IsOptional()
  @IsString()
  brands?: string;

  @ApiPropertyOptional({ description: 'Potencia mínima en watts', example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPower?: number;

  @ApiPropertyOptional({ description: 'Potencia máxima en watts', example: 400 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPower?: number;

  @ApiPropertyOptional({ description: 'Rango de potencia predefinido', enum: PowerRange })
  @IsOptional()
  @IsEnum(PowerRange)
  powerRange?: PowerRange;

  @ApiPropertyOptional({ description: 'Voltaje mínimo en V', example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minVoltage?: number;

  @ApiPropertyOptional({ description: 'Voltaje máximo en V', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxVoltage?: number;

  @ApiPropertyOptional({ description: 'Grado de salud (A: >85%, B: >75%, C: <=75%)', enum: HealthGrade })
  @IsOptional()
  @IsEnum(HealthGrade)
  healthGrade?: HealthGrade;

  @ApiPropertyOptional({ description: 'Largo mínimo en cm', example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minLength?: number;

  @ApiPropertyOptional({ description: 'Largo máximo en cm', example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Ancho mínimo en cm', example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWidth?: number;

  @ApiPropertyOptional({ description: 'Ancho máximo en cm', example: 110 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWidth?: number;

  @ApiPropertyOptional({ description: 'Ordenar por campo', example: 'healthPercentage' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Orden ascendente o descendente', example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Página (para paginación)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Elementos por página', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// DTO para un panel individual en el marketplace
export class MarketplacePanelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  measuredPowerWatts: number;

  @ApiProperty()
  measuredVoltage: number;

  @ApiProperty()
  healthPercentage: number;

  @ApiProperty({ enum: HealthGrade })
  healthGrade: HealthGrade;

  @ApiProperty()
  dimensionLength: number;

  @ApiProperty()
  dimensionWidth: number;

  @ApiProperty()
  dimensionHeight: number;

  @ApiProperty()
  refurbishedAt: Date;

  @ApiPropertyOptional()
  refurbishmentNotes?: string;
}

// DTO para grupo de paneles similares (para cards del marketplace)
export class MarketplaceGroupDto {
  @ApiProperty({ description: 'ID único del grupo' })
  groupId: string;

  @ApiProperty({ description: 'Marca del grupo' })
  brand: string;

  @ApiProperty({ description: 'Modelo del grupo (puede ser "Varios" si hay múltiples)' })
  model: string;

  @ApiProperty({ description: 'Rango de potencia del grupo', example: '280-320W' })
  powerRange: string;

  @ApiProperty({ description: 'Potencia promedio en watts' })
  avgPower: number;

  @ApiProperty({ description: 'Voltaje promedio en V' })
  avgVoltage: number;

  @ApiProperty({ description: 'Grado de salud del grupo', enum: HealthGrade })
  healthGrade: HealthGrade;

  @ApiProperty({ description: 'Porcentaje de salud promedio' })
  avgHealthPercentage: number;

  @ApiProperty({ description: 'Dimensiones aproximadas', example: '165x99 cm' })
  dimensions: string;

  @ApiProperty({ description: 'Cantidad de paneles disponibles en este grupo' })
  availableCount: number;

  @ApiProperty({ description: 'Lista de IDs de paneles en este grupo' })
  panelIds: string[];

  @ApiPropertyOptional({ description: 'Precio sugerido (si aplica)' })
  suggestedPrice?: number;

  @ApiPropertyOptional({ description: 'URL de imagen representativa' })
  imageUrl?: string;
}

// DTO para respuesta del marketplace
export class MarketplaceResponseDto {
  @ApiProperty({ description: 'Lista de grupos de paneles' })
  groups: MarketplaceGroupDto[];

  @ApiProperty({ description: 'Total de paneles disponibles' })
  totalPanels: number;

  @ApiProperty({ description: 'Total de grupos' })
  totalGroups: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Filtros disponibles para el frontend' })
  availableFilters: {
    brands: string[];
    powerRanges: { min: number; max: number };
    voltageRanges: { min: number; max: number };
    healthGrades: HealthGrade[];
  };
}

// DTO para respuesta de paneles individuales (sin agrupar)
export class MarketplacePanelsResponseDto {
  @ApiProperty({ description: 'Lista de paneles' })
  panels: MarketplacePanelDto[];

  @ApiProperty({ description: 'Total de paneles' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
```

---

## Paso 2: Crear Servicio de Marketplace

Crear archivo `src/marketplace/marketplace.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetStatus } from '@prisma/client';
import {
  MarketplaceFiltersDto,
  MarketplaceResponseDto,
  MarketplaceGroupDto,
  MarketplacePanelDto,
  MarketplacePanelsResponseDto,
  HealthGrade,
  PowerRange,
} from '../assets/dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);
  
  // Configuración de Cloudinary
  private readonly CLOUDINARY_BASE_URL = process.env.CLOUDINARY_URL || 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload';
  private readonly CLOUDINARY_FOLDER = 'Assets_Refurbished';
  
  // Mapeo de marcas a nombres de archivo en Cloudinary
  // Las imágenes son PNG con formato: {Marca}_{Grado}.png (ej: Trina_A.png, Canadian_B.png)
  private readonly BRAND_IMAGE_MAP: Record<string, string> = {
    'Trina': 'Trina',
    'Trina Solar': 'Trina',
    'Canadian': 'Canadian',
    'Canadian Solar': 'Canadian',
    'SunPower': 'Sunpower',
    'Sunpower': 'Sunpower',
    // Agregar más marcas según sea necesario
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Calcula el grado de salud basado en el porcentaje
   */
  private calculateHealthGrade(healthPercentage: number): HealthGrade {
    if (healthPercentage > 85) return HealthGrade.A;
    if (healthPercentage > 75) return HealthGrade.B;
    return HealthGrade.C;
  }

  /**
   * Genera la URL de imagen de Cloudinary basada en marca y grado de salud
   * Las imágenes son PNG con formato: {Marca}_{Grado}.png
   * Ejemplo: Assets_Refurbished/Trina_A.png, Assets_Refurbished/Canadian_B.png
   */
  private getImageUrl(brand: string, healthGrade: HealthGrade): string {
    // Normalizar el nombre de la marca
    const normalizedBrand = this.BRAND_IMAGE_MAP[brand] || this.normalizeBrandName(brand);
    
    // Construir el nombre del archivo: {Marca}_{Grado}
    const fileName = `${normalizedBrand}_${healthGrade}`;
    
    // URL completa de Cloudinary con extensión .png
    return `${this.CLOUDINARY_BASE_URL}/${this.CLOUDINARY_FOLDER}/${fileName}.png`;
  }

  /**
   * Normaliza el nombre de marca para usarlo en el nombre de archivo
   * Capitaliza la primera letra y elimina espacios
   */
  private normalizeBrandName(brand: string): string {
    if (!brand) return 'Generic';
    
    // Capitalizar primera letra, resto en minúsculas, sin espacios
    const normalized = brand
      .trim()
      .split(' ')[0] // Tomar solo la primera palabra
      .toLowerCase();
    
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  /**
   * Genera un ID único para un grupo basado en sus características
   */
  private generateGroupId(brand: string, powerRange: string, healthGrade: HealthGrade, dimensions: string): string {
    return `${brand}-${powerRange}-${healthGrade}-${dimensions}`.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Construye el filtro WHERE para Prisma basado en los filtros del DTO
   */
  private buildWhereClause(filters: MarketplaceFiltersDto): any {
    const where: any = {
      status: AssetStatus.LISTED_FOR_SALE,
    };

    // Filtro por marcas
    if (filters.brands) {
      const brandList = filters.brands.split(',').map(b => b.trim());
      where.brand = { in: brandList };
    }

    // Filtro por potencia (rango personalizado)
    if (filters.minPower !== undefined || filters.maxPower !== undefined) {
      where.measuredPowerWatts = {};
      if (filters.minPower !== undefined) where.measuredPowerWatts.gte = filters.minPower;
      if (filters.maxPower !== undefined) where.measuredPowerWatts.lte = filters.maxPower;
    }

    // Filtro por rango de potencia predefinido
    if (filters.powerRange) {
      where.measuredPowerWatts = where.measuredPowerWatts || {};
      switch (filters.powerRange) {
        case PowerRange.LOW:
          where.measuredPowerWatts.lt = 200;
          break;
        case PowerRange.MEDIUM:
          where.measuredPowerWatts.gte = 200;
          where.measuredPowerWatts.lte = 300;
          break;
        case PowerRange.HIGH:
          where.measuredPowerWatts.gt = 300;
          break;
      }
    }

    // Filtro por voltaje
    if (filters.minVoltage !== undefined || filters.maxVoltage !== undefined) {
      where.measuredVoltage = {};
      if (filters.minVoltage !== undefined) where.measuredVoltage.gte = filters.minVoltage;
      if (filters.maxVoltage !== undefined) where.measuredVoltage.lte = filters.maxVoltage;
    }

    // Filtro por grado de salud
    if (filters.healthGrade) {
      where.healthPercentage = where.healthPercentage || {};
      switch (filters.healthGrade) {
        case HealthGrade.A:
          where.healthPercentage.gt = 85;
          break;
        case HealthGrade.B:
          where.healthPercentage.gt = 75;
          where.healthPercentage.lte = 85;
          break;
        case HealthGrade.C:
          where.healthPercentage.lte = 75;
          break;
      }
    }

    // Filtro por dimensiones (largo)
    if (filters.minLength !== undefined || filters.maxLength !== undefined) {
      where.dimensionLength = {};
      if (filters.minLength !== undefined) where.dimensionLength.gte = filters.minLength;
      if (filters.maxLength !== undefined) where.dimensionLength.lte = filters.maxLength;
    }

    // Filtro por dimensiones (ancho)
    if (filters.minWidth !== undefined || filters.maxWidth !== undefined) {
      where.dimensionWidth = {};
      if (filters.minWidth !== undefined) where.dimensionWidth.gte = filters.minWidth;
      if (filters.maxWidth !== undefined) where.dimensionWidth.lte = filters.maxWidth;
    }

    return where;
  }

  /**
   * Obtiene los paneles disponibles para venta (sin agrupar)
   */
  async getAvailablePanels(filters: MarketplaceFiltersDto): Promise<MarketplacePanelsResponseDto> {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Ordenamiento
    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.refurbishedAt = 'desc';
    }

    const [panels, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          qrCode: true,
          brand: true,
          model: true,
          measuredPowerWatts: true,
          measuredVoltage: true,
          healthPercentage: true,
          dimensionLength: true,
          dimensionWidth: true,
          dimensionHeight: true,
          refurbishedAt: true,
          refurbishmentNotes: true,
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    const mappedPanels: MarketplacePanelDto[] = panels.map(panel => ({
      id: panel.id,
      qrCode: panel.qrCode || '',
      brand: panel.brand || 'Desconocido',
      model: panel.model || 'Desconocido',
      measuredPowerWatts: panel.measuredPowerWatts || 0,
      measuredVoltage: panel.measuredVoltage || 0,
      healthPercentage: panel.healthPercentage || 0,
      healthGrade: this.calculateHealthGrade(panel.healthPercentage || 0),
      dimensionLength: panel.dimensionLength || 0,
      dimensionWidth: panel.dimensionWidth || 0,
      dimensionHeight: panel.dimensionHeight || 0,
      refurbishedAt: panel.refurbishedAt || new Date(),
      refurbishmentNotes: panel.refurbishmentNotes || undefined,
    }));

    return {
      panels: mappedPanels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene los paneles agrupados por características similares
   * Ideal para mostrar cards en el marketplace
   */
  async getGroupedPanels(filters: MarketplaceFiltersDto): Promise<MarketplaceResponseDto> {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Obtener todos los paneles que coinciden con los filtros
    const panels = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        qrCode: true,
        brand: true,
        model: true,
        measuredPowerWatts: true,
        measuredVoltage: true,
        healthPercentage: true,
        dimensionLength: true,
        dimensionWidth: true,
        dimensionHeight: true,
        refurbishedAt: true,
      },
    });

    // Agrupar paneles por características similares
    const groupsMap = new Map<string, {
      panels: typeof panels;
      brand: string;
      models: Set<string>;
      powers: number[];
      voltages: number[];
      healths: number[];
      lengths: number[];
      widths: number[];
    }>();

    for (const panel of panels) {
      const brand = panel.brand || 'Desconocido';
      const healthGrade = this.calculateHealthGrade(panel.healthPercentage || 0);
      
      // Redondear potencia a rangos de 50W para agrupar
      const powerRounded = Math.round((panel.measuredPowerWatts || 0) / 50) * 50;
      const powerRange = `${powerRounded - 25}-${powerRounded + 25}W`;
      
      // Redondear dimensiones a rangos de 10cm
      const lengthRounded = Math.round((panel.dimensionLength || 0) / 10) * 10;
      const widthRounded = Math.round((panel.dimensionWidth || 0) / 10) * 10;
      const dimensions = `${lengthRounded}x${widthRounded}`;

      const groupKey = this.generateGroupId(brand, powerRange, healthGrade, dimensions);

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          panels: [],
          brand,
          models: new Set(),
          powers: [],
          voltages: [],
          healths: [],
          lengths: [],
          widths: [],
        });
      }

      const group = groupsMap.get(groupKey)!;
      group.panels.push(panel);
      group.models.add(panel.model || 'Desconocido');
      group.powers.push(panel.measuredPowerWatts || 0);
      group.voltages.push(panel.measuredVoltage || 0);
      group.healths.push(panel.healthPercentage || 0);
      group.lengths.push(panel.dimensionLength || 0);
      group.widths.push(panel.dimensionWidth || 0);
    }

    // Convertir grupos a DTOs
    const groups: MarketplaceGroupDto[] = Array.from(groupsMap.entries()).map(([groupId, data]) => {
      const avgPower = data.powers.reduce((a, b) => a + b, 0) / data.powers.length;
      const avgVoltage = data.voltages.reduce((a, b) => a + b, 0) / data.voltages.length;
      const avgHealth = data.healths.reduce((a, b) => a + b, 0) / data.healths.length;
      const avgLength = data.lengths.reduce((a, b) => a + b, 0) / data.lengths.length;
      const avgWidth = data.widths.reduce((a, b) => a + b, 0) / data.widths.length;

      const minPower = Math.min(...data.powers);
      const maxPower = Math.max(...data.powers);

      const healthGrade = this.calculateHealthGrade(avgHealth);
      
      return {
        groupId,
        brand: data.brand,
        model: data.models.size === 1 ? Array.from(data.models)[0] : `${data.models.size} modelos`,
        powerRange: minPower === maxPower ? `${minPower}W` : `${Math.round(minPower)}-${Math.round(maxPower)}W`,
        avgPower: Math.round(avgPower),
        avgVoltage: Math.round(avgVoltage * 10) / 10,
        healthGrade,
        avgHealthPercentage: Math.round(avgHealth),
        dimensions: `${Math.round(avgLength)}x${Math.round(avgWidth)} cm`,
        availableCount: data.panels.length,
        panelIds: data.panels.map(p => p.id),
        suggestedPrice: this.calculateSuggestedPrice(avgPower, avgHealth),
        imageUrl: this.getImageUrl(data.brand, healthGrade),
      };
    });

    // Ordenar grupos por cantidad disponible (descendente)
    groups.sort((a, b) => b.availableCount - a.availableCount);

    // Paginación de grupos
    const totalGroups = groups.length;
    const paginatedGroups = groups.slice((page - 1) * limit, page * limit);

    // Obtener filtros disponibles
    const availableFilters = await this.getAvailableFilters();

    return {
      groups: paginatedGroups,
      totalPanels: panels.length,
      totalGroups,
      page,
      limit,
      totalPages: Math.ceil(totalGroups / limit),
      availableFilters,
    };
  }

  /**
   * Calcula un precio sugerido basado en potencia y salud
   */
  private calculateSuggestedPrice(avgPower: number, avgHealth: number): number {
    // Precio base por watt (ejemplo: $0.15 USD por watt)
    const pricePerWatt = 0.15;
    
    // Factor de salud (100% = 1.0, 75% = 0.75)
    const healthFactor = avgHealth / 100;
    
    // Precio sugerido
    const basePrice = avgPower * pricePerWatt;
    const adjustedPrice = basePrice * healthFactor;
    
    // Redondear a 2 decimales
    return Math.round(adjustedPrice * 100) / 100;
  }

  /**
   * Obtiene los filtros disponibles basados en los paneles existentes
   */
  async getAvailableFilters(): Promise<{
    brands: string[];
    powerRanges: { min: number; max: number };
    voltageRanges: { min: number; max: number };
    healthGrades: HealthGrade[];
  }> {
    const panels = await this.prisma.asset.findMany({
      where: { status: AssetStatus.LISTED_FOR_SALE },
      select: {
        brand: true,
        measuredPowerWatts: true,
        measuredVoltage: true,
        healthPercentage: true,
      },
    });

    const brands = [...new Set(panels.map(p => p.brand).filter(Boolean))] as string[];
    const powers = panels.map(p => p.measuredPowerWatts || 0).filter(p => p > 0);
    const voltages = panels.map(p => p.measuredVoltage || 0).filter(v => v > 0);
    const healths = panels.map(p => p.healthPercentage || 0);

    const healthGrades: HealthGrade[] = [];
    if (healths.some(h => h > 85)) healthGrades.push(HealthGrade.A);
    if (healths.some(h => h > 75 && h <= 85)) healthGrades.push(HealthGrade.B);
    if (healths.some(h => h <= 75)) healthGrades.push(HealthGrade.C);

    return {
      brands: brands.sort(),
      powerRanges: {
        min: powers.length > 0 ? Math.min(...powers) : 0,
        max: powers.length > 0 ? Math.max(...powers) : 0,
      },
      voltageRanges: {
        min: voltages.length > 0 ? Math.min(...voltages) : 0,
        max: voltages.length > 0 ? Math.max(...voltages) : 0,
      },
      healthGrades,
    };
  }

  /**
   * Obtiene los detalles de un grupo específico
   */
  async getGroupDetails(groupId: string): Promise<MarketplacePanelDto[]> {
    // El groupId contiene la información para reconstruir el filtro
    // Por ahora, retornamos los paneles por sus IDs que vienen en el request
    return [];
  }

  /**
   * Obtiene estadísticas del marketplace
   */
  async getMarketplaceStats(): Promise<{
    totalPanels: number;
    totalPower: number;
    avgHealthPercentage: number;
    byGrade: { grade: HealthGrade; count: number }[];
    byBrand: { brand: string; count: number }[];
  }> {
    const panels = await this.prisma.asset.findMany({
      where: { status: AssetStatus.LISTED_FOR_SALE },
      select: {
        brand: true,
        measuredPowerWatts: true,
        healthPercentage: true,
      },
    });

    const totalPanels = panels.length;
    const totalPower = panels.reduce((sum, p) => sum + (p.measuredPowerWatts || 0), 0);
    const avgHealth = totalPanels > 0
      ? panels.reduce((sum, p) => sum + (p.healthPercentage || 0), 0) / totalPanels
      : 0;

    // Contar por grado
    const gradeA = panels.filter(p => (p.healthPercentage || 0) > 85).length;
    const gradeB = panels.filter(p => (p.healthPercentage || 0) > 75 && (p.healthPercentage || 0) <= 85).length;
    const gradeC = panels.filter(p => (p.healthPercentage || 0) <= 75).length;

    // Contar por marca
    const brandCounts = new Map<string, number>();
    for (const panel of panels) {
      const brand = panel.brand || 'Desconocido';
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    }

    return {
      totalPanels,
      totalPower: Math.round(totalPower),
      avgHealthPercentage: Math.round(avgHealth),
      byGrade: [
        { grade: HealthGrade.A, count: gradeA },
        { grade: HealthGrade.B, count: gradeB },
        { grade: HealthGrade.C, count: gradeC },
      ],
      byBrand: Array.from(brandCounts.entries())
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
```

---

## Paso 3: Crear Controller de Marketplace

Crear archivo `src/marketplace/marketplace.controller.ts`:

```typescript
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import {
  MarketplaceFiltersDto,
  MarketplaceResponseDto,
  MarketplacePanelsResponseDto,
  HealthGrade,
  PowerRange,
} from '../assets/dto/marketplace.dto';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('panels')
  @ApiOperation({ summary: 'Obtener paneles disponibles para venta (sin agrupar)' })
  @ApiQuery({ name: 'brands', required: false, description: 'Marcas separadas por coma' })
  @ApiQuery({ name: 'minPower', required: false, type: Number })
  @ApiQuery({ name: 'maxPower', required: false, type: Number })
  @ApiQuery({ name: 'powerRange', required: false, enum: PowerRange })
  @ApiQuery({ name: 'minVoltage', required: false, type: Number })
  @ApiQuery({ name: 'maxVoltage', required: false, type: Number })
  @ApiQuery({ name: 'healthGrade', required: false, enum: HealthGrade })
  @ApiQuery({ name: 'minLength', required: false, type: Number })
  @ApiQuery({ name: 'maxLength', required: false, type: Number })
  @ApiQuery({ name: 'minWidth', required: false, type: Number })
  @ApiQuery({ name: 'maxWidth', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de paneles', type: MarketplacePanelsResponseDto })
  async getPanels(@Query() filters: MarketplaceFiltersDto): Promise<MarketplacePanelsResponseDto> {
    return this.marketplaceService.getAvailablePanels(filters);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Obtener paneles agrupados por características (para cards del marketplace)' })
  @ApiQuery({ name: 'brands', required: false, description: 'Marcas separadas por coma' })
  @ApiQuery({ name: 'minPower', required: false, type: Number })
  @ApiQuery({ name: 'maxPower', required: false, type: Number })
  @ApiQuery({ name: 'powerRange', required: false, enum: PowerRange })
  @ApiQuery({ name: 'minVoltage', required: false, type: Number })
  @ApiQuery({ name: 'maxVoltage', required: false, type: Number })
  @ApiQuery({ name: 'healthGrade', required: false, enum: HealthGrade })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Grupos de paneles', type: MarketplaceResponseDto })
  async getGroups(@Query() filters: MarketplaceFiltersDto): Promise<MarketplaceResponseDto> {
    return this.marketplaceService.getGroupedPanels(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del marketplace' })
  async getStats() {
    return this.marketplaceService.getMarketplaceStats();
  }

  @Get('filters')
  @ApiOperation({ summary: 'Obtener filtros disponibles basados en el inventario actual' })
  async getAvailableFilters() {
    return this.marketplaceService.getAvailableFilters();
  }

  @Get('group/:groupId/panels')
  @ApiOperation({ summary: 'Obtener paneles de un grupo específico' })
  async getGroupPanels(
    @Param('groupId') groupId: string,
    @Query('panelIds') panelIds: string,
  ): Promise<MarketplacePanelsResponseDto> {
    // Convertir panelIds string a array
    const ids = panelIds ? panelIds.split(',') : [];
    
    // Buscar paneles por IDs
    const panels = await this.marketplaceService.getAvailablePanels({
      // Filtrar por IDs específicos se haría en el servicio
    });
    
    return panels;
  }
}
```

---

## Paso 4: Crear Módulo de Marketplace

Crear archivo `src/marketplace/marketplace.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
```

---

## Paso 5: Registrar Módulo en AppModule

Modificar `src/app.module.ts`:

```typescript
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [
    // ... otros módulos
    MarketplaceModule,
  ],
})
export class AppModule {}
```

---

## Verificación

### Probar endpoint de paneles sin agrupar

```bash
# Todos los paneles disponibles
curl "http://localhost:4000/marketplace/panels"

# Filtrar por marca
curl "http://localhost:4000/marketplace/panels?brands=SunPower,LG"

# Filtrar por grado de salud A (>85%)
curl "http://localhost:4000/marketplace/panels?healthGrade=A"

# Filtrar por rango de potencia
curl "http://localhost:4000/marketplace/panels?minPower=250&maxPower=350"

# Combinación de filtros
curl "http://localhost:4000/marketplace/panels?brands=SunPower&healthGrade=A&minPower=280"
```

### Probar endpoint de grupos (para cards)

```bash
# Grupos de paneles
curl "http://localhost:4000/marketplace/groups"

# Grupos filtrados por grado A
curl "http://localhost:4000/marketplace/groups?healthGrade=A"
```

### Respuesta esperada de grupos

```json
{
  "groups": [
    {
      "groupId": "sunpower-275-325w-a-170x100",
      "brand": "SunPower",
      "model": "SPR-X21-345",
      "powerRange": "275-325W",
      "avgPower": 300,
      "avgVoltage": 38.5,
      "healthGrade": "A",
      "avgHealthPercentage": 92,
      "dimensions": "170x100 cm",
      "availableCount": 15,
      "panelIds": ["id1", "id2", ...],
      "suggestedPrice": 41.40,
      "imageUrl": "https://res.cloudinary.com/YOUR_CLOUD/image/upload/Assets_Refurbished/Sunpower_A.png"
    },
    {
      "groupId": "canadian-250-300w-b-165x99",
      "brand": "Canadian Solar",
      "model": "2 modelos",
      "powerRange": "250-300W",
      "avgPower": 275,
      "avgVoltage": 36.2,
      "healthGrade": "B",
      "avgHealthPercentage": 80,
      "dimensions": "165x99 cm",
      "availableCount": 8,
      "panelIds": ["id3", "id4", ...],
      "suggestedPrice": 33.00,
      "imageUrl": "https://res.cloudinary.com/YOUR_CLOUD/image/upload/Assets_Refurbished/Canadian_B.png"
    }
  ],
  "totalPanels": 23,
  "totalGroups": 2,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "availableFilters": {
    "brands": ["LG", "SunPower"],
    "powerRanges": { "min": 250, "max": 325 },
    "voltageRanges": { "min": 35, "max": 40 },
    "healthGrades": ["A", "B"]
  }
}
```

---

## Uso en Frontend (Marketplace Cards)

```tsx
// Ejemplo de uso en React
const MarketplaceGrid = () => {
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetch(`/marketplace/groups?${new URLSearchParams(filters)}`)
      .then(res => res.json())
      .then(data => setGroups(data.groups));
  }, [filters]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {groups.map(group => (
        <MarketplaceCard
          key={group.groupId}
          brand={group.brand}
          model={group.model}
          powerRange={group.powerRange}
          healthGrade={group.healthGrade}
          availableCount={group.availableCount}
          suggestedPrice={group.suggestedPrice}
          dimensions={group.dimensions}
          onClick={() => showGroupDetails(group.panelIds)}
        />
      ))}
    </div>
  );
};
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/marketplace/panels` | Lista de paneles individuales con filtros |
| GET | `/marketplace/groups` | Paneles agrupados por características (para cards) |
| GET | `/marketplace/stats` | Estadísticas del marketplace |
| GET | `/marketplace/filters` | Filtros disponibles dinámicos |
| GET | `/marketplace/group/:groupId/panels` | Paneles de un grupo específico |

---

## Grados de Salud

| Grado | Rango | Descripción |
|-------|-------|-------------|
| **A** | >85% | Excelente estado, casi como nuevo |
| **B** | 75-85% | Buen estado, funcionamiento óptimo |
| **C** | <75% | Estado aceptable, precio reducido |

---

## Configuración de Cloudinary

### Estructura de Imágenes

Las imágenes están en la carpeta `Assets_Refurbished` de tu Media Library en Cloudinary.

### Formato de Archivos

- **Extensión:** PNG
- **Formato de nombre:** `{Marca}_{Grado}.png`
- **Carpeta:** `Assets_Refurbished`

### Imágenes Requeridas

| Archivo | Descripción |
|---------|-------------|
| `Trina_A.png` | Panel Trina Grado A (>85% salud) |
| `Trina_B.png` | Panel Trina Grado B (75-85% salud) |
| `Trina_C.png` | Panel Trina Grado C (<75% salud) |
| `Canadian_A.png` | Panel Canadian Solar Grado A |
| `Canadian_B.png` | Panel Canadian Solar Grado B |
| `Canadian_C.png` | Panel Canadian Solar Grado C |
| `Sunpower_A.png` | Panel SunPower Grado A |
| `Sunpower_B.png` | Panel SunPower Grado B |
| `Sunpower_C.png` | Panel SunPower Grado C |
| `Generic_A.png` | Imagen genérica Grado A (fallback) |
| `Generic_B.png` | Imagen genérica Grado B (fallback) |
| `Generic_C.png` | Imagen genérica Grado C (fallback) |

### Variables de Entorno

Agregar en `.env`:

```env
# Cloudinary
CLOUDINARY_URL=https://res.cloudinary.com/TU_CLOUD_NAME/image/upload
```

### URL Generada

El servicio genera automáticamente la URL basada en marca y grado:

```
https://res.cloudinary.com/TU_CLOUD/image/upload/Assets_Refurbished/Trina_A.png
https://res.cloudinary.com/TU_CLOUD/image/upload/Assets_Refurbished/Canadian_B.png
https://res.cloudinary.com/TU_CLOUD/image/upload/Assets_Refurbished/Sunpower_C.png
```

### Agregar Nuevas Marcas

1. Subir las imágenes PNG a Cloudinary (carpeta `Assets_Refurbished`)
2. Nombrar como `{Marca}_A.png`, `{Marca}_B.png`, `{Marca}_C.png`
3. Actualizar `BRAND_IMAGE_MAP` en el servicio:

```typescript
private readonly BRAND_IMAGE_MAP: Record<string, string> = {
  // ... marcas existentes
  'LG': 'Lg',
  'JA Solar': 'Jasolar',
};
```

4. Subir imágenes: `Lg_A.png`, `Lg_B.png`, `Lg_C.png`
