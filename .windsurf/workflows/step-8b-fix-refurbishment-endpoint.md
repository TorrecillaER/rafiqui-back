---
description: Corregir endpoint de reacondicionamiento para guardar datos técnicos y cambiar estado a LISTED_FOR_SALE
---

# Step 8b: Corregir Endpoint de Reacondicionamiento

Este workflow corrige el endpoint `completeRefurbishment` para:
1. Asegurar que el estado final sea `LISTED_FOR_SALE` (no `REFURBISHING`)
2. Agregar campos faltantes: voltaje, dimensiones
3. Guardar correctamente todos los datos técnicos del panel reacondicionado

## Problema Actual

- El estado queda en `REFURBISHING` en lugar de `LISTED_FOR_SALE`
- Los campos `measuredPowerWatts`, `capacityRetainedPercent`, etc. quedan en `null`
- Faltan campos para voltaje y dimensiones

---

## Paso 1: Agregar Campos Faltantes al Schema de Prisma

Modificar `prisma/schema.prisma` para agregar los campos de voltaje y dimensiones:

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
  
  // Campos de reacondicionamiento - EXISTENTES
  refurbishedById         String?     @db.ObjectId
  refurbishedAt           DateTime?
  refurbishmentNotes      String?
  measuredPowerWatts      Float?
  capacityRetainedPercent Float?
  
  // Campos de reacondicionamiento - NUEVOS
  measuredVoltage         Float?      // Voltaje medido en V
  healthPercentage        Float?      // % estado de salud (0-100)
  dimensionLength         Float?      // Largo en cm
  dimensionWidth          Float?      // Ancho en cm
  dimensionHeight         Float?      // Alto/grosor en cm
  
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
npx prisma db push
# O si usas migraciones:
# npx prisma migrate dev --name add_refurbishment_technical_fields
```

---

## Paso 2: Actualizar DTO de Reacondicionamiento

Modificar `src/assets/dto/complete-refurbishment.dto.ts`:

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

  @ApiPropertyOptional({ description: 'Voltaje medido en V' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  measuredVoltage?: number;

  @ApiPropertyOptional({ description: 'Porcentaje de capacidad/salud retenida (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  capacityRetainedPercent?: number;

  @ApiPropertyOptional({ description: 'Porcentaje de estado de salud (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  healthPercentage?: number;

  @ApiPropertyOptional({ description: 'Largo del panel en cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dimensionLength?: number;

  @ApiPropertyOptional({ description: 'Ancho del panel en cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dimensionWidth?: number;

  @ApiPropertyOptional({ description: 'Alto/grosor del panel en cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dimensionHeight?: number;

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

## Paso 3: Corregir Método completeRefurbishment en AssetService

Modificar `src/assets/assets.service.ts`, método `completeRefurbishment`:

```typescript
/**
 * Completa el proceso de reacondicionamiento y marca el panel como listo para venta
 * Actualiza tanto la BD como la blockchain
 */
async completeRefurbishment(
  assetId: string,
  dto?: {
    notes?: string;
    measuredPowerWatts?: number;
    measuredVoltage?: number;
    capacityRetainedPercent?: number;
    healthPercentage?: number;
    dimensionLength?: number;
    dimensionWidth?: number;
    dimensionHeight?: number;
    technicianId?: string;
  },
): Promise<{
  success: boolean;
  message: string;
  asset?: Asset;
  blockchainTxHash?: string;
}> {
  // Buscar el asset
  const asset = await this.prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return {
      success: false,
      message: 'Asset no encontrado',
    };
  }

  // Verificar que el estado sea válido para completar reacondicionamiento
  const validStatuses: AssetStatus[] = [
    AssetStatus.READY_FOR_REUSE,
    AssetStatus.REFURBISHING,
  ];

  if (!validStatuses.includes(asset.status)) {
    return {
      success: false,
      message: `El panel no está en estado válido para completar reacondicionamiento. Estado actual: ${asset.status}`,
    };
  }

  // Actualizar en base de datos con TODOS los campos
  const updatedAsset = await this.prisma.asset.update({
    where: { id: assetId },
    data: {
      // IMPORTANTE: Estado final debe ser LISTED_FOR_SALE
      status: AssetStatus.LISTED_FOR_SALE,
      refurbishedAt: new Date(),
      
      // Datos del técnico
      refurbishedById: dto?.technicianId,
      refurbishmentNotes: dto?.notes,
      
      // Datos técnicos de potencia y voltaje
      measuredPowerWatts: dto?.measuredPowerWatts,
      measuredVoltage: dto?.measuredVoltage,
      
      // Estado de salud
      capacityRetainedPercent: dto?.capacityRetainedPercent,
      healthPercentage: dto?.healthPercentage,
      
      // Dimensiones
      dimensionLength: dto?.dimensionLength,
      dimensionWidth: dto?.dimensionWidth,
      dimensionHeight: dto?.dimensionHeight,
    },
  });

  this.logger.log(`Asset ${assetId} marked as LISTED_FOR_SALE with technical data`);
  this.logger.log(`Technical data: Power=${dto?.measuredPowerWatts}W, Voltage=${dto?.measuredVoltage}V, Health=${dto?.healthPercentage}%`);

  // Actualizar en blockchain si está conectado
  let blockchainTxHash: string | undefined;
  
  if (asset.qrCode && this.blockchainService.isConnected()) {
    try {
      blockchainTxHash = await this.blockchainService.updatePanelStatus(
        asset.qrCode,
        PanelStatus.REUSE_APPROVED,
        'Planta de Reacondicionamiento - Listo para Venta',
        ''
      );
      this.logger.log(`Blockchain updated for ${asset.qrCode}: ${blockchainTxHash}`);
    } catch (error) {
      this.logger.error(`Blockchain update failed for ${assetId}`, error);
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
```

---

## Paso 4: Verificar que el Controller Pase Todos los Campos

El controller en `src/assets/assets.controller.ts` ya debería estar correcto:

```typescript
@Post(':id/complete-refurbishment')
@ApiOperation({ summary: 'Completar reacondicionamiento y marcar como listo para venta' })
@ApiResponse({ status: 200, description: 'Reacondicionamiento completado', type: CompleteRefurbishmentResponseDto })
async completeRefurbishment(
  @Param('id') id: string,
  @Body() dto?: CompleteRefurbishmentDto,
): Promise<CompleteRefurbishmentResponseDto> {
  return this.assetsService.completeRefurbishment(id, dto);
}
```

---

## Verificación

### Probar endpoint con datos completos

```bash
curl -X POST http://localhost:4000/assets/ASSET_ID/complete-refurbishment \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Panel reacondicionado exitosamente. Conectores MC4 reemplazados.",
    "measuredPowerWatts": 285,
    "measuredVoltage": 38.5,
    "capacityRetainedPercent": 95,
    "healthPercentage": 92,
    "dimensionLength": 165.5,
    "dimensionWidth": 99.2,
    "dimensionHeight": 3.5,
    "technicianId": "tech-001"
  }'
```

### Respuesta esperada

```json
{
  "success": true,
  "message": "Panel marcado como listo para venta",
  "asset": {
    "id": "...",
    "status": "LISTED_FOR_SALE",
    "measuredPowerWatts": 285,
    "measuredVoltage": 38.5,
    "capacityRetainedPercent": 95,
    "healthPercentage": 92,
    "dimensionLength": 165.5,
    "dimensionWidth": 99.2,
    "dimensionHeight": 3.5,
    "refurbishedAt": "2026-01-10T...",
    "refurbishedById": "tech-001",
    "refurbishmentNotes": "Panel reacondicionado exitosamente..."
  },
  "blockchainTxHash": "0x..."
}
```

### Verificar en MongoDB

Después de ejecutar el endpoint, verificar en la base de datos que:
1. `status` sea `LISTED_FOR_SALE` (no `REFURBISHING`)
2. Todos los campos técnicos tengan valores
3. `refurbishedAt` tenga la fecha actual

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar campos: `measuredVoltage`, `healthPercentage`, `dimensionLength`, `dimensionWidth`, `dimensionHeight` |
| `dto/complete-refurbishment.dto.ts` | Agregar validaciones para nuevos campos |
| `assets.service.ts` | Actualizar método para guardar todos los campos y asegurar estado `LISTED_FOR_SALE` |
