import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [AssetsController],
  providers: [AssetsService]
})
export class AssetsModule {}
