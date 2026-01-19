"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceModule = void 0;
const common_1 = require("@nestjs/common");
const marketplace_service_1 = require("./marketplace.service");
const marketplace_controller_1 = require("./marketplace.controller");
const materials_marketplace_service_1 = require("./materials-marketplace.service");
const materials_marketplace_controller_1 = require("./materials-marketplace.controller");
const panels_marketplace_service_1 = require("./panels-marketplace.service");
const panels_marketplace_controller_1 = require("./panels-marketplace.controller");
const art_marketplace_service_1 = require("./art-marketplace.service");
const art_marketplace_controller_1 = require("./art-marketplace.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const blockchain_module_1 = require("../blockchain/blockchain.module");
let MarketplaceModule = class MarketplaceModule {
};
exports.MarketplaceModule = MarketplaceModule;
exports.MarketplaceModule = MarketplaceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, blockchain_module_1.BlockchainModule],
        controllers: [marketplace_controller_1.MarketplaceController, materials_marketplace_controller_1.MaterialsMarketplaceController, panels_marketplace_controller_1.PanelsMarketplaceController, art_marketplace_controller_1.ArtMarketplaceController],
        providers: [marketplace_service_1.MarketplaceService, materials_marketplace_service_1.MaterialsMarketplaceService, panels_marketplace_service_1.PanelsMarketplaceService, art_marketplace_service_1.ArtMarketplaceService],
        exports: [marketplace_service_1.MarketplaceService, materials_marketplace_service_1.MaterialsMarketplaceService, panels_marketplace_service_1.PanelsMarketplaceService, art_marketplace_service_1.ArtMarketplaceService],
    })
], MarketplaceModule);
//# sourceMappingURL=marketplace.module.js.map