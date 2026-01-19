import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import {
  MarketplaceFiltersDto,
  MarketplaceResponseDto,
  MarketplacePanelsResponseDto,
} from '../assets/dto/marketplace.dto';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('listings')
  @ApiOperation({ 
    summary: 'Obtener paneles agrupados para marketplace',
    description: 'Retorna paneles LISTED_FOR_SALE agrupados por marca, grado de salud y rango de potencia. Ideal para mostrar cards en el marketplace.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupos de paneles disponibles',
    type: MarketplaceResponseDto 
  })
  async getListings(
    @Query() filters: MarketplaceFiltersDto,
  ): Promise<MarketplaceResponseDto> {
    return this.marketplaceService.getMarketplaceListings(filters);
  }

  @Get('panels')
  @ApiOperation({ 
    summary: 'Obtener paneles individuales para marketplace',
    description: 'Retorna paneles LISTED_FOR_SALE sin agrupar. Útil para vista de lista detallada.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de paneles individuales',
    type: MarketplacePanelsResponseDto 
  })
  async getPanels(
    @Query() filters: MarketplaceFiltersDto,
  ): Promise<MarketplacePanelsResponseDto> {
    return this.marketplaceService.getMarketplacePanels(filters);
  }
}
