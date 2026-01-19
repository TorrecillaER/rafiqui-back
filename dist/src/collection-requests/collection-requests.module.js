"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const collection_requests_controller_1 = require("./collection-requests.controller");
const collection_requests_service_1 = require("./collection-requests.service");
const prisma_module_1 = require("../prisma/prisma.module");
let CollectionRequestsModule = class CollectionRequestsModule {
};
exports.CollectionRequestsModule = CollectionRequestsModule;
exports.CollectionRequestsModule = CollectionRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [collection_requests_controller_1.CollectionRequestsController],
        providers: [collection_requests_service_1.CollectionRequestsService]
    })
], CollectionRequestsModule);
//# sourceMappingURL=collection-requests.module.js.map