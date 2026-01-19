---
description: Endpoint para completar inspección y registrar en blockchain
---

# Step 7: Completar Inspección con Registro en Blockchain

Este workflow modifica el endpoint de inspección para que al completar una inspección, se actualice el estado del asset tanto en la base de datos como en la blockchain.

## Prerrequisitos

- [ ] Backend NestJS funcionando
- [ ] Módulo de Inspecciones existente
- [ ] BlockchainService configurado y funcionando
- [ ] Variables de entorno de blockchain configuradas

---

## Paso 1: Importar BlockchainModule en InspectionsModule

Modificar `src/inspections/inspections.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module'; // ← AGREGAR
import { TriageEngineService } from './triage-engine.service';

@Module({
  imports: [
    PrismaModule,
    BlockchainModule, // ← AGREGAR
  ],
  controllers: [InspectionsController],
  providers: [InspectionsService, TriageEngineService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
```

---

## Paso 2: Inyectar BlockchainService en InspectionsService

Modificar `src/inspections/inspections.service.ts`:

### 2.1 Agregar imports

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { AssetStatus, InspectionResult } from '@prisma/client';
import { TriageEngineService } from './triage-engine.service';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service'; // ← AGREGAR
```

### 2.2 Agregar logger y BlockchainService al constructor

```typescript
@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name); // ← AGREGAR

  constructor(
    private prisma: PrismaService,
    private triageEngine: TriageEngineService,
    private blockchainService: BlockchainService, // ← AGREGAR
  ) {}
```

### 2.3 Modificar método create para incluir blockchain

Reemplazar el método `create`:

```typescript
async create(createInspectionDto: CreateInspectionDto) {
  const { assetId, inspectorId, measuredVoltage, measuredAmps, physicalCondition, photoUrl, notes } = createInspectionDto;

  // Obtener el asset para tener el qrCode
  const asset = await this.prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error('Asset no encontrado');
  }

  // Evaluación con Triage Engine
  const aiRecommendation = this.triageEngine.evaluatePanel(
    measuredVoltage,
    measuredAmps,
    physicalCondition,
  );

  // Determinar nuevo estado del asset
  let newAssetStatus: AssetStatus;
  let blockchainStatus: PanelStatus;

  switch (aiRecommendation) {
    case InspectionResult.REUSE:
      newAssetStatus = AssetStatus.READY_FOR_REUSE;
      blockchainStatus = PanelStatus.REUSE_APPROVED;
      break;
    case InspectionResult.RECYCLE:
      newAssetStatus = AssetStatus.RECYCLED;
      blockchainStatus = PanelStatus.RECYCLE_APPROVED;
      break;
    case InspectionResult.ART:
      newAssetStatus = AssetStatus.ART_CANDIDATE;
      blockchainStatus = PanelStatus.ART_APPROVED;
      break;
    default:
      newAssetStatus = AssetStatus.INSPECTED;
      blockchainStatus = PanelStatus.INSPECTED;
  }

  // Transacción en base de datos
  const inspection = await this.prisma.$transaction(async (prisma) => {
    const newInspection = await prisma.inspection.create({
      data: {
        assetId,
        inspectorId,
        measuredVoltage,
        measuredAmps,
        physicalCondition,
        photoUrl,
        notes,
        aiRecommendation,
      },
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { 
        status: newAssetStatus,
        inspectedAt: new Date(),
        inspectorId: inspectorId,
      },
    });

    return newInspection;
  });

  // Registrar en blockchain (asíncrono, no bloquea)
  this.updateBlockchainStatus(asset.qrCode, blockchainStatus, inspectorId).catch(err => {
    this.logger.error(`Failed to update blockchain for asset ${assetId}`, err);
  });

  return {
    ...inspection,
    aiRecommendation,
    blockchainStatus: blockchainStatus,
  };
}

/**
 * Actualiza el estado del panel en la blockchain
 */
private async updateBlockchainStatus(
  qrCode: string,
  status: PanelStatus,
  inspectorId: string,
): Promise<void> {
  if (!this.blockchainService.isConnected()) {
    this.logger.warn('Blockchain not connected, skipping status update');
    return;
  }

  try {
    // Primero marcar como INSPECTED
    await this.blockchainService.updatePanelStatus(
      qrCode,
      PanelStatus.INSPECTED,
      'Planta de Inspección',
      ''
    );
    this.logger.log(`Panel ${qrCode} marked as INSPECTED in blockchain`);

    // Si el resultado no es solo INSPECTED, actualizar al estado final
    if (status !== PanelStatus.INSPECTED) {
      await this.blockchainService.updatePanelStatus(
        qrCode,
        status,
        'Planta de Inspección',
        ''
      );
      this.logger.log(`Panel ${qrCode} status updated to ${PanelStatus[status]} in blockchain`);
    }
  } catch (error) {
    this.logger.error(`Blockchain update failed for ${qrCode}`, error);
    throw error;
  }
}
```

---

## Paso 3: Agregar Estado ART_CANDIDATE a Prisma (si no existe)

Si necesitas agregar el estado `ART_CANDIDATE`, modifica el schema de Prisma:

```prisma
// En prisma/schema.prisma
enum AssetStatus {
  COLLECTED
  WAREHOUSE_RECEIVED
  INSPECTING
  INSPECTED
  READY_FOR_REUSE
  RECYCLED
  ART_CANDIDATE    // ← AGREGAR si no existe
  SOLD
}
```

Luego ejecutar:

```bash
npx prisma migrate dev --name add_art_candidate_status
```

---

## Paso 4: Agregar Resultado ART al Triage Engine

Si quieres que el triage pueda recomendar "Arte", modifica `triage-engine.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InspectionResult } from '@prisma/client';

