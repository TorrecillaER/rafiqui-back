---
description: Crear endpoint de estadísticas del inspector para la app mobile
---

# Endpoint de Estadísticas del Inspector

Este workflow crea el endpoint del backend para obtener las estadísticas de un inspector específico, incluyendo conteos de inspecciones por resultado y últimas inspecciones realizadas.

## Contexto

- **Backend**: NestJS en `rafiqui-back` (puerto 4000)
- **Modelos existentes**: `Inspection`, `Asset`, `User` en Prisma
- **Enum InspectionResult**: `REUSE`, `RECYCLE`, `ART`
- **Relación**: `Inspection` tiene `inspectorId` y `aiRecommendation`

## Objetivo

Crear endpoints para:
1. `GET /inspections/stats/:inspectorId` - Estadísticas del inspector
2. `GET /inspections/recent/:inspectorId` - Últimas inspecciones del inspector

## Pasos

### 1. Crear módulo de inspecciones (si no existe)

Crear `src/inspections/inspections.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
```

### 2. Crear servicio de inspecciones

Crear `src/inspections/inspections.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionResult } from '@prisma/client';

export interface InspectorStats {
  recyclingCount: number;
  reuseCount: number;
  artCount: number;
  totalInspections: number;
  monthlyGoalProgress: number;
  impactHighlight: string;
  impactMessage: string;
  inspectorName: string;
  stationId: string;
}

export interface RecentInspectionDto {
  id: string;
  panelId: string;
  panelType: string;
  status: 'approved' | 'rejected' | 'inReview';
  result: InspectionResult;
  inspectedAt: Date;
}

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async getInspectorStats(inspectorId: string): Promise<InspectorStats> {
    // Verificar que el inspector existe
    const inspector = await this.prisma.user.findUnique({
      where: { id: inspectorId },
      select: { id: true, name: true },
    });

    if (!inspector) {
      throw new NotFoundException(`Inspector con ID ${inspectorId} no encontrado`);
    }

    // Contar inspecciones por resultado
    const [recyclingCount, reuseCount, artCount] = await Promise.all([
      this.prisma.inspection.count({
        where: {
          inspectorId,
          aiRecommendation: InspectionResult.RECYCLE,
        },
      }),
      this.prisma.inspection.count({
        where: {
          inspectorId,
          aiRecommendation: InspectionResult.REUSE,
        },
      }),
      this.prisma.inspection.count({
        where: {
          inspectorId,
          aiRecommendation: InspectionResult.ART,
        },
      }),
    ]);

    const totalInspections = recyclingCount + reuseCount + artCount;

    // Calcular progreso de meta mensual (ejemplo: meta de 200 inspecciones/mes)
    const monthlyGoal = 200;
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthCount = await this.prisma.inspection.count({
      where: {
        inspectorId,
        createdAt: { gte: currentMonth },
      },
    });

    const monthlyGoalProgress = Math.min(thisMonthCount / monthlyGoal, 1);

    // Calcular impacto (basado en materiales reciclados)
    const recycleRecords = await this.prisma.recycleRecord.findMany({
      where: {
        asset: {
          inspection: {
            inspectorId,
          },
        },
      },
      select: {
        glassKg: true,
        aluminumKg: true,
      },
    });

    const totalGlassKg = recycleRecords.reduce((sum, r) => sum + r.glassKg, 0);
    const totalAluminumKg = recycleRecords.reduce((sum, r) => sum + r.aluminumKg, 0);

    // Generar mensaje de impacto
    let impactHighlight = '';
    let impactMessage = '';

    if (totalGlassKg >= 1000) {
      const tons = (totalGlassKg / 1000).toFixed(1);
      impactHighlight = `${tons} toneladas`;
      impactMessage = 'de vidrio recuperado han sido donadas para generar cemento en zonas vulnerables.';
    } else if (totalAluminumKg >= 100) {
      impactHighlight = `${Math.round(totalAluminumKg)} kg`;
      impactMessage = 'de aluminio reciclado, equivalente a evitar la extracción de bauxita.';
    } else if (totalInspections > 0) {
      impactHighlight = `${totalInspections} paneles`;
      impactMessage = 'inspeccionados contribuyendo a la economía circular de energía solar.';
    } else {
      impactHighlight = '¡Comienza hoy!';
      impactMessage = 'Cada panel que inspecciones contribuye al medio ambiente.';
    }

    // Generar ID de estación basado en el inspector
    const stationId = `#${(inspectorId.charCodeAt(0) % 10).toString().padStart(2, '0')}`;

    return {
      recyclingCount,
      reuseCount,
      artCount,
      totalInspections,
      monthlyGoalProgress,
      impactHighlight,
      impactMessage,
      inspectorName: inspector.name,
      stationId,
    };
  }

  async getRecentInspections(inspectorId: string, limit: number = 10): Promise<RecentInspectionDto[]> {
    const inspections = await this.prisma.inspection.findMany({
      where: { inspectorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        asset: {
          select: {
            id: true,
            brand: true,
            model: true,
            status: true,
          },
        },
      },
    });

    return inspections.map((inspection) => {
      // Determinar status basado en el estado del asset
      let status: 'approved' | 'rejected' | 'inReview' = 'inReview';
      const assetStatus = inspection.asset.status;
      
      if (['RECYCLED', 'REUSED', 'LISTED_FOR_SALE', 'ART_LISTED_FOR_SALE'].includes(assetStatus)) {
        status = 'approved';
      } else if (assetStatus === 'INSPECTED' || assetStatus === 'READY_FOR_REUSE' || assetStatus === 'REFURBISHING') {
        status = 'approved';
      } else if (assetStatus === 'INSPECTING') {
        status = 'inReview';
      }

      // Generar tipo de panel
      const brand = inspection.asset.brand || 'Panel Solar';
      const model = inspection.asset.model || '';
      const panelType = model ? `${brand} ${model}` : brand;

      // Generar ID corto
      const shortId = `ID-${inspection.id.substring(0, 4).toUpperCase()}`;

      return {
        id: shortId,
        panelId: inspection.asset.id,
        panelType,
        status,
        result: inspection.aiRecommendation,
        inspectedAt: inspection.createdAt,
      };
    });
  }

  async getInspectorStatsByEmail(email: string): Promise<InspectorStats> {
    const inspector = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!inspector) {
      throw new NotFoundException(`Inspector con email ${email} no encontrado`);
    }

    return this.getInspectorStats(inspector.id);
  }
}
```

### 3. Crear controlador de inspecciones

Crear `src/inspections/inspections.controller.ts`:

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get('stats/:inspectorId')
  async getInspectorStats(@Param('inspectorId') inspectorId: string) {
    return this.inspectionsService.getInspectorStats(inspectorId);
  }

  @Get('stats-by-email/:email')
  async getInspectorStatsByEmail(@Param('email') email: string) {
    return this.inspectionsService.getInspectorStatsByEmail(email);
  }

  @Get('recent/:inspectorId')
  async getRecentInspections(
    @Param('inspectorId') inspectorId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.inspectionsService.getRecentInspections(inspectorId, limitNum);
  }
}
```

