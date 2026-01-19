import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NFTAttribute {
  @ApiProperty({ description: 'Tipo de atributo (trait_type)' })
  trait_type: string;

  @ApiProperty({ description: 'Valor del atributo' })
  value: string | number;

  @ApiPropertyOptional({ description: 'Tipo de display (number, date, etc.)' })
  display_type?: string;
}

export class NFTMetadataDto {
  @ApiProperty({ description: 'Nombre del NFT' })
  name: string;

  @ApiProperty({ description: 'Descripción del NFT' })
  description: string;

  @ApiProperty({ description: 'URL de la imagen del NFT' })
  image: string;

  @ApiPropertyOptional({ description: 'URL externa del NFT' })
  external_url?: string;

  @ApiPropertyOptional({ description: 'Color de fondo (hex sin #)' })
  background_color?: string;

  @ApiPropertyOptional({ description: 'URL de animación (video, audio, etc.)' })
  animation_url?: string;

  @ApiProperty({ description: 'Atributos del NFT', type: [NFTAttribute] })
  attributes: NFTAttribute[];
}
