import { Controller, Get, Post, Put, Delete, Body, Param, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArtService } from './art.service';
import { CreateArtPieceDto, UpdateArtPieceDto, ArtCategory } from './dto/art.dto';
import { PublishArtDto, PublishArtResponseDto, FindArtCandidateResponseDto } from './dto/publish-art.dto';
import { GalleryFiltersDto, GalleryResponseDto, GalleryStatsDto } from './dto/gallery.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ArtPieceResponseDto } from './dto/art.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('art')
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
        format: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadArtImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes (JPEG, PNG, WEBP)');
    }

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es demasiado grande (máximo 15MB)');
    }

    const result = await this.cloudinaryService.uploadImage(file, 'Art_Gallery');

    return {
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva obra de arte' })
  @ApiResponse({ status: 201, type: ArtPieceResponseDto })
  create(@Body() dto: CreateArtPieceDto) {
    return this.artService.create(dto);
  }

  @Get('gallery')
  @ApiOperation({ 
    summary: 'Obtener galería de arte para marketplace',
    description: 'Lista obras de arte con filtros, paginación y ordenamiento para el marketplace web'
  })
  @ApiResponse({ status: 200, type: GalleryResponseDto })
  getGallery(@Query() filters: GalleryFiltersDto) {
    return this.artService.getGallery(filters);
  }

  @Get('gallery/stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de la galería de arte',
    description: 'Estadísticas detalladas incluyendo total, disponibles, vendidas, valor total, por categoría y top artistas'
  })
  @ApiResponse({ status: 200, type: GalleryStatsDto })
  getGalleryStats() {
    return this.artService.getGalleryStats();
  }

  @Get('gallery/featured')
  @ApiOperation({ 
    summary: 'Obtener obra de arte destacada',
    description: 'Retorna la obra de arte más reciente disponible para destacar en el marketplace'
  })
  @ApiResponse({ status: 200, type: ArtPieceResponseDto, description: 'Obra destacada' })
  @ApiResponse({ status: 404, description: 'No hay obras disponibles' })
  getFeaturedArt() {
    return this.artService.getFeaturedArt();
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las obras de arte (opcionalmente por categoría)' })
  @ApiQuery({ name: 'category', enum: ArtCategory, required: false })
  @ApiResponse({ status: 200, type: [ArtPieceResponseDto] })
  findAll(@Query('category') category?: ArtCategory) {
    return this.artService.findAll(category);
  }

  @Get('available')
  @ApiOperation({ summary: 'Listar solo obras disponibles' })
  @ApiQuery({ name: 'category', enum: ArtCategory, required: false })
  @ApiResponse({ status: 200, type: [ArtPieceResponseDto] })
  findAvailable(@Query('category') category?: ArtCategory) {
    return this.artService.findAvailable(category);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del módulo de arte' })
  getStats() {
    return this.artService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una obra de arte' })
  @ApiResponse({ status: 200, type: ArtPieceResponseDto })
  findOne(@Param('id') id: string) {
    return this.artService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una obra de arte' })
  @ApiResponse({ status: 200, type: ArtPieceResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateArtPieceDto) {
    return this.artService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una obra de arte' })
  remove(@Param('id') id: string) {
    return this.artService.remove(id);
  }

  @Post('from-asset/:assetId')
  @ApiOperation({ summary: 'Crear obra de arte a partir de un asset existente' })
  @ApiResponse({ status: 201, type: ArtPieceResponseDto })
  createFromAsset(
    @Param('assetId') assetId: string,
    @Body() dto: CreateArtPieceDto // Using CreateArtPieceDto but sourceAssetId will be ignored/overwritten
  ) {
    // We create a new object excluding sourceAssetId from the body if present, relying on the service to handle it
    const { sourceAssetId, ...rest } = dto;
    return this.artService.createFromAsset(assetId, rest as any);
  }

  @Get('candidate/:qrCode')
  @ApiOperation({ 
    summary: 'Buscar panel candidato a arte por QR Code',
    description: 'Verifica si un panel escaneado es candidato a arte y está disponible para publicar'
  })
  @ApiResponse({ status: 200, type: FindArtCandidateResponseDto })
  findArtCandidate(@Param('qrCode') qrCode: string) {
    return this.artService.findArtCandidateByQrCode(qrCode);
  }

  @Post('publish')
  @ApiOperation({ 
    summary: 'Publicar obra de arte desde panel candidato',
    description: 'Crea una obra de arte a partir de un panel ART_CANDIDATE y cambia su estado a ART_LISTED_FOR_SALE'
  })
  @ApiResponse({ status: 201, type: PublishArtResponseDto })
  publishArt(@Body() dto: PublishArtDto) {
    return this.artService.publishArt(dto);
  }
}

