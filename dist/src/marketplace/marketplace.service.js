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
var MarketplaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const marketplace_dto_1 = require("../assets/dto/marketplace.dto");
let MarketplaceService = MarketplaceService_1 = class MarketplaceService {
    prisma;
    logger = new common_1.Logger(MarketplaceService_1.name);
    CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    CLOUDINARY_FOLDER = process.env.CLOUDINARY_MARKETPLACE_FOLDER || '';
    BRAND_IMAGE_MAP = {
        'Trina': 'Trina',
        'Trina Solar': 'Trina',
        'Canadian': 'Canadian',
        'Canadian Solar': 'Canadian',
        'JA': 'JA',
        'JA Solar': 'JA',
        'Jinko': 'Jinko',
        'Jinko Solar': 'Jinko',
        'LONGi': 'LONGi',
        'Longi': 'LONGi',
        'SunPower': 'Sunpower',
        'LG': 'LG',
    };
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMarketplaceListings(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where = this.buildWhereClause(filters);
        const allPanels = await this.prisma.asset.findMany({
            where,
            orderBy: this.buildOrderBy(filters),
        });
        this.logger.log(`Found ${allPanels.length} panels matching filters`);
        const groups = this.groupPanels(allPanels);
        const totalGroups = groups.length;
        const totalPages = Math.ceil(totalGroups / limit);
        const skip = (page - 1) * limit;
        const paginatedGroups = groups.slice(skip, skip + limit);
        const availableFilters = await this.getAvailableFilters();
        return {
            groups: paginatedGroups,
            totalPanels: allPanels.length,
            totalGroups,
            page,
            limit,
            totalPages,
            availableFilters,
        };
    }
    async getMarketplacePanels(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = this.buildWhereClause(filters);
        const [panels, total] = await Promise.all([
            this.prisma.asset.findMany({
                where,
                orderBy: this.buildOrderBy(filters),
                skip,
                take: limit,
            }),
            this.prisma.asset.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            panels: panels.map(p => this.mapToMarketplacePanel(p)),
            total,
            page,
            limit,
            totalPages,
        };
    }
    buildWhereClause(filters) {
        const where = {
            status: client_1.AssetStatus.LISTED_FOR_SALE,
            measuredPowerWatts: { not: null },
            measuredVoltage: { not: null },
            healthPercentage: { not: null },
        };
        if (filters.brands) {
            const brandList = filters.brands.split(',').map(b => b.trim());
            where.brand = { in: brandList };
        }
        if (filters.minPower !== undefined || filters.maxPower !== undefined) {
            where.measuredPowerWatts = {};
            if (filters.minPower !== undefined) {
                where.measuredPowerWatts.gte = filters.minPower;
            }
            if (filters.maxPower !== undefined) {
                where.measuredPowerWatts.lte = filters.maxPower;
            }
        }
        if (filters.powerRange) {
            where.measuredPowerWatts = where.measuredPowerWatts || {};
            switch (filters.powerRange) {
                case marketplace_dto_1.PowerRange.LOW:
                    where.measuredPowerWatts.lt = 200;
                    break;
                case marketplace_dto_1.PowerRange.MEDIUM:
                    where.measuredPowerWatts.gte = 200;
                    where.measuredPowerWatts.lte = 300;
                    break;
                case marketplace_dto_1.PowerRange.HIGH:
                    where.measuredPowerWatts.gt = 300;
                    break;
            }
        }
        if (filters.minVoltage !== undefined || filters.maxVoltage !== undefined) {
            where.measuredVoltage = {};
            if (filters.minVoltage !== undefined) {
                where.measuredVoltage.gte = filters.minVoltage;
            }
            if (filters.maxVoltage !== undefined) {
                where.measuredVoltage.lte = filters.maxVoltage;
            }
        }
        if (filters.healthGrade) {
            where.healthPercentage = {};
            switch (filters.healthGrade) {
                case marketplace_dto_1.HealthGrade.A:
                    where.healthPercentage.gt = 85;
                    break;
                case marketplace_dto_1.HealthGrade.B:
                    where.healthPercentage.gt = 75;
                    where.healthPercentage.lte = 85;
                    break;
                case marketplace_dto_1.HealthGrade.C:
                    where.healthPercentage.lte = 75;
                    break;
            }
        }
        if (filters.minLength !== undefined || filters.maxLength !== undefined) {
            where.dimensionLength = {};
            if (filters.minLength !== undefined) {
                where.dimensionLength.gte = filters.minLength;
            }
            if (filters.maxLength !== undefined) {
                where.dimensionLength.lte = filters.maxLength;
            }
        }
        if (filters.minWidth !== undefined || filters.maxWidth !== undefined) {
            where.dimensionWidth = {};
            if (filters.minWidth !== undefined) {
                where.dimensionWidth.gte = filters.minWidth;
            }
            if (filters.maxWidth !== undefined) {
                where.dimensionWidth.lte = filters.maxWidth;
            }
        }
        return where;
    }
    buildOrderBy(filters) {
        const sortBy = filters.sortBy || 'healthPercentage';
        const sortOrder = filters.sortOrder || 'desc';
        return { [sortBy]: sortOrder };
    }
    groupPanels(panels) {
        const groupMap = new Map();
        for (const panel of panels) {
            const healthGrade = this.calculateHealthGrade(panel.healthPercentage);
            const powerBucket = this.getPowerBucket(panel.measuredPowerWatts);
            const groupKey = `${panel.brand}_${healthGrade}_${powerBucket}`;
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, []);
            }
            groupMap.get(groupKey).push(panel);
        }
        const groups = [];
        for (const [groupKey, groupPanels] of groupMap.entries()) {
            const group = this.createGroupDto(groupKey, groupPanels);
            groups.push(group);
        }
        groups.sort((a, b) => {
            if (a.healthGrade !== b.healthGrade) {
                return a.healthGrade.localeCompare(b.healthGrade);
            }
            return b.availableCount - a.availableCount;
        });
        return groups;
    }
    createGroupDto(groupKey, panels) {
        const [brand, healthGrade] = groupKey.split('_');
        const avgPower = panels.reduce((sum, p) => sum + (p.measuredPowerWatts || 0), 0) / panels.length;
        const avgVoltage = panels.reduce((sum, p) => sum + (p.measuredVoltage || 0), 0) / panels.length;
        const avgHealth = panels.reduce((sum, p) => sum + (p.healthPercentage || 0), 0) / panels.length;
        const powers = panels.map(p => p.measuredPowerWatts).filter(p => p != null);
        const minPower = Math.min(...powers);
        const maxPower = Math.max(...powers);
        const powerRange = minPower === maxPower
            ? `${Math.round(minPower)}W`
            : `${Math.round(minPower)}-${Math.round(maxPower)}W`;
        const models = [...new Set(panels.map(p => p.model).filter(m => m))];
        const model = models.length === 1 ? models[0] : 'Varios';
        const avgLength = panels.reduce((sum, p) => sum + (p.dimensionLength || 0), 0) / panels.length;
        const avgWidth = panels.reduce((sum, p) => sum + (p.dimensionWidth || 0), 0) / panels.length;
        const dimensions = `${Math.round(avgLength)}x${Math.round(avgWidth)} cm`;
        const imageUrl = this.getImageUrl(brand, healthGrade);
        const suggestedPrice = Math.round(avgPower * 50);
        return {
            groupId: groupKey,
            brand,
            model,
            powerRange,
            avgPower: Math.round(avgPower * 10) / 10,
            avgVoltage: Math.round(avgVoltage * 10) / 10,
            healthGrade: healthGrade,
            avgHealthPercentage: Math.round(avgHealth * 10) / 10,
            dimensions,
            availableCount: panels.length,
            panelIds: panels.map(p => p.id),
            suggestedPrice,
            imageUrl,
        };
    }
    calculateHealthGrade(healthPercentage) {
        if (!healthPercentage)
            return marketplace_dto_1.HealthGrade.C;
        if (healthPercentage > 85)
            return marketplace_dto_1.HealthGrade.A;
        if (healthPercentage > 75)
            return marketplace_dto_1.HealthGrade.B;
        return marketplace_dto_1.HealthGrade.C;
    }
    getPowerBucket(power) {
        if (!power)
            return 'unknown';
        if (power < 200)
            return 'low';
        if (power <= 300)
            return 'medium';
        return 'high';
    }
    getImageUrl(brand, healthGrade) {
        if (!this.CLOUDINARY_CLOUD_NAME) {
            this.logger.warn('CLOUDINARY_CLOUD_NAME not configured');
            return 'https://via.placeholder.com/400x300/1e40af/ffffff?text=Panel+Solar';
        }
        const mappedBrand = this.BRAND_IMAGE_MAP[brand] || 'Generic';
        const filename = `${mappedBrand}_${healthGrade}.png`;
        let imageUrl;
        if (this.CLOUDINARY_FOLDER && this.CLOUDINARY_FOLDER.trim() !== '') {
            imageUrl = `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/${this.CLOUDINARY_FOLDER}/${filename}`;
        }
        else {
            imageUrl = `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/${filename}`;
        }
        this.logger.debug(`Generated image URL for ${brand} grade ${healthGrade}: ${imageUrl}`);
        return imageUrl;
    }
    mapToMarketplacePanel(asset) {
        return {
            id: asset.id,
            qrCode: asset.qrCode || '',
            brand: asset.brand || '',
            model: asset.model || '',
            measuredPowerWatts: asset.measuredPowerWatts || 0,
            measuredVoltage: asset.measuredVoltage || 0,
            healthPercentage: asset.healthPercentage || 0,
            healthGrade: this.calculateHealthGrade(asset.healthPercentage),
            dimensionLength: asset.dimensionLength || 0,
            dimensionWidth: asset.dimensionWidth || 0,
            dimensionHeight: asset.dimensionHeight || 0,
            refurbishedAt: asset.refurbishedAt,
            refurbishmentNotes: asset.refurbishmentNotes,
        };
    }
    async getAvailableFilters() {
        const panels = await this.prisma.asset.findMany({
            where: {
                status: client_1.AssetStatus.LISTED_FOR_SALE,
                measuredPowerWatts: { not: null },
            },
            select: {
                brand: true,
                measuredPowerWatts: true,
                measuredVoltage: true,
                healthPercentage: true,
            },
        });
        const brands = [...new Set(panels.map(p => p.brand).filter(b => b))];
        const powers = panels.map(p => p.measuredPowerWatts).filter(p => p != null);
        const voltages = panels.map(p => p.measuredVoltage).filter(v => v != null);
        return {
            brands,
            powerRanges: {
                min: powers.length > 0 ? Math.min(...powers) : 0,
                max: powers.length > 0 ? Math.max(...powers) : 0,
            },
            voltageRanges: {
                min: voltages.length > 0 ? Math.min(...voltages) : 0,
                max: voltages.length > 0 ? Math.max(...voltages) : 0,
            },
            healthGrades: [marketplace_dto_1.HealthGrade.A, marketplace_dto_1.HealthGrade.B, marketplace_dto_1.HealthGrade.C],
        };
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = MarketplaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map