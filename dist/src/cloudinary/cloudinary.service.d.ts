import { UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    private readonly logger;
    constructor();
    uploadImage(file: Express.Multer.File, folder?: string): Promise<UploadApiResponse>;
    deleteImage(publicId: string): Promise<any>;
    extractPublicId(url: string): string | null;
    getTransformedUrl(publicId: string, options?: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string;
    }): string;
}
