"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtModule = void 0;
const common_1 = require("@nestjs/common");
const art_service_1 = require("./art.service");
const art_controller_1 = require("./art.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const blockchain_module_1 = require("../blockchain/blockchain.module");
const cloudinary_module_1 = require("../cloudinary/cloudinary.module");
let ArtModule = class ArtModule {
};
exports.ArtModule = ArtModule;
exports.ArtModule = ArtModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, blockchain_module_1.BlockchainModule, cloudinary_module_1.CloudinaryModule],
        providers: [art_service_1.ArtService],
        controllers: [art_controller_1.ArtController],
        exports: [art_service_1.ArtService],
    })
], ArtModule);
//# sourceMappingURL=art.module.js.map