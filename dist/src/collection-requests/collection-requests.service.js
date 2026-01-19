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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollectionRequestsService = class CollectionRequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createCollectionRequestDto) {
        return this.prisma.collectionRequest.create({
            data: createCollectionRequestDto,
        });
    }
    async findAll(status, assignedCollectorId) {
        const where = {};
        if (status) {
            const statuses = status.split(',').map((s) => s.trim());
            where.status = { in: statuses };
        }
        if (assignedCollectorId) {
            where.assignedCollectorId = assignedCollectorId;
        }
        return this.prisma.collectionRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { assets: true },
        });
    }
    findOne(id) {
        return this.prisma.collectionRequest.findUnique({
            where: { id },
            include: { assets: true },
        });
    }
    async update(id, updateData) {
        const dataToUpdate = { ...updateData };
        if (updateData.assignedCollectorEmail) {
            const collector = await this.prisma.user.findUnique({
                where: { email: updateData.assignedCollectorEmail },
            });
            if (!collector) {
                throw new common_1.NotFoundException(`Usuario con email ${updateData.assignedCollectorEmail} no encontrado`);
            }
            dataToUpdate.assignedCollectorId = collector.id;
            delete dataToUpdate.assignedCollectorEmail;
        }
        if (dataToUpdate.assignedCollectorId) {
            const collector = await this.prisma.user.findUnique({
                where: { id: dataToUpdate.assignedCollectorId },
            });
            if (!collector) {
                throw new common_1.NotFoundException(`Usuario con ID ${dataToUpdate.assignedCollectorId} no encontrado`);
            }
        }
        return this.prisma.collectionRequest.update({
            where: { id },
            data: dataToUpdate,
            include: {
                assets: true,
                assignedCollector: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
    }
    async getCollectorHistory(collectorId, status) {
        const where = {
            assignedCollectorId: collectorId,
        };
        if (status) {
            const statuses = status.split(',').map((s) => s.trim());
            where.status = { in: statuses };
        }
        else {
            where.status = { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] };
        }
        const requests = await this.prisma.collectionRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                assets: {
                    select: {
                        id: true,
                        status: true,
                        brand: true,
                        model: true,
                    },
                },
            },
        });
        return requests.map((request) => ({
            id: request.id,
            pickupAddress: request.pickupAddress,
            city: request.city,
            postalCode: request.postalCode,
            contactName: request.contactName,
            contactPhone: request.contactPhone,
            panelType: request.panelType,
            estimatedCount: request.estimatedCount,
            actualCount: request.assets.length,
            status: request.status,
            createdAt: request.createdAt,
            completedAt: request.completedAt,
            assets: request.assets,
        }));
    }
    async getCollectorHistoryByEmail(email, status) {
        const collector = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!collector) {
            throw new common_1.NotFoundException(`Usuario con email ${email} no encontrado`);
        }
        return this.getCollectorHistory(collector.id, status);
    }
    async getCollectorStats(collectorId) {
        const [completed, inProgress, totalAssets] = await Promise.all([
            this.prisma.collectionRequest.count({
                where: {
                    assignedCollectorId: collectorId,
                    status: 'COMPLETED',
                },
            }),
            this.prisma.collectionRequest.count({
                where: {
                    assignedCollectorId: collectorId,
                    status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
                },
            }),
            this.prisma.asset.count({
                where: {
                    collectionRequest: {
                        assignedCollectorId: collectorId,
                    },
                },
            }),
        ]);
        const estimatedWeightKg = totalAssets * 20;
        const estimatedWeightTons = estimatedWeightKg / 1000;
        return {
            completedCollections: completed,
            activeCollections: inProgress,
            totalPanelsCollected: totalAssets,
            estimatedWeightKg,
            estimatedWeightTons: Math.round(estimatedWeightTons * 10) / 10,
        };
    }
};
exports.CollectionRequestsService = CollectionRequestsService;
exports.CollectionRequestsService = CollectionRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollectionRequestsService);
//# sourceMappingURL=collection-requests.service.js.map