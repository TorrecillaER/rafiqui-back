import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MaterialsMarketplaceService } from './materials-marketplace.service';
import { MaterialsMarketplaceController } from './materials-marketplace.controller';
import { PanelsMarketplaceService } from './panels-marketplace.service';
import { PanelsMarketplaceController } from './panels-marketplace.controller';
import { ArtMarketplaceService } from './art-marketplace.service';
import { ArtMarketplaceController } from './art-marketplace.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [MarketplaceController, MaterialsMarketplaceController, PanelsMarketplaceController, ArtMarketplaceController],
  providers: [MarketplaceService, MaterialsMarketplaceService, PanelsMarketplaceService, ArtMarketplaceService],
  exports: [MarketplaceService, MaterialsMarketplaceService, PanelsMarketplaceService, ArtMarketplaceService],
})
export class MarketplaceModule {}
