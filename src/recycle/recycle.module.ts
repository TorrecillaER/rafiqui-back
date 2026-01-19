import { Module } from '@nestjs/common';
import { RecycleController } from './recycle.controller';
import { RecycleService } from './recycle.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [RecycleController],
  providers: [RecycleService],
  exports: [RecycleService],
})
export class RecycleModule {}
