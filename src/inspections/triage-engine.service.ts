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
   * Evalúa un panel y determina su destino
   * TEMPORAL: Siempre retorna ART para pruebas del flujo de arte
   * @returns ART (temporalmente forzado)
   */
  evaluatePanel(
    voltage: number,
    amperage: number,
    physicalCondition: string,
  ): InspectionResult {
    // ⚠️ TEMPORAL: FORZAR SIEMPRE ART PARA PRUEBAS
    // TODO: Restaurar lógica secuencial después de pruebas
    const result = InspectionResult.ART;
    
    // Incrementar contador para la próxima inspección
    this.inspectionCounter++;
    
    this.logger.log(
      `Panel evaluado - Contador: ${this.inspectionCounter}, ` +
      `Resultado: ${result} [FORZADO PARA PRUEBAS] (V: ${voltage}, A: ${amperage}, Cond: ${physicalCondition})`
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
