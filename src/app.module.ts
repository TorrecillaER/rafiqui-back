import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CollectionRequestsModule } from './collection-requests/collection-requests.module';
import { AssetsModule } from './assets/assets.module';
import { InspectionsModule } from './inspections/inspections.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ArtModule } from './art/art.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { RecycleModule } from './recycle/recycle.module';
import { MetadataModule } from './metadata/metadata.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, CollectionRequestsModule, AssetsModule, InspectionsModule, StatisticsModule, ArtModule, AuthModule, BlockchainModule, CloudinaryModule, MarketplaceModule, RecycleModule, MetadataModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
