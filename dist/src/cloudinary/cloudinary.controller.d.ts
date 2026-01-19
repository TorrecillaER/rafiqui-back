import { CloudinaryService } from './cloudinary.service';
export declare class CloudinaryController {
    private readonly cloudinaryService;
    constructor(cloudinaryService: CloudinaryService);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        url: string;
        publicId: string;
        width: number;
        height: number;
        format: string;
        bytes: number;
    }>;
}
