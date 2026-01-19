---
description: Crear endpoint para procesar reciclaje de panel y registrar materiales
---

# Step 13: Endpoint de Reciclaje de Panel

Este workflow crea el endpoint para procesar el reciclaje de un panel, separar los materiales, registrarlos en BD y actualizar el estado en blockchain.

## Arquitectura de Separación de Materiales

### Distribución de Materiales por Panel
Un panel solar típico de ~20kg se descompone en:
- **Aluminio**: 35% = 7.0 kg
- **Vidrio Solar**: 40% = 8.0 kg
- **Silicio Purificado**: 15% = 3.0 kg
- **Cobre Recuperado**: 10% = 2.0 kg

### Flujo de Datos
```
1. Operador escanea panel con estado RECYCLE_APPROVED
2. Confirma reciclaje en la app
3. Backend:
   a. Calcula materiales según peso del panel
   b. Crea registro RecycleRecord en BD
   c. Actualiza/crea MaterialStock para cada material
   d. Cambia estado del Asset a RECYCLED
   e. Actualiza blockchain con estado RECYCLED + hash del registro
4. Materiales disponibles en marketplace
```

---

## Paso 1: Actualizar Schema de Prisma

Agregar modelos para reciclaje en `prisma/schema.prisma`:

```prisma
// Agregar después del modelo ArtPiece

enum MaterialType {
  ALUMINUM
  GLASS
  SILICON
  COPPER
}

model RecycleRecord {
  id              String   @id @default(uuid())
  assetId         String   @unique
  asset           Asset    @relation(fields: [assetId], references: [id])
  operatorId      String
  operator        User     @relation("RecycleOperator", fields: [operatorId], references: [id])
  
  panelWeightKg   Float    @default(20.0)
  
  aluminumKg      Float
  glassKg         Float
  siliconKg       Float
  copperKg        Float
  
  blockchainTxHash String?
  ipfsHash         String?
  
  createdAt       DateTime @default(now())
}

model MaterialStock {
  id              String       @id @default(uuid())
  type            MaterialType @unique
  name            String
  totalKg         Float        @default(0)
  availableKg     Float        @default(0)
  reservedKg      Float        @default(0)
  pricePerKg      Float
  
  updatedAt       DateTime     @updatedAt
  createdAt       DateTime     @default(now())
}
```

Actualizar el modelo User para la relación:
```prisma
model User {
  // ... campos existentes ...
  recycleRecords  RecycleRecord[] @relation("RecycleOperator")
}
```

Actualizar el modelo Asset para la relación:
```prisma
model Asset {
  // ... campos existentes ...
  recycleRecord   RecycleRecord?
}
```

---

## Paso 2: Ejecutar Migración

```bash
cd rafiqui-back
npx prisma migrate dev --name add_recycle_materials
npx prisma generate
```

---

## Paso 3: Crear DTOs para Reciclaje

Crear `src/recycle/dto/recycle.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProcessRecycleDto {
  @ApiProperty({ description: 'ID del asset a reciclar' })
  @IsString()
  assetId: string;

  @ApiProperty({ description: 'ID del operador que procesa' })
  @IsString()
  operatorId: string;

  @ApiPropertyOptional({ description: 'Peso del panel en kg (default: 20)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  panelWeightKg?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecycleResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  recycleRecord: {
    id: string;
    assetId: string;
    panelWeightKg: number;
    materials: {
      aluminum: number;
      glass: number;
      silicon: number;
      copper: number;
    };
    blockchainTxHash: string | null;
  };

  @ApiProperty()
  updatedStock: {
    aluminum: number;
    glass: number;
    silicon: number;
    copper: number;
  };
}

export class MaterialStockDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalKg: number;

  @ApiProperty()
  availableKg: number;

  @ApiProperty()
  pricePerKg: number;
}
```

---

## Paso 4: Crear Servicio de Reciclaje