### 4. Registrar módulo en app.module.ts

Agregar en `src/app.module.ts`:

```typescript
import { InspectionsModule } from './inspections/inspections.module';

@Module({
  imports: [
    // ... otros módulos
    InspectionsModule,
  ],
})
export class AppModule {}
```

// turbo
### 5. Verificar compilación

```bash
npm run build
```

// turbo
### 6. Probar endpoints

```bash
# Obtener estadísticas de un inspector
curl http://localhost:4000/inspections/stats/INSPECTOR_ID

# Obtener últimas inspecciones
curl "http://localhost:4000/inspections/recent/INSPECTOR_ID?limit=5"

# Obtener stats por email
curl http://localhost:4000/inspections/stats-by-email/inspector@example.com
```

## Respuesta Esperada del Endpoint de Stats

```json
{
  "recyclingCount": 124,
  "reuseCount": 45,
  "artCount": 12,
  "totalInspections": 181,
  "monthlyGoalProgress": 0.75,
  "impactHighlight": "2 toneladas",
  "impactMessage": "de vidrio recuperado han sido donadas para generar cemento en zonas vulnerables.",
  "inspectorName": "Inspector Mateo",
  "stationId": "#04"
}
```

## Respuesta Esperada del Endpoint de Recent

```json
[
  {
    "id": "ID-4920",
    "panelId": "uuid-del-asset",
    "panelType": "SunPower X22",
    "status": "approved",
    "result": "REUSE",
    "inspectedAt": "2024-01-15T14:30:00.000Z"
  },
  {
    "id": "ID-4919",
    "panelId": "uuid-del-asset-2",
    "panelType": "LG NeON R",
    "status": "approved",
    "result": "RECYCLE",
    "inspectedAt": "2024-01-15T14:15:00.000Z"
  }
]
```

## Verificación Final

- [ ] Módulo `InspectionsModule` creado
- [ ] Servicio `InspectionsService` con métodos de stats y recent
- [ ] Controlador con endpoints funcionando
- [ ] Módulo registrado en `AppModule`
- [ ] Compilación sin errores

## Siguiente Paso

Continúa con `/step-34-inspector-home-mobile` para conectar la pantalla del home del inspector con estos endpoints.
