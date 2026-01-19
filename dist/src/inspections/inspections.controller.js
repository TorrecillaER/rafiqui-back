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
exports.InspectionsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const inspections_service_1 = require("./inspections.service");
const create_inspection_dto_1 = require("./dto/create-inspection.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let InspectionsController = class InspectionsController {
    inspectionsService;
    constructor(inspectionsService) {
        this.inspectionsService = inspectionsService;
    }
    create(createInspectionDto, user) {
        return this.inspectionsService.create({
            ...createInspectionDto,
            inspectorId: user.userId,
        });
    }
    findAll(myInspections, user) {
        const inspectorId = myInspections === 'true' ? user?.userId : undefined;
        return this.inspectionsService.findAll(inspectorId);
    }
    getMyStats(user) {
        return this.inspectionsService.getStats(user.userId);
    }
    async getInspectorStats(inspectorId) {
        return this.inspectionsService.getInspectorStats(inspectorId);
    }
    async getInspectorStatsByEmail(email) {
        return this.inspectionsService.getInspectorStatsByEmail(email);
    }
    async getRecentInspections(inspectorId, limit) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.inspectionsService.getRecentInspections(inspectorId, limitNum);
    }
    findOne(id) {
        return this.inspectionsService.findOne(id);
    }
};
exports.InspectionsController = InspectionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una nueva inspección' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inspection_dto_1.CreateInspectionDto, Object]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar inspecciones' }),
    (0, swagger_1.ApiQuery)({ name: 'myInspections', required: false, description: 'Si es true, filtra solo las inspecciones del usuario autenticado' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('myInspections')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas del inspector autenticado' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)('stats/:inspectorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas detalladas de un inspector' }),
    (0, swagger_1.ApiParam)({ name: 'inspectorId', description: 'ID del inspector' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estadísticas del inspector obtenidas exitosamente',
        schema: {
            example: {
                recyclingCount: 45,
                reuseCount: 120,
                artCount: 8,
                totalInspections: 173,
                monthlyGoalProgress: 0.65,
                impactHighlight: '173 paneles',
                impactMessage: 'inspeccionados contribuyendo a la economia circular de energia solar.',
                inspectorName: 'Juan Pérez',
                stationId: '#03',
            },
        },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('inspectorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InspectionsController.prototype, "getInspectorStats", null);
__decorate([
    (0, common_1.Get)('stats-by-email/:email'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas detalladas por email del inspector' }),
    (0, swagger_1.ApiParam)({ name: 'email', description: 'Email del inspector' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estadísticas del inspector obtenidas exitosamente'
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InspectionsController.prototype, "getInspectorStatsByEmail", null);
__decorate([
    (0, common_1.Get)('recent/:inspectorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener últimas inspecciones de un inspector' }),
    (0, swagger_1.ApiParam)({ name: 'inspectorId', description: 'ID del inspector' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Número de inspecciones a retornar (por defecto: 10)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Últimas inspecciones obtenidas exitosamente',
        schema: {
            example: [
                {
                    id: 'ID-A1B2',
                    panelId: 'uuid-panel-1',
                    panelType: 'SunPower X22',
                    status: 'approved',
                    result: 'REUSE',
                    inspectedAt: '2024-01-15T10:30:00.000Z',
                },
            ],
        },
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('inspectorId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InspectionsController.prototype, "getRecentInspections", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener una inspección por ID' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "findOne", null);
exports.InspectionsController = InspectionsController = __decorate([
    (0, swagger_1.ApiTags)('Inspections'),
    (0, common_1.Controller)('inspections'),
    __metadata("design:paramtypes", [inspections_service_1.InspectionsService])
], InspectionsController);
//# sourceMappingURL=inspections.controller.js.map