Crear `src/recycle/recycle.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, PanelStatus } from '../blockchain/blockchain.service';
import { ProcessRecycleDto, RecycleResponseDto, MaterialStockDto } from './dto/recycle.dto';
import { AssetStatus, MaterialType } from '@prisma/client';
import * as crypto from 'crypto';

// Porcentajes de materiales en un panel solar
const MATERIAL_PERCENTAGES = {
  ALUMINUM: 0.35,  // 35%
  GLASS: 0.40,     // 40%
  SILICON: 0.15,   // 15%
  COPPER: 0.10,    // 10%
};

// Precios por kg (en USD)
const MATERIAL_PRICES = {
  ALUMINUM: 2.80,
  GLASS: 0.45,
  SILICON: 15.00,
  COPPER: 8.50,
};

// Nombres de materiales
const MATERIAL_NAMES = {
  ALUMINUM: 'Aluminio Reciclado',
  GLASS: 'Vidrio Solar Premium',
  SILICON: 'Silicio Purificado',
  COPPER: 'Cobre Recuperado',
};

@Injectable()
export class RecycleService {
  private readonly logger = new Logger(RecycleService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Procesa el reciclaje de un panel
   */
  async processRecycle(dto: ProcessRecycleDto): Promise<RecycleResponseDto> {
    const { assetId, operatorId, panelWeightKg = 20.0 } = dto;

    // 1. Verificar que el asset existe y tiene estado correcto
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { inspection: true },
    });

    if (!asset) {
      throw new NotFoundException('Asset no encontrado');
    }

    // Verificar estado - debe ser RECYCLED (aprobado para reciclaje) o tener inspección RECYCLE
    const validStatuses = [AssetStatus.RECYCLED, AssetStatus.INSPECTED];
    if (!validStatuses.includes(asset.status)) {
      // Verificar si la inspección recomienda reciclaje
      if (asset.inspection?.aiRecommendation !== 'RECYCLE') {
        throw new BadRequestException(
          `El panel no está aprobado para reciclaje. Estado actual: ${asset.status}`
        );
      }
    }

    // Verificar que no haya sido reciclado antes
    const existingRecord = await this.prisma.recycleRecord.findUnique({
      where: { assetId },
    });

    if (existingRecord) {
      throw new BadRequestException('Este panel ya fue reciclado');
    }

    // 2. Calcular materiales
    const materials = {
      aluminum: panelWeightKg * MATERIAL_PERCENTAGES.ALUMINUM,
      glass: panelWeightKg * MATERIAL_PERCENTAGES.GLASS,
      silicon: panelWeightKg * MATERIAL_PERCENTAGES.SILICON,
      copper: panelWeightKg * MATERIAL_PERCENTAGES.COPPER,
    };

    // 3. Crear hash para blockchain
    const recycleData = {
      assetId,
      operatorId,
      panelWeightKg,
      materials,
      timestamp: new Date().toISOString(),
    };
    const ipfsHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(recycleData))
      .digest('hex');

    // 4. Transacción en base de datos
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear registro de reciclaje
      const recycleRecord = await prisma.recycleRecord.create({
        data: {
          assetId,
          operatorId,
          panelWeightKg,
          aluminumKg: materials.aluminum,
          glassKg: materials.glass,
          siliconKg: materials.silicon,
          copperKg: materials.copper,
          ipfsHash,
        },
      });

      // Actualizar estado del asset
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.RECYCLED },
      });

      // Actualizar stock de materiales
      const stockUpdates = await Promise.all([
        this.upsertMaterialStock(prisma, MaterialType.ALUMINUM, materials.aluminum),
        this.upsertMaterialStock(prisma, MaterialType.GLASS, materials.glass),
        this.upsertMaterialStock(prisma, MaterialType.SILICON, materials.silicon),
        this.upsertMaterialStock(prisma, MaterialType.COPPER, materials.copper),
      ]);

      return { recycleRecord, stockUpdates };
    });

    // 5. Actualizar blockchain (asíncrono)
    let blockchainTxHash: string | null = null;
    try {
      const qrCode = asset.qrCode || asset.nfcTagId || asset.id;
      blockchainTxHash = await this.blockchainService.updatePanelStatus(
        qrCode,
        PanelStatus.RECYCLED,
        'Recycling Facility',
        ipfsHash,
      );

      // Actualizar el registro con el hash de la transacción
      await this.prisma.recycleRecord.update({
        where: { id: result.recycleRecord.id },
        data: { blockchainTxHash },
      });
    } catch (error) {
      this.logger.error('Error updating blockchain', error);
      // No fallar la operación si blockchain falla
    }

    // 6. Obtener stock actualizado
    const updatedStock = await this.getMaterialStock();

    return {
      success: true,
      message: 'Panel reciclado exitosamente. Materiales separados y registrados.',
      recycleRecord: {
        id: result.recycleRecord.id,
        assetId,
        panelWeightKg,
        materials,
        blockchainTxHash,
      },
      updatedStock: {
        aluminum: updatedStock.find(s => s.type === 'ALUMINUM')?.availableKg || 0,
        glass: updatedStock.find(s => s.type === 'GLASS')?.availableKg || 0,
        silicon: updatedStock.find(s => s.type === 'SILICON')?.availableKg || 0,
        copper: updatedStock.find(s => s.type === 'COPPER')?.availableKg || 0,
      },
    };
  }

  /**
   * Actualiza o crea el stock de un material
   */
  private async upsertMaterialStock(
    prisma: any,
    type: MaterialType,
    addKg: number,
  ) {
    const existing = await prisma.materialStock.findUnique({
      where: { type },
    });

    if (existing) {
      return prisma.materialStock.update({
        where: { type },
        data: {
          totalKg: { increment: addKg },
          availableKg: { increment: addKg },
        },
      });
    } else {
      return prisma.materialStock.create({
        data: {
          type,
          name: MATERIAL_NAMES[type],
          totalKg: addKg,
          availableKg: addKg,
          pricePerKg: MATERIAL_PRICES[type],
        },
      });
    }
  }

  /**
   * Obtiene el stock actual de materiales
   */
  async getMaterialStock(): Promise<MaterialStockDto[]> {
    const stocks = await this.prisma.materialStock.findMany({
      orderBy: { type: 'asc' },
    });

    // Si no hay stocks, retornar valores por defecto
    if (stocks.length === 0) {
      return Object.entries(MATERIAL_NAMES).map(([type, name]) => ({
        type,
        name,
        totalKg: 0,
        availableKg: 0,
        pricePerKg: MATERIAL_PRICES[type as keyof typeof MATERIAL_PRICES],
      }));
    }

    return stocks.map(s => ({
      type: s.type,
      name: s.name,
      totalKg: s.totalKg,
      availableKg: s.availableKg,
      pricePerKg: s.pricePerKg,
    }));
  }

  /**
   * Busca un asset para reciclaje por QR code
   */
  async findAssetForRecycle(qrCode: string) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        OR: [
          { qrCode },
          { nfcTagId: qrCode },
        ],
      },
      include: {
        inspection: true,
        recycleRecord: true,
      },
    });

    if (!asset) {
      return null;
    }

    // Verificar si ya fue reciclado
    if (asset.recycleRecord) {
      return {
        asset,
        canRecycle: false,
        reason: 'Este panel ya fue reciclado',
      };
    }

    // Verificar si está aprobado para reciclaje
    const isApprovedForRecycle = 
      asset.inspection?.aiRecommendation === 'RECYCLE' ||
      asset.status === AssetStatus.RECYCLED;

    return {
      asset,
      canRecycle: isApprovedForRecycle,
      reason: isApprovedForRecycle 
        ? 'Panel listo para reciclaje' 
        : `Estado actual: ${asset.status}. Se requiere aprobación de reciclaje.`,
    };
  }

  /**
   * Obtiene historial de reciclajes
   */
  async getRecycleHistory(limit = 50) {
    return this.prisma.recycleRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            qrCode: true,
            brand: true,
            model: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
```

