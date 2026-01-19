import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @ApiOperation({ summary: 'Subir imagen a Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({ name: 'folder', required: false, description: 'Carpeta en Cloudinary (default: rafiqui)' })
  @ApiResponse({ status: 200, description: 'Imagen subida exitosamente' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes (JPEG, PNG, WEBP)');
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es demasiado grande (máximo 10MB)');
    }

    const result = await this.cloudinaryService.uploadImage(file, folder || 'rafiqui');

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }
}
