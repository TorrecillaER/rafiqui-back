"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecycleModule = void 0;
const common_1 = require("@nestjs/common");
const recycle_controller_1 = require("./recycle.controller");
const recycle_service_1 = require("./recycle.service");
const prisma_module_1 = require("../prisma/prisma.module");
const blockchain_module_1 = require("../blockchain/blockchain.module");
let RecycleModule = class RecycleModule {
};
exports.RecycleModule = RecycleModule;
exports.RecycleModule = RecycleModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, blockchain_module_1.BlockchainModule],
        controllers: [recycle_controller_1.RecycleController],
        providers: [recycle_service_1.RecycleService],
        exports: [recycle_service_1.RecycleService],
    })
], RecycleModule);
//# sourceMappingURL=recycle.module.js.map