---

## Paso 5: Crear Controlador de Reciclaje

Crear `src/recycle/recycle.controller.ts`:

```typescript
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RecycleService } from './recycle.service';
import { ProcessRecycleDto, RecycleResponseDto, MaterialStockDto } from './dto/recycle.dto';

@ApiTags('Recycle')
@Controller('recycle')
export class RecycleController {
  constructor(private readonly recycleService: RecycleService) {}

  @Post('process')
  @ApiOperation({ 
    summary: 'Procesar reciclaje de panel',
    description: 'Recicla un panel, separa los materiales y los registra en el inventario'
  })
  @ApiResponse({ status: 200, type: RecycleResponseDto })
  processRecycle(@Body() dto: ProcessRecycleDto) {
    return this.recycleService.processRecycle(dto);
  }

  @Get('check/:qrCode')
  @ApiOperation({ summary: 'Verificar si un panel puede ser reciclado' })
  checkRecycle(@Param('qrCode') qrCode: string) {
    return this.recycleService.findAssetForRecycle(qrCode);
  }

  @Get('materials')
  @ApiOperation({ summary: 'Obtener stock actual de materiales' })
  @ApiResponse({ status: 200, type: [MaterialStockDto] })
  getMaterialStock() {
    return this.recycleService.getMaterialStock();
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de reciclajes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(@Query('limit') limit?: number) {
    return this.recycleService.getRecycleHistory(limit);
  }
}
```

