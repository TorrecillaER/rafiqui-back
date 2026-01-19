import { InspectionResult } from '@prisma/client';
export declare class TriageEngineService {
    private readonly logger;
    private inspectionCounter;
    private readonly resultSequence;
    evaluatePanel(voltage: number, amperage: number, physicalCondition: string): InspectionResult;
    getInspectionCount(): number;
    resetCounter(): void;
}
