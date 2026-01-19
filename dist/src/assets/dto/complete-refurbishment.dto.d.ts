export declare class CompleteRefurbishmentDto {
    notes?: string;
    measuredPowerWatts?: number;
    measuredVoltage?: number;
    capacityRetainedPercent?: number;
    healthPercentage?: number;
    dimensionLength?: number;
    dimensionWidth?: number;
    dimensionHeight?: number;
    technicianId?: string;
}
export declare class CompleteRefurbishmentResponseDto {
    success: boolean;
    message: string;
    asset?: any;
    blockchainTxHash?: string;
}
