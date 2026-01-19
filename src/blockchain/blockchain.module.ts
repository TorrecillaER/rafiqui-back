import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { MaterialsBlockchainService } from './materials-blockchain.service';

@Module({
  providers: [BlockchainService, MaterialsBlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService, MaterialsBlockchainService],
})
export class BlockchainModule {}
