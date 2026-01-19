"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    logger = new common_1.Logger(CloudinaryService_1.name);
    constructor() {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        this.logger.log('Cloudinary configured');
    }
    async uploadImage(file, folder = 'rafiqui') {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: folder,
                resource_type: 'auto',
                transformation: [
                    { width: 1920, height: 1080, crop: 'limit' },
                    { quality: 'auto:good' },
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Error uploading to Cloudinary', error);
                    return reject(error);
                }
                if (result) {
                    this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
                    resolve(result);
                }
            });
            uploadStream.end(file.buffer);
        });
    }
    async deleteImage(publicId) {
        try {
            const result = await cloudinary_1.v2.uploader.destroy(publicId);
            this.logger.log(`Image deleted: ${publicId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Error deleting image: ${publicId}`, error);
            throw error;
        }
    }
    extractPublicId(url) {
        try {
            const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
            return matches ? matches[1] : null;
        }
        catch (error) {
            this.logger.error('Error extracting public_id from URL', error);
            return null;
        }
    }
    getTransformedUrl(publicId, options = {}) {
        return cloudinary_1.v2.url(publicId, {
            width: options.width || 800,
            height: options.height || 600,
            crop: options.crop || 'fill',
            quality: options.quality || 'auto',
            fetch_format: 'auto',
        });
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map