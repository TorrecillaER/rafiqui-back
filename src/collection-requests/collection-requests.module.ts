import { Module } from '@nestjs/common';
import { CollectionRequestsController } from './collection-requests.controller';
import { CollectionRequestsService } from './collection-requests.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionRequestsController],
  providers: [CollectionRequestsService]
})
export class CollectionRequestsModule {}
