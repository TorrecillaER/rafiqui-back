---
description: Crear endpoint de validación de panel para inspector con cambio de estado
---

# Step 6: Endpoint de Validación de Panel para Inspector

Este workflow crea el endpoint en el backend que valida si un panel puede ser inspeccionado y cambia su estado a `INSPECTING` si es válido.

## Prerrequisitos

- [ ] Backend NestJS funcionando
- [ ] Módulo de Assets existente
- [ ] MongoDB conectado

---

## Paso 1: Agregar Estado INSPECTING al Enum de Assets

Buscar el archivo donde está definido el enum de estados de assets y agregar `INSPECTING`:

```typescript
// En el archivo de schema o enum de assets
export enum AssetStatus {
  COLLECTED = 'COLLECTED',
  WAREHOUSE_RECEIVED = 'WAREHOUSE_RECEIVED',
  INSPECTING = 'INSPECTING',           // ← AGREGAR
  INSPECTED = 'INSPECTED',
  REUSE_APPROVED = 'REUSE_APPROVED',
  RECYCLE_APPROVED = 'RECYCLE_APPROVED',
  ART_APPROVED = 'ART_APPROVED',
  REUSED = 'REUSED',
  RECYCLED = 'RECYCLED',
}
```

---

## Paso 2: Crear DTO para Validación de Panel

Crear `src/assets/dto/validate-for-inspection.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateForInspectionDto {
  @ApiProperty({ description: 'Código QR del panel' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiPropertyOptional({ description: 'ID del inspector' })
  @IsOptional()
  @IsString()
  inspectorId?: string;
}

export class ValidateForInspectionResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  asset?: any;

  @ApiPropertyOptional()
  error?: string;
}
```

---

## Paso 3: Agregar Método de Validación en AssetService

En `src/assets/assets.service.ts`, agregar:

```typescript
/**
 * Valida si un panel puede ser inspeccionado y cambia su estado a INSPECTING
 * @param qrCode Código QR del panel
 * @param inspectorId ID del inspector (opcional)
 * @returns El asset si es válido, o un error descriptivo
 */
async validateForInspection(qrCode: string, inspectorId?: string): Promise<{
  valid: boolean;
  message: string;
  asset?: Asset;
  error?: string;
}> {
  // Buscar el asset por qrCode
  const asset = await this.assetModel.findOne({ qrCode }).exec();

  if (!asset) {
    return {
      valid: false,
      message: 'Panel no encontrado',
      error: 'Este panel no existe en los registros. Verifica el código QR.',
    };
  }

  // Estados que indican que ya fue procesado
  const processedStatuses = [
    AssetStatus.INSPECTED,
    AssetStatus.REUSE_APPROVED,
    AssetStatus.RECYCLE_APPROVED,
    AssetStatus.ART_APPROVED,
    AssetStatus.REUSED,
    AssetStatus.RECYCLED,
  ];

  if (processedStatuses.includes(asset.status)) {
    return {
      valid: false,
      message: 'Panel ya procesado',
      error: `Este panel ya ha sido inspeccionado previamente. Estado actual: ${asset.status}`,
      asset: asset,
    };
  }

  // Estados válidos para iniciar inspección
  const validStatuses = [
    AssetStatus.COLLECTED,
    AssetStatus.WAREHOUSE_RECEIVED,
    AssetStatus.INSPECTING,
  ];

  if (!validStatuses.includes(asset.status)) {
    return {
      valid: false,
      message: 'Estado no válido',
      error: `Este panel no está disponible para inspección. Estado actual: ${asset.status}`,
      asset: asset,
    };
  }

  // Si está en COLLECTED o WAREHOUSE_RECEIVED, cambiar a INSPECTING
  if (asset.status === AssetStatus.COLLECTED || 
      asset.status === AssetStatus.WAREHOUSE_RECEIVED) {
    
    asset.status = AssetStatus.INSPECTING;
    
    // Opcional: guardar quién inició la inspección
    if (inspectorId) {
      asset.inspectorId = inspectorId;
      asset.inspectionStartedAt = new Date();
    }
    
    await asset.save();
    
    this.logger.log(`Panel ${qrCode} cambiado a INSPECTING por inspector ${inspectorId || 'unknown'}`);
  }

  return {
    valid: true,
    message: 'Panel válido para inspección',
    asset: asset,
  };
}

/**
 * Buscar asset por QR Code
 */
async findByQrCode(qrCode: string): Promise<Asset | null> {
  return this.assetModel.findOne({ qrCode }).exec();
}

/**
 * Buscar asset por NFC Tag ID
 */
async findByNfcTag(nfcTagId: string): Promise<Asset | null> {
  return this.assetModel.findOne({ nfcTagId }).exec();
}
```

---

## Paso 4: Agregar Endpoint en AssetController

En `src/assets/assets.controller.ts`, agregar:

```typescript
import { ValidateForInspectionDto, ValidateForInspectionResponseDto } from './dto/validate-for-inspection.dto';

// ... dentro de la clase AssetController

@Post('validate-for-inspection')
@ApiOperation({ summary: 'Validar si un panel puede ser inspeccionado' })
@ApiResponse({ status: 200, description: 'Resultado de validación', type: ValidateForInspectionResponseDto })
async validateForInspection(
  @Body() dto: ValidateForInspectionDto,
): Promise<ValidateForInspectionResponseDto> {
  const result = await this.assetsService.validateForInspection(
    dto.qrCode,
    dto.inspectorId,
  );
  
  return result;
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

@Get('by-nfc/:nfcTagId')
@ApiOperation({ summary: 'Buscar asset por NFC Tag ID' })
async findByNfcTag(@Param('nfcTagId') nfcTagId: string) {
  const asset = await this.assetsService.findByNfcTag(nfcTagId);
  if (!asset) {
    throw new NotFoundException(`Asset con NFC ${nfcTagId} no encontrado`);
  }
  return asset;
}
```

---

## Paso 5: Actualizar Schema de Asset (si es necesario)

En el schema de Mongoose, agregar campos opcionales:

```typescript
// En assets.schema.ts
@Schema({ timestamps: true })
export class Asset {
  // ... campos existentes

  @Prop({ type: String, enum: AssetStatus, default: AssetStatus.COLLECTED })
  status: AssetStatus;

  @Prop({ required: false })
  inspectorId?: string;

  @Prop({ required: false })
  inspectionStartedAt?: Date;

  @Prop({ required: false })
  inspectionCompletedAt?: Date;
}
```

---

## Paso 6: Verificar Filtro por Query Parameters

Asegurar que el endpoint GET /assets soporte filtros por qrCode y nfcTagId:

```typescript
// En assets.controller.ts
@Get()
async findAll(
  @Query('status') status?: string,
  @Query('qrCode') qrCode?: string,
  @Query('nfcTagId') nfcTagId?: string,
) {
  const filter: any = {};
  
  if (status) {
    // Soportar múltiples estados separados por coma
    const statuses = status.split(',');
    filter.status = { $in: statuses };
  }
  
  if (qrCode) {
    filter.qrCode = qrCode;
  }
  
  if (nfcTagId) {
    filter.nfcTagId = nfcTagId;
  }
  
  return this.assetsService.findAll(filter);
}
```

---

## Verificación

### Probar endpoint de validación

```bash
# Panel válido (estado COLLECTED)
curl -X POST http://localhost:4000/assets/validate-for-inspection \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "PANEL-001", "inspectorId": "inspector-123"}'

# Respuesta esperada:
# {"valid": true, "message": "Panel válido para inspección", "asset": {...}}
```

```bash
# Panel ya inspeccionado
curl -X POST http://localhost:4000/assets/validate-for-inspection \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "PANEL-INSPECTED"}'

# Respuesta esperada:
# {"valid": false, "message": "Panel ya procesado", "error": "Este panel ya ha sido inspeccionado..."}
```

```bash
# Panel no existente
curl -X POST http://localhost:4000/assets/validate-for-inspection \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "PANEL-NOEXISTE"}'

# Respuesta esperada:
# {"valid": false, "message": "Panel no encontrado", "error": "Este panel no existe..."}
```

### Verificar cambio de estado en BD

```bash
# Antes de validar
curl http://localhost:4000/assets/by-qr/PANEL-001
# status: "COLLECTED"

# Después de validar
curl http://localhost:4000/assets/by-qr/PANEL-001
# status: "INSPECTING"
```

---

## Flujo Completo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   App Móvil     │     │    Backend      │     │    MongoDB      │
│   (Inspector)   │     │    NestJS       │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ POST /validate-for-inspection                 │
         │ {qrCode: "PANEL-001"} │                       │
         │──────────────────────>│                       │
         │                       │ findOne({qrCode})     │
         │                       │──────────────────────>│
         │                       │<──────────────────────│
         │                       │                       │
         │                       │ [Si status=COLLECTED] │
         │                       │ update status=INSPECTING
         │                       │──────────────────────>│
         │                       │<──────────────────────│
         │                       │                       │
         │ {valid: true, asset}  │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ Navegar a /inspect    │                       │
         │                       │                       │
```

---

## Notas Importantes

1. **Estado INSPECTING es local**: No se escribe en blockchain hasta que termine la inspección
2. **Recuperación de fallos**: Si la app se cierra, el panel queda en INSPECTING y puede continuar
3. **Concurrencia**: Si dos inspectores escanean el mismo panel, el primero lo bloquea
4. **Timeout opcional**: Podrías agregar un job que revierta INSPECTING → COLLECTED después de X minutos sin completar
