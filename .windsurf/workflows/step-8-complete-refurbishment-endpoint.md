---
description: Endpoint para completar reacondicionamiento y cambiar estado a LISTED_FOR_SALE en BD y Blockchain
---

# Step 8: Endpoint para Completar Reacondicionamiento

Este workflow crea el endpoint en el backend que marca un panel como listo para venta después de completar el proceso de reacondicionamiento, actualizando tanto la base de datos como la blockchain.

## Prerrequisitos

- [ ] Backend NestJS funcionando
- [ ] Módulo de Assets existente
- [ ] BlockchainService configurado
- [ ] Estado `LISTED_FOR_SALE` en el enum de Prisma

---

## Paso 1: Agregar Estado LISTED_FOR_SALE a Prisma

Modificar `prisma/schema.prisma`:

```prisma
enum AssetStatus {
  COLLECTED
  WAREHOUSE_RECEIVED
  INSPECTING
  INSPECTED
  READY_FOR_REUSE
  REFURBISHING
  LISTED_FOR_SALE    // ← AGREGAR
  REUSED
  RECYCLED
  ART_CANDIDATE
  ART_MINTED
  SOLD
}
```

Ejecutar migración:

```bash
npx prisma migrate dev --name add_listed_for_sale_status
```

---

## Paso 2: Agregar Estado SOLD a BlockchainService

Verificar que el enum `PanelStatus` en `src/blockchain/blockchain.service.ts` incluya SOLD:

```typescript
export enum PanelStatus {
  COLLECTED = 0,
  WAREHOUSE_RECEIVED = 1,
  INSPECTED = 2,
  REUSE_APPROVED = 3,
  RECYCLE_APPROVED = 4,
  ART_APPROVED = 5,
  SOLD = 6,           // ← Verificar que existe
  RECYCLED = 7,
  ART_MINTED = 8,
}
```

---

## Paso 3: Crear DTO para Completar Reacondicionamiento

Crear `src/assets/dto/complete-refurbishment.dto.ts`:

```typescript
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteRefurbishmentDto {
  @ApiPropertyOptional({ description: 'Notas del técnico sobre el reacondicionamiento' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Nueva potencia medida en watts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  measuredPowerWatts?: number;

  @ApiPropertyOptional({ description: 'Porcentaje de capacidad retenida (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  capacityRetainedPercent?: number;

  @ApiPropertyOptional({ description: 'ID del técnico que realizó el reacondicionamiento' })
  @IsOptional()
  @IsString()
  technicianId?: string;
}

export class CompleteRefurbishmentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  asset?: any;

  @ApiPropertyOptional()
  blockchainTxHash?: string;
}
```

---

## Paso 4: Agregar Método en AssetService

En `src/assets/assets.service.ts`, agregar:

```typescript
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';

// En el constructor, inyectar BlockchainService si no está:
constructor(
  private prisma: PrismaService,
  private blockchainService: BlockchainService,
) {}

/**
 * Completa el proceso de reacondicionamiento y marca el panel como listo para venta
 * Actualiza tanto la BD como la blockchain
 */
async completeRefurbishment(
  assetId: string,
  dto?: CompleteRefurbishmentDto,
): Promise<{
  success: boolean;
  message: string;
  asset?: any;
  blockchainTxHash?: string;
}> {
  // Buscar el asset
  const asset = await this.assetModel.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return {
      success: false,
      message: 'Asset no encontrado',
    };
  }

  // Verificar que el estado sea válido para completar reacondicionamiento
  const validStatuses = [
    AssetStatus.READY_FOR_REUSE,
    AssetStatus.REFURBISHING,
  ];

  if (!validStatuses.includes(asset.status)) {
    return {
      success: false,
      message: `El panel no está en estado válido para completar reacondicionamiento. Estado actual: ${asset.status}`,
    };
  }

  // Actualizar en base de datos
  const updatedAsset = await this.prisma.asset.update({
    where: { id: assetId },
    data: {
      status: AssetStatus.LISTED_FOR_SALE,
      refurbishedAt: new Date(),
      refurbishmentNotes: dto?.notes,
      measuredPowerWatts: dto?.measuredPowerWatts,
      capacityRetainedPercent: dto?.capacityRetainedPercent,
      refurbishedById: dto?.technicianId,
    },
  });

  this.logger.log(`Asset ${assetId} marked as LISTED_FOR_SALE`);

  // Actualizar en blockchain (asíncrono)
  let blockchainTxHash: string | undefined;
  
  if (asset.qrCode && this.blockchainService.isConnected()) {
    try {
      // En blockchain usamos REUSE_APPROVED ya que LISTED_FOR_SALE es un estado interno
      // El estado SOLD se usará cuando realmente se venda
      blockchainTxHash = await this.blockchainService.updatePanelStatus(
        asset.qrCode,
        PanelStatus.REUSE_APPROVED, // Estado en blockchain
        'Planta de Reacondicionamiento - Listo para Venta',
        '' // ipfsHash opcional
      );
      
      this.logger.log(`Blockchain updated for ${asset.qrCode}: ${blockchainTxHash}`);
    } catch (error) {
      this.logger.error(`Failed to update blockchain for ${assetId}`, error);
      // No fallar la operación si blockchain falla
    }
  }

  return {
    success: true,
    message: 'Panel marcado como listo para venta',
    asset: updatedAsset,
    blockchainTxHash,
  };
}

/**
 * Obtener asset por QR Code
 */
async findByQrCode(qrCode: string) {
  return this.prisma.asset.findFirst({
    where: { qrCode },
  });
}
```

---

## Paso 5: Agregar Endpoint en AssetController

