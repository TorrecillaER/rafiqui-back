import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
  @ApiProperty({ description: 'Lista de grupos de paneles', type: [MarketplaceGroupDto] })
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
  @ApiProperty({ description: 'Lista de paneles', type: [MarketplacePanelDto] })
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
