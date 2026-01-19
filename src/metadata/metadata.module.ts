import { Module } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
