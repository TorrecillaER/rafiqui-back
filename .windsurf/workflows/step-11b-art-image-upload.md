---
description: Agregar endpoint de subida de imagen para obras de arte a Cloudinary
---

# Step 11b: Subida de Imagen de Arte a Cloudinary

Este workflow extiende el módulo de Arte para incluir un endpoint dedicado a subir imágenes de obras de arte a Cloudinary. La imagen se sube primero, se obtiene la URL, y luego se usa esa URL al publicar la obra.

## Prerrequisitos

- [ ] Módulo de Arte creado (step-11)
- [ ] CloudinaryModule configurado y funcionando
- [ ] Variables de entorno de Cloudinary configuradas

---

## Paso 1: Importar CloudinaryModule en ArtModule

Modificar `src/art/art.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ArtService } from './art.service';
import { ArtController } from './art.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, BlockchainModule, CloudinaryModule],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
```

---

## Paso 2: Agregar Endpoint de Subida de Imagen en ArtController

Modificar `src/art/art.controller.ts`, agregar el endpoint:

```typescript
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UploadedFile, 
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ArtService } from './art.service';
import { PublishArtDto, PublishArtResponseDto } from './dto/publish-art.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

// Carpeta específica para imágenes de arte en Cloudinary
const ART_FOLDER = 'Art_Gallery';

@ApiTags('Art')
@Controller('art')
export class ArtController {
  constructor(
    private readonly artService: ArtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload-image')
  @ApiOperation({ summary: 'Subir imagen de obra de arte a Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de la obra de arte (JPEG, PNG, WEBP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Imagen subida exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        imageUrl: { type: 'string' },
        publicId: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadArtImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes (JPEG, PNG, WEBP)');
    }

    // Validar tamaño (máximo 15MB para arte de alta calidad)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es demasiado grande (máximo 15MB)');
    }

    const result = await this.cloudinaryService.uploadImage(file, ART_FOLDER);

    return {
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publicar obra de arte desde panel candidato' })
  @ApiResponse({ status: 201, description: 'Obra publicada exitosamente', type: PublishArtResponseDto })
  @ApiResponse({ status: 400, description: 'Panel no es candidato a arte o ya tiene obra' })
  @ApiResponse({ status: 404, description: 'Panel no encontrado' })
  async publishArt(@Body() dto: PublishArtDto): Promise<PublishArtResponseDto> {
    return this.artService.publishArt(dto);
  }

  @Get('candidate/:qrCode')
  @ApiOperation({ summary: 'Buscar panel candidato a arte por QR Code' })
  @ApiResponse({ status: 200, description: 'Panel encontrado' })
  async findArtCandidate(@Param('qrCode') qrCode: string) {
    return this.artService.findArtCandidateByQrCode(qrCode);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las obras de arte disponibles' })
  async getAvailableArt() {
    return this.artService.getAvailableArt();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener obra de arte por ID' })
  async getArtById(@Param('id') id: string) {
    return this.artService.getArtById(id);
  }
}
```

---

## Paso 3: Exportar CloudinaryService desde CloudinaryModule

Verificar que `src/cloudinary/cloudinary.module.ts` exporte el servicio:

```typescript
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';

@Module({
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],  // IMPORTANTE: debe estar exportado
})
export class CloudinaryModule {}
```

---

## Paso 4: Crear Carpeta en Cloudinary

Crear la carpeta `Art_Gallery` en Cloudinary para organizar las imágenes de arte:

1. Ir a Cloudinary Dashboard
2. Media Library → Create folder → `Art_Gallery`

O las imágenes se crearán automáticamente en esa carpeta al subir.

---

## Verificación

### Probar subida de imagen

```bash
curl -X POST http://localhost:4000/art/upload-image \
  -F "file=@/path/to/artwork.jpg"
```

Respuesta esperada:
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/rafiqui/image/upload/v1234567890/Art_Gallery/abc123.jpg",
  "publicId": "Art_Gallery/abc123",
  "width": 1920,
  "height": 1080,
  "format": "jpg"
}
```

### Probar flujo completo

1. Subir imagen:
```bash
IMAGE_RESPONSE=$(curl -s -X POST http://localhost:4000/art/upload-image \
  -F "file=@artwork.jpg")
IMAGE_URL=$(echo $IMAGE_RESPONSE | jq -r '.imageUrl')
```

2. Publicar obra con la URL:
```bash
curl -X POST http://localhost:4000/art/publish \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset-id-here",
    "title": "Sol Renacido",
    "artist": "María García",
    "description": "Escultura de panel solar reciclado",
    "priceMxn": 15000,
    "imageUrl": "'$IMAGE_URL'"
  }'
```

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/art/art.module.ts` | Importar CloudinaryModule |
| `src/art/art.controller.ts` | Agregar endpoint `POST /art/upload-image` |
| `src/cloudinary/cloudinary.module.ts` | Verificar export de CloudinaryService |
