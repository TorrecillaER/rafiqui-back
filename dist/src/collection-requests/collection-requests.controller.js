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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionRequestsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const collection_requests_service_1 = require("./collection-requests.service");
const create_collection_request_dto_1 = require("./dto/create-collection-request.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const update_collection_request_dto_1 = require("./dto/update-collection-request.dto");
let CollectionRequestsController = class CollectionRequestsController {
    collectionRequestsService;
    constructor(collectionRequestsService) {
        this.collectionRequestsService = collectionRequestsService;
    }
    create(createCollectionRequestDto) {
        return this.collectionRequestsService.create(createCollectionRequestDto);
    }
    findAll(status, myRequests, user) {
        const assignedCollectorId = myRequests === 'true' ? user?.userId : undefined;
        return this.collectionRequestsService.findAll(status, assignedCollectorId);
    }
    async getCollectorHistory(collectorId, status) {
        return this.collectionRequestsService.getCollectorHistory(collectorId, status);
    }
    async getCollectorHistoryByEmail(email, status) {
        return this.collectionRequestsService.getCollectorHistoryByEmail(email, status);
    }
    async getCollectorStats(collectorId) {
        return this.collectionRequestsService.getCollectorStats(collectorId);
    }
    findOne(id) {
        return this.collectionRequestsService.findOne(id);
    }
    update(id, updateData, user) {
        if (updateData.assignToMe && !updateData.assignedCollectorId && !updateData.assignedCollectorEmail) {
            updateData.assignedCollectorId = user.userId;
        }
        return this.collectionRequestsService.update(id, updateData);
    }
};
exports.CollectionRequestsController = CollectionRequestsController;
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_collection_request_dto_1.CreateCollectionRequestDto]),
    __metadata("design:returntype", void 0)
], CollectionRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener solicitudes con filtros opcionales' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Estados separados por coma (e.g. PENDING,ASSIGNED)' }),
    (0, swagger_1.ApiQuery)({ name: 'myRequests', required: false, description: 'Si es true, filtra solo las solicitudes asignadas al usuario autenticado' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('myRequests')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CollectionRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('history/:collectorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de recolecciones de un collector' }),
    (0, swagger_1.ApiParam)({ name: 'collectorId', description: 'ID del collector' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Estados separados por coma (por defecto: COMPLETED)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Historial de recolecciones obtenido exitosamente'
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('collectorId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollectionRequestsController.prototype, "getCollectorHistory", null);
__decorate([
    (0, common_1.Get)('history-by-email/:email'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de recolecciones por email del collector' }),
    (0, swagger_1.ApiParam)({ name: 'email', description: 'Email del collector' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Estados separados por coma (por defecto: COMPLETED)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Historial de recolecciones obtenido exitosamente'
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollectionRequestsController.prototype, "getCollectorHistoryByEmail", null);
__decorate([
    (0, common_1.Get)('stats/:collectorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas de un collector' }),
    (0, swagger_1.ApiParam)({ name: 'collectorId', description: 'ID del collector' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estadísticas del collector obtenidas exitosamente',
        schema: {
            example: {
                completedCollections: 15,
                activeCollections: 2,
                totalPanelsCollected: 850,
                estimatedWeightKg: 17000,
                estimatedWeightTons: 17,
            },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('collectorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollectionRequestsController.prototype, "getCollectorStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener una solicitud por ID' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollectionRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar una solicitud' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_collection_request_dto_1.UpdateCollectionRequestDto, Object]),
    __metadata("design:returntype", void 0)
], CollectionRequestsController.prototype, "update", null);
exports.CollectionRequestsController = CollectionRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Collection Requests'),
    (0, common_1.Controller)('collection-requests'),
    __metadata("design:paramtypes", [collection_requests_service_1.CollectionRequestsService])
], CollectionRequestsController);
//# sourceMappingURL=collection-requests.controller.js.map