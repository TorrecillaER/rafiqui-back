import { Module } from '@nestjs/common';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TriageEngineService } from './triage-engine.service';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [InspectionsController],
  providers: [InspectionsService, TriageEngineService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
