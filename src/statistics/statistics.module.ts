import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StatisticsService],
  controllers: [StatisticsController]
})
export class StatisticsModule {}
