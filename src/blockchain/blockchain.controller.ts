import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { BlockchainService, PanelStatus } from './blockchain.service';
import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPanelDto {
  @ApiProperty({ description: 'Código QR único del panel' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({ description: 'Marca del panel' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ description: 'Modelo del panel' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'Ubicación actual' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ description: 'Hash IPFS con metadatos adicionales' })
  @IsOptional()
  @IsString()
  ipfsHash?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ description: 'Código QR del panel' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({ enum: PanelStatus, description: 'Nuevo estado del panel' })
  @IsEnum(PanelStatus)
  status: PanelStatus;

  @ApiProperty({ description: 'Nueva ubicación' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ description: 'Hash IPFS actualizado' })
  @IsOptional()
  @IsString()
  ipfsHash?: string;
}

export class MintArtDto {
  @ApiProperty({ description: 'Código QR del panel a convertir en arte' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({ description: 'URI del token de metadatos' })
  @IsString()
  @IsNotEmpty()
  tokenURI: string;

  @ApiProperty({ description: 'Dirección de la wallet del propietario' })
  @IsString()
  @IsNotEmpty()
  ownerAddress: string;
}

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('status')
  getStatus() {
    return {
      connected: this.blockchainService.isConnected(),
    };
  }

  @Post('panel')
  async registerPanel(@Body() dto: RegisterPanelDto) {
    try {
      const txHash = await this.blockchainService.registerPanel(
        dto.qrCode,
        dto.brand,
        dto.model,
        dto.location,
        dto.ipfsHash,
      );
      return { success: true, txHash };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('panel/status')
  async updateStatus(@Body() dto: UpdateStatusDto) {
    try {
      const txHash = await this.blockchainService.updatePanelStatus(
        dto.qrCode,
        dto.status,
        dto.location,
        dto.ipfsHash,
      );
      return { success: true, txHash };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('art/mint')
  async mintArt(@Body() dto: MintArtDto) {
    try {
      const result = await this.blockchainService.mintArtNFT(
        dto.qrCode,
        dto.tokenURI,
        dto.ownerAddress,
      );
      return { success: true, ...result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('panel/:qrCode')
  async getPanel(@Param('qrCode') qrCode: string) {
    const panel = await this.blockchainService.getPanel(qrCode);
    if (!panel) {
      throw new HttpException('Panel not found', HttpStatus.NOT_FOUND);
    }
    return panel;
  }

  @Get('panel/:qrCode/history')
  async getHistory(@Param('qrCode') qrCode: string) {
    return this.blockchainService.getPanelHistory(qrCode);
  }
}
