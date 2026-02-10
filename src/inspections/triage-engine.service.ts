import { Injectable, Logger } from '@nestjs/common';
import { InspectionResult } from '@prisma/client';

@Injectable()
export class TriageEngineService {
  private readonly logger = new Logger(TriageEngineService.name);
  
  // Contador para asignación secuencial
  // Secuencia: REUSE (0) → ART (1) → RECYCLE (2) → REUSE (3) → ...
  private inspectionCounter = 0;
  
  // Secuencia de resultados
  private readonly resultSequence: InspectionResult[] = [
    InspectionResult.REUSE,    // Reutilización
    InspectionResult.ART,      // Arte
    InspectionResult.RECYCLE,  // Reciclaje
  ];

  /**
   * Evalúa un panel y determina su destino usando asignación secuencial
   * Secuencia: REUSE → ART → RECYCLE → REUSE → ...
   * @returns InspectionResult basado en la secuencia
   */
  evaluatePanel(
    voltage: number,
    amperage: number,
    physicalCondition: string,
  ): InspectionResult {
    // Obtener resultado basado en la secuencia
    const sequenceIndex = this.inspectionCounter % this.resultSequence.length;
    const result = this.resultSequence[sequenceIndex];
    
    // Incrementar contador para la próxima inspección
    this.inspectionCounter++;
    
    this.logger.log(
      `Panel evaluado - Contador: ${this.inspectionCounter}, ` +
      `Resultado: ${result} (V: ${voltage}, A: ${amperage}, Cond: ${physicalCondition})`
    );
    
    return result;
  }

  /**
   * Obtiene el contador actual de inspecciones
   */
  getInspectionCount(): number {
    return this.inspectionCounter;
  }

  /**
   * Resetea el contador (útil para testing)
   */
  resetCounter(): void {
    this.inspectionCounter = 0;
    this.logger.log('Contador de inspecciones reseteado');
  }
}