---

## Paso 6: Crear Módulo de Reciclaje

Crear `src/recycle/recycle.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RecycleController } from './recycle.controller';
import { RecycleService } from './recycle.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [RecycleController],
  providers: [RecycleService],
  exports: [RecycleService],
})
export class RecycleModule {}
```

---

## Paso 7: Registrar Módulo en AppModule

En `src/app.module.ts`, agregar:

```typescript
import { RecycleModule } from './recycle/recycle.module';

@Module({
  imports: [
    // ... otros módulos
    RecycleModule,
  ],
})
export class AppModule {}
```

---

## Verificación

### Probar endpoints

```bash
# Verificar si un panel puede ser reciclado
curl http://localhost:4000/recycle/check/QR-123456

# Procesar reciclaje
curl -X POST http://localhost:4000/recycle/process \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset-uuid-here",
    "operatorId": "operator-uuid-here",
    "panelWeightKg": 20
  }'

# Ver stock de materiales
curl http://localhost:4000/recycle/materials

# Ver historial
curl http://localhost:4000/recycle/history
```

### Respuesta esperada de proceso

```json
{
  "success": true,
  "message": "Panel reciclado exitosamente. Materiales separados y registrados.",
  "recycleRecord": {
    "id": "uuid",
    "assetId": "asset-uuid",
    "panelWeightKg": 20,
    "materials": {
      "aluminum": 7.0,
      "glass": 8.0,
      "silicon": 3.0,
      "copper": 2.0
    },
    "blockchainTxHash": "0x..."
  },
  "updatedStock": {
    "aluminum": 7.0,
    "glass": 8.0,
    "silicon": 3.0,
    "copper": 2.0
  }
}
```

---

## Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Modelos RecycleRecord y MaterialStock |
| `src/recycle/dto/recycle.dto.ts` | DTOs para reciclaje |
| `src/recycle/recycle.service.ts` | Lógica de negocio |
| `src/recycle/recycle.controller.ts` | Endpoints REST |
| `src/recycle/recycle.module.ts` | Módulo NestJS |

---

## Diagrama de Flujo

```
┌─────────────────┐
│  Escanear QR    │
│  (App Mobile)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GET /recycle/   │
│ check/:qrCode   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No
│ ¿Estado RECYCLE?├──────────► Error
└────────┬────────┘
         │ Sí
         ▼
┌─────────────────┐
│ Mostrar pantalla│
│ de confirmación │
└────────┬────────┘
         │ Confirmar
         ▼
┌─────────────────┐
│ POST /recycle/  │
│ process         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend:                            │
│ 1. Calcular materiales (kg)         │
│ 2. Crear RecycleRecord              │
│ 3. Actualizar MaterialStock         │
│ 4. Cambiar Asset → RECYCLED         │
│ 5. Actualizar blockchain            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Materiales      │
│ disponibles en  │
│ Marketplace     │
└─────────────────┘
```
