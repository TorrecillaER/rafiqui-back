import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    this.logger.log('Cloudinary configured');
  }

  /**
   * Sube una imagen a Cloudinary desde un buffer
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'rafiqui',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error('Error uploading to Cloudinary', error);
            return reject(error);
          }
          if (result) {
            this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
            resolve(result);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Elimina una imagen de Cloudinary usando su public_id
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting image: ${publicId}`, error);
      throw error;
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      this.logger.error('Error extracting public_id from URL', error);
      return null;
    }
  }

  /**
   * Genera una URL transformada de Cloudinary
   */
  getTransformedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      width: options.width || 800,
      height: options.height || 600,
      crop: options.crop || 'fill',
      quality: options.quality || 'auto',
      fetch_format: 'auto',
    });
  }
}
