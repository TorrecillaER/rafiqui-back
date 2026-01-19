import { Module } from '@nestjs/common';
import { ArtService } from './art.service';
import { ArtController } from './art.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, BlockchainModule, CloudinaryModule],
  providers: [ArtService],
  controllers: [ArtController],
  exports: [ArtService],
})
export class ArtModule {}
