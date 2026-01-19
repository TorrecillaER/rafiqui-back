export declare enum HealthGrade {
    A = "A",
    B = "B",
    C = "C"
}
export declare enum PowerRange {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare class MarketplaceFiltersDto {
    brands?: string;
    minPower?: number;
    maxPower?: number;
    powerRange?: PowerRange;
    minVoltage?: number;
    maxVoltage?: number;
    healthGrade?: HealthGrade;
    minLength?: number;
    maxLength?: number;
    minWidth?: number;
    maxWidth?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class MarketplacePanelDto {
    id: string;
    qrCode: string;
    brand: string;
    model: string;
    measuredPowerWatts: number;
    measuredVoltage: number;
    healthPercentage: number;
    healthGrade: HealthGrade;
    dimensionLength: number;
    dimensionWidth: number;
    dimensionHeight: number;
    refurbishedAt: Date;
    refurbishmentNotes?: string;
}
export declare class MarketplaceGroupDto {
    groupId: string;
    brand: string;
    model: string;
    powerRange: string;
    avgPower: number;
    avgVoltage: number;
    healthGrade: HealthGrade;
    avgHealthPercentage: number;
    dimensions: string;
    availableCount: number;
    panelIds: string[];
    suggestedPrice?: number;
    imageUrl?: string;
}
export declare class MarketplaceResponseDto {
    groups: MarketplaceGroupDto[];
    totalPanels: number;
    totalGroups: number;
    page: number;
    limit: number;
    totalPages: number;
    availableFilters: {
        brands: string[];
        powerRanges: {
            min: number;
            max: number;
        };
        voltageRanges: {
            min: number;
            max: number;
        };
        healthGrades: HealthGrade[];
    };
}
export declare class MarketplacePanelsResponseDto {
    panels: MarketplacePanelDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
