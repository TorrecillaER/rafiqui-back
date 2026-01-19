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
  private readonly CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  private readonly CLOUDINARY_FOLDER = process.env.CLOUDINARY_MARKETPLACE_FOLDER || ''; // Sin carpeta por defecto
  
  // Mapeo de marcas a nombres de archivo en Cloudinary
  // IMPORTANTE: Los nombres deben coincidir EXACTAMENTE con los archivos en Cloudinary (case-sensitive)
  private readonly BRAND_IMAGE_MAP: Record<string, string> = {
    'Trina': 'Trina',
    'Trina Solar': 'Trina',
    'Canadian': 'Canadian',
    'Canadian Solar': 'Canadian',
    'JA': 'JA',
    'JA Solar': 'JA',
    'Jinko': 'Jinko',
    'Jinko Solar': 'Jinko',
    'LONGi': 'LONGi',
    'Longi': 'LONGi',
    'SunPower': 'Sunpower',  // Nota: "Sunpower" con solo la S mayúscula
    'LG': 'LG',
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene paneles agrupados para el marketplace
   */
  async getMarketplaceListings(filters: MarketplaceFiltersDto): Promise<MarketplaceResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Construir filtros de Prisma
    const where = this.buildWhereClause(filters);

    // Obtener todos los paneles que cumplen los filtros
    const allPanels = await this.prisma.asset.findMany({
      where,
      orderBy: this.buildOrderBy(filters),
    });

    this.logger.log(`Found ${allPanels.length} panels matching filters`);

    // Agrupar paneles por características similares
    const groups = this.groupPanels(allPanels);

    // Paginación de grupos
    const totalGroups = groups.length;
    const totalPages = Math.ceil(totalGroups / limit);
    const skip = (page - 1) * limit;
    const paginatedGroups = groups.slice(skip, skip + limit);

    // Obtener filtros disponibles
    const availableFilters = await this.getAvailableFilters();

    return {
      groups: paginatedGroups,
      totalPanels: allPanels.length,
      totalGroups,
      page,
      limit,
      totalPages,
      availableFilters,
    };
  }

  /**
   * Obtiene paneles individuales sin agrupar
   */
  async getMarketplacePanels(filters: MarketplaceFiltersDto): Promise<MarketplacePanelsResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    const [panels, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy: this.buildOrderBy(filters),
        skip,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      panels: panels.map(p => this.mapToMarketplacePanel(p)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Construye la cláusula WHERE para Prisma
   */
  private buildWhereClause(filters: MarketplaceFiltersDto): any {
    const where: any = {
      status: AssetStatus.LISTED_FOR_SALE,
      measuredPowerWatts: { not: null },
      measuredVoltage: { not: null },
      healthPercentage: { not: null },
    };

    // Filtro por marcas
    if (filters.brands) {
      const brandList = filters.brands.split(',').map(b => b.trim());
      where.brand = { in: brandList };
    }

    // Filtro por potencia
    if (filters.minPower !== undefined || filters.maxPower !== undefined) {
      where.measuredPowerWatts = {};
      if (filters.minPower !== undefined) {
        where.measuredPowerWatts.gte = filters.minPower;
      }
      if (filters.maxPower !== undefined) {
        where.measuredPowerWatts.lte = filters.maxPower;
      }
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
      if (filters.minVoltage !== undefined) {
        where.measuredVoltage.gte = filters.minVoltage;
      }
      if (filters.maxVoltage !== undefined) {
        where.measuredVoltage.lte = filters.maxVoltage;
      }
    }

    // Filtro por grado de salud
    if (filters.healthGrade) {
      where.healthPercentage = {};
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

    // Filtro por dimensiones
    if (filters.minLength !== undefined || filters.maxLength !== undefined) {
      where.dimensionLength = {};
      if (filters.minLength !== undefined) {
        where.dimensionLength.gte = filters.minLength;
      }
      if (filters.maxLength !== undefined) {
        where.dimensionLength.lte = filters.maxLength;
      }
    }

    if (filters.minWidth !== undefined || filters.maxWidth !== undefined) {
      where.dimensionWidth = {};
      if (filters.minWidth !== undefined) {
        where.dimensionWidth.gte = filters.minWidth;
      }
      if (filters.maxWidth !== undefined) {
        where.dimensionWidth.lte = filters.maxWidth;
      }
    }

    return where;
  }

  /**
   * Construye el ORDER BY para Prisma
   */
  private buildOrderBy(filters: MarketplaceFiltersDto): any {
    const sortBy = filters.sortBy || 'healthPercentage';
    const sortOrder = filters.sortOrder || 'desc';

    return { [sortBy]: sortOrder };
  }

  /**
   * Agrupa paneles por características similares
   */
  private groupPanels(panels: any[]): MarketplaceGroupDto[] {
    const groupMap = new Map<string, any[]>();

    // Agrupar por marca + grado de salud + rango de potencia
    for (const panel of panels) {
      const healthGrade = this.calculateHealthGrade(panel.healthPercentage);
      const powerBucket = this.getPowerBucket(panel.measuredPowerWatts);
      const groupKey = `${panel.brand}_${healthGrade}_${powerBucket}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(panel);
    }

    // Convertir grupos a DTOs
    const groups: MarketplaceGroupDto[] = [];
    
    for (const [groupKey, groupPanels] of groupMap.entries()) {
      const group = this.createGroupDto(groupKey, groupPanels);
      groups.push(group);
    }

    // Ordenar grupos por salud y cantidad
    groups.sort((a, b) => {
      if (a.healthGrade !== b.healthGrade) {
        return a.healthGrade.localeCompare(b.healthGrade);
      }
      return b.availableCount - a.availableCount;
    });

    return groups;
  }

  /**
   * Crea un DTO de grupo a partir de paneles similares
   */
  private createGroupDto(groupKey: string, panels: any[]): MarketplaceGroupDto {
    const [brand, healthGrade] = groupKey.split('_');

    // Calcular promedios
    const avgPower = panels.reduce((sum, p) => sum + (p.measuredPowerWatts || 0), 0) / panels.length;
    const avgVoltage = panels.reduce((sum, p) => sum + (p.measuredVoltage || 0), 0) / panels.length;
    const avgHealth = panels.reduce((sum, p) => sum + (p.healthPercentage || 0), 0) / panels.length;

    // Rango de potencia
    const powers = panels.map(p => p.measuredPowerWatts).filter(p => p != null);
    const minPower = Math.min(...powers);
    const maxPower = Math.max(...powers);
    const powerRange = minPower === maxPower 
      ? `${Math.round(minPower)}W` 
      : `${Math.round(minPower)}-${Math.round(maxPower)}W`;

    // Modelo (si todos son iguales, usar ese; si no, "Varios")
    const models = [...new Set(panels.map(p => p.model).filter(m => m))];
    const model = models.length === 1 ? models[0] : 'Varios';

    // Dimensiones aproximadas
    const avgLength = panels.reduce((sum, p) => sum + (p.dimensionLength || 0), 0) / panels.length;
    const avgWidth = panels.reduce((sum, p) => sum + (p.dimensionWidth || 0), 0) / panels.length;
    const dimensions = `${Math.round(avgLength)}x${Math.round(avgWidth)} cm`;

    // URL de imagen
    const imageUrl = this.getImageUrl(brand, healthGrade as HealthGrade);

    // Precio sugerido (ejemplo: $50 por watt)
    const suggestedPrice = Math.round(avgPower * 50);

    return {
      groupId: groupKey,
      brand,
      model,
      powerRange,
      avgPower: Math.round(avgPower * 10) / 10,
      avgVoltage: Math.round(avgVoltage * 10) / 10,
      healthGrade: healthGrade as HealthGrade,
      avgHealthPercentage: Math.round(avgHealth * 10) / 10,
      dimensions,
      availableCount: panels.length,
      panelIds: panels.map(p => p.id),
      suggestedPrice,
      imageUrl,
    };
  }

  /**
   * Calcula el grado de salud basado en el porcentaje
   */
  private calculateHealthGrade(healthPercentage: number | null): HealthGrade {
    if (!healthPercentage) return HealthGrade.C;
    if (healthPercentage > 85) return HealthGrade.A;
    if (healthPercentage > 75) return HealthGrade.B;
    return HealthGrade.C;
  }

  /**
   * Obtiene el bucket de potencia para agrupar
   */
  private getPowerBucket(power: number | null): string {
    if (!power) return 'unknown';
    if (power < 200) return 'low';
    if (power <= 300) return 'medium';
    return 'high';
  }

  /**
   * Genera URL de imagen de Cloudinary SIN version ID
   * Formato: https://res.cloudinary.com/{cloud_name}/image/upload/{filename}
   * 
   * Cloudinary servirá automáticamente la versión más reciente de la imagen.
   * Esto permite actualizar imágenes sin cambiar el código.
   */
  private getImageUrl(brand: string, healthGrade: HealthGrade): string {
    if (!this.CLOUDINARY_CLOUD_NAME) {
      this.logger.warn('CLOUDINARY_CLOUD_NAME not configured');
      // Fallback a imagen placeholder
      return 'https://via.placeholder.com/400x300/1e40af/ffffff?text=Panel+Solar';
    }
    
    const mappedBrand = this.BRAND_IMAGE_MAP[brand] || 'Generic';
    
    // Formato del nombre: Marca_Grado.png (ej: Sunpower_C.png)
    const filename = `${mappedBrand}_${healthGrade}.png`;
    
    // Construir URL de Cloudinary SIN version ID
    // Cloudinary servirá automáticamente la versión más reciente
    let imageUrl: string;
    
    if (this.CLOUDINARY_FOLDER && this.CLOUDINARY_FOLDER.trim() !== '') {
      // Con carpeta: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{filename}
      imageUrl = `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/${this.CLOUDINARY_FOLDER}/${filename}`;
    } else {
      // Sin carpeta (raíz): https://res.cloudinary.com/{cloud_name}/image/upload/{filename}
      imageUrl = `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/${filename}`;
    }
    
    this.logger.debug(`Generated image URL for ${brand} grade ${healthGrade}: ${imageUrl}`);
    
    return imageUrl;
  }

  /**
   * Mapea un Asset a MarketplacePanelDto
   */
  private mapToMarketplacePanel(asset: any): MarketplacePanelDto {
    return {
      id: asset.id,
      qrCode: asset.qrCode || '',
      brand: asset.brand || '',
      model: asset.model || '',
      measuredPowerWatts: asset.measuredPowerWatts || 0,
      measuredVoltage: asset.measuredVoltage || 0,
      healthPercentage: asset.healthPercentage || 0,
      healthGrade: this.calculateHealthGrade(asset.healthPercentage),
      dimensionLength: asset.dimensionLength || 0,
      dimensionWidth: asset.dimensionWidth || 0,
      dimensionHeight: asset.dimensionHeight || 0,
      refurbishedAt: asset.refurbishedAt,
      refurbishmentNotes: asset.refurbishmentNotes,
    };
  }

  /**
   * Obtiene los filtros disponibles para el frontend
   */
  private async getAvailableFilters(): Promise<any> {
    const panels = await this.prisma.asset.findMany({
      where: {
        status: AssetStatus.LISTED_FOR_SALE,
        measuredPowerWatts: { not: null },
      },
      select: {
        brand: true,
        measuredPowerWatts: true,
        measuredVoltage: true,
        healthPercentage: true,
      },
    });

    const brands = [...new Set(panels.map(p => p.brand).filter(b => b))];
    
    const powers = panels.map(p => p.measuredPowerWatts).filter(p => p != null) as number[];
    const voltages = panels.map(p => p.measuredVoltage).filter(v => v != null) as number[];

    return {
      brands,
      powerRanges: {
        min: powers.length > 0 ? Math.min(...powers) : 0,
        max: powers.length > 0 ? Math.max(...powers) : 0,
      },
      voltageRanges: {
        min: voltages.length > 0 ? Math.min(...voltages) : 0,
        max: voltages.length > 0 ? Math.max(...voltages) : 0,
      },
      healthGrades: [HealthGrade.A, HealthGrade.B, HealthGrade.C],
    };
  }
}