En `src/assets/assets.controller.ts`, agregar:

```typescript
import { CompleteRefurbishmentDto, CompleteRefurbishmentResponseDto } from './dto/complete-refurbishment.dto';

@Post(':id/complete-refurbishment')
@ApiOperation({ summary: 'Completar reacondicionamiento y marcar como listo para venta' })
@ApiResponse({ status: 200, description: 'Reacondicionamiento completado', type: CompleteRefurbishmentResponseDto })
async completeRefurbishment(
  @Param('id') id: string,
  @Body() dto?: CompleteRefurbishmentDto,
): Promise<CompleteRefurbishmentResponseDto> {
  return this.assetsService.completeRefurbishment(id, dto);
}

@Get('by-qr/:qrCode')
@ApiOperation({ summary: 'Buscar asset por código QR' })
async findByQrCode(@Param('qrCode') qrCode: string) {
  const asset = await this.assetsService.findByQrCode(qrCode);
  if (!asset) {
    throw new NotFoundException(`Asset con QR ${qrCode} no encontrado`);
  }
  return asset;
}
```

---

## Paso 6: Agregar Campos al Schema de Asset (si es necesario)

En `prisma/schema.prisma`, agregar campos para tracking de reacondicionamiento:

```prisma
model Asset {
  id                      String      @id @default(auto()) @map("_id") @db.ObjectId
  qrCode                  String?     @unique
  nfcTagId                String?
  brand                   String?
  model                   String?
  status                  AssetStatus @default(COLLECTED)
  
  // Campos de recolección
  collectedById           String?     @db.ObjectId
  collectedAt             DateTime?
  
  // Campos de inspección
  inspectorId             String?     @db.ObjectId
  inspectedAt             DateTime?
  
  // Campos de reacondicionamiento
  refurbishedById         String?     @db.ObjectId
  refurbishedAt           DateTime?
  refurbishmentNotes      String?
  measuredPowerWatts      Float?
  capacityRetainedPercent Float?
  
  // Campos de venta
  soldAt                  DateTime?
  soldToId                String?     @db.ObjectId
  salePrice               Float?
  
  // Blockchain
  blockchainTxHash        String?
  
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
}
```

Ejecutar migración:

```bash
npx prisma migrate dev --name add_refurbishment_fields
```

---

## Paso 7: Importar BlockchainModule en AssetsModule

Modificar `src/assets/assets.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module'; // ← AGREGAR

@Module({
  imports: [
    PrismaModule,
    BlockchainModule, // ← AGREGAR
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
```

---

## Verificación

### Probar endpoint de completar reacondicionamiento

```bash
# Completar reacondicionamiento básico
curl -X POST http://localhost:4000/assets/ASSET_ID/complete-refurbishment \
  -H "Content-Type: application/json"

# Respuesta esperada:
# {
#   "success": true,
#   "message": "Panel marcado como listo para venta",
#   "asset": {...},
#   "blockchainTxHash": "0x..."
# }
```

```bash
# Completar con datos adicionales
curl -X POST http://localhost:4000/assets/ASSET_ID/complete-refurbishment \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Panel reacondicionado exitosamente. Conectores MC4 reemplazados.",
    "measuredPowerWatts": 285,
    "capacityRetainedPercent": 95,
    "technicianId": "tech-001"
  }'
```

### Verificar en blockchain

```bash
curl http://localhost:4000/blockchain/panel/PANEL-QR-CODE/history
```

Deberías ver el estado actualizado a REUSE_APPROVED.

---

## Flujo Completo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   App Móvil     │     │    Backend      │     │    MongoDB      │     │   Blockchain    │
│   (Técnico)     │     │    NestJS       │     │    Prisma       │     │   Polygon       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │                       │
         │ POST /assets/:id/     │                       │                       │
         │ complete-refurbishment│                       │                       │
         │──────────────────────>│                       │                       │
         │                       │                       │                       │
         │                       │ Verificar estado      │                       │
         │                       │ READY_FOR_REUSE       │                       │
         │                       │──────────────────────>│                       │
         │                       │                       │                       │
         │                       │ Update status         │                       │
         │                       │ → LISTED_FOR_SALE     │                       │
         │                       │──────────────────────>│                       │
         │                       │                       │                       │
         │                       │ Update blockchain (async)                     │
         │                       │ → REUSE_APPROVED      │                       │
         │                       │──────────────────────────────────────────────>│
         │                       │                       │                       │
         │ {success, txHash}     │                       │                       │
         │<──────────────────────│                       │                       │
         │                       │                       │                       │
```

---

## Estados del Panel en el Flujo de Reuso

| Paso | Estado BD | Estado Blockchain | Descripción |
|------|-----------|-------------------|-------------|
| Inspección aprobada | `READY_FOR_REUSE` | `REUSE_APPROVED` | Listo para reacondicionamiento |
| En reacondicionamiento | `REFURBISHING` | - | Técnico trabajando |
| Reacondicionamiento completo | `LISTED_FOR_SALE` | `REUSE_APPROVED` | Disponible en marketplace |
| Vendido | `SOLD` | `SOLD` | Transferido a nuevo dueño |

---

## Notas Importantes

1. **LISTED_FOR_SALE es estado interno**: En blockchain usamos `REUSE_APPROVED` porque representa que el panel está aprobado para reuso. El estado `SOLD` se usará cuando realmente se venda.

2. **Blockchain es asíncrono**: Si falla la actualización de blockchain, la operación en BD no se revierte. Esto es intencional para no bloquear el flujo.

3. **Campos opcionales**: Los datos de potencia medida y capacidad son opcionales pero útiles para el marketplace.