@Injectable()
export class TriageEngineService {
  /**
   * Evalúa un panel y determina su destino
   * @returns REUSE, RECYCLE, o ART
   */
  evaluatePanel(
    voltage: number,
    amps: number,
    condition: string,
  ): InspectionResult {
    // Calcular eficiencia aproximada
    const power = voltage * amps;
    const efficiency = this.calculateEfficiency(power, condition);

    // Reglas de decisión
    if (efficiency >= 70 && this.isGoodCondition(condition)) {
      return InspectionResult.REUSE;
    }
    
    // Candidato a arte: baja eficiencia pero condición visual interesante
    if (efficiency < 40 && this.isArtCandidate(condition)) {
      return InspectionResult.ART;
    }

    return InspectionResult.RECYCLE;
  }

  private calculateEfficiency(power: number, condition: string): number {
    // Potencia nominal típica de un panel: ~300W
    const nominalPower = 300;
    let baseEfficiency = (power / nominalPower) * 100;

    // Ajustar por condición física
    const conditionMultiplier: Record<string, number> = {
      'EXCELLENT': 1.0,
      'GOOD': 0.9,
      'FAIR': 0.7,
      'POOR': 0.5,
    };

    return baseEfficiency * (conditionMultiplier[condition] || 0.7);
  }

  private isGoodCondition(condition: string): boolean {
    return ['EXCELLENT', 'GOOD'].includes(condition);
  }

  private isArtCandidate(condition: string): boolean {
    // Paneles en condición FAIR o POOR pueden ser candidatos a arte
    // si tienen características visuales interesantes
    return ['FAIR', 'POOR'].includes(condition);
  }
}
```

---

## Paso 5: Agregar InspectionResult.ART a Prisma (si no existe)

```prisma
// En prisma/schema.prisma
enum InspectionResult {
  REUSE
  RECYCLE
  ART      // ← AGREGAR
  PENDING
}
```

---

## Verificación

### Probar endpoint de inspección

```bash
curl -X POST http://localhost:4000/inspections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assetId": "asset-id-here",
    "measuredVoltage": 35.5,
    "measuredAmps": 8.2,
    "physicalCondition": "GOOD",
    "notes": "Panel en buen estado"
  }'
```

### Respuesta esperada

```json
{
  "id": "inspection-id",
  "assetId": "asset-id",
  "inspectorId": "inspector-id",
  "measuredVoltage": 35.5,
  "measuredAmps": 8.2,
  "physicalCondition": "GOOD",
  "aiRecommendation": "REUSE",
  "blockchainStatus": 3,
  "createdAt": "2026-01-05T..."
}
```

### Verificar en blockchain

```bash
curl http://localhost:4000/blockchain/panel/PANEL-QR-CODE/history
```

Deberías ver el estado actualizado a INSPECTED y luego al estado final.

---

## Flujo Completo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   App Móvil     │     │    Backend      │     │    MongoDB      │     │   Blockchain    │
│   (Inspector)   │     │    NestJS       │     │    Prisma       │     │   Polygon       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │                       │
         │ POST /inspections     │                       │                       │
         │ {voltage, amps, ...}  │                       │                       │
         │──────────────────────>│                       │                       │
         │                       │                       │                       │
         │                       │ Triage Engine         │                       │
         │                       │ → REUSE/RECYCLE/ART   │                       │
         │                       │                       │                       │
         │                       │ Create Inspection     │                       │
         │                       │──────────────────────>│                       │
         │                       │                       │                       │
         │                       │ Update Asset Status   │                       │
         │                       │──────────────────────>│                       │
         │                       │                       │                       │
         │                       │ Update Blockchain (async)                     │
         │                       │──────────────────────────────────────────────>│
         │                       │                       │                       │
         │ {inspection, result}  │                       │                       │
         │<──────────────────────│                       │                       │
         │                       │                       │                       │
```

---

## Notas Importantes

1. **Blockchain es asíncrono**: La respuesta al móvil no espera a que blockchain confirme
2. **Dos transacciones en blockchain**: Primero INSPECTED, luego el estado final
3. **Graceful degradation**: Si blockchain falla, la inspección se guarda igual en BD
4. **Logs**: Revisar logs del backend para confirmar transacciones blockchain
