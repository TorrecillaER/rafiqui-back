---
description: Crear endpoint de historial de recolecciones para el collector
---

# Endpoint de Historial del Collector

Este workflow crea el endpoint del backend para obtener el historial de recolecciones completadas de un collector.

## Contexto

- **Backend**: NestJS en `rafiqui-back` (puerto 4000)
- **Modelo existente**: `CollectionRequest` en Prisma
- **Estados relevantes**: `COMPLETED`, `IN_PROGRESS`, `ASSIGNED`
- **Relación**: `CollectionRequest` tiene `assignedCollectorId` y `assets[]`

## Objetivo

Crear un endpoint `GET /collection-requests/history/:collectorId` que devuelva las recolecciones completadas de un collector con información agregada de paneles.

## Pasos

### 1. Agregar método en el servicio

Modificar `src/collection-requests/collection-requests.service.ts`:

```typescript
// Agregar este método al final de la clase CollectionRequestsService

async getCollectorHistory(collectorId: string, status?: string) {
  const where: any = {
    assignedCollectorId: collectorId,
  };

  // Por defecto, solo completadas. Si se pasa status, filtrar por ese
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    where.status = { in: statuses };
  } else {
    where.status = 'COMPLETED';
  }

  const requests = await this.prisma.collectionRequest.findMany({
    where,
    orderBy: { completedAt: 'desc' },
    include: {
      assets: {
        select: {
          id: true,
          status: true,
          brand: true,
          model: true,
        },
      },
    },
  });

  // Transformar para incluir información agregada
  return requests.map((request) => ({
    id: request.id,
    pickupAddress: request.pickupAddress,
    city: request.city,
    postalCode: request.postalCode,
    contactName: request.contactName,
    contactPhone: request.contactPhone,
    panelType: request.panelType,
    estimatedCount: request.estimatedCount,
    actualCount: request.assets.length,
    status: request.status,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
    assets: request.assets,
  }));
}
```

### 2. Agregar endpoint en el controlador

Modificar `src/collection-requests/collection-requests.controller.ts`:

```typescript
// Agregar este endpoint antes del findOne (para evitar conflicto con :id)

@Get('history/:collectorId')
async getCollectorHistory(
  @Param('collectorId') collectorId: string,
  @Query('status') status?: string,
) {
  return this.collectionRequestsService.getCollectorHistory(collectorId, status);
}
```

### 3. Agregar endpoint para obtener historial por email

Esto es útil cuando no tenemos el ID del collector pero sí su email:

```typescript
// Agregar en collection-requests.service.ts

async getCollectorHistoryByEmail(email: string, status?: string) {
  const collector = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!collector) {
    throw new NotFoundException(`Usuario con email ${email} no encontrado`);
  }

  return this.getCollectorHistory(collector.id, status);
}
```

```typescript
// Agregar en collection-requests.controller.ts

@Get('history-by-email/:email')
async getCollectorHistoryByEmail(
  @Param('email') email: string,
  @Query('status') status?: string,
) {
  return this.collectionRequestsService.getCollectorHistoryByEmail(email, status);
}
```

### 4. Agregar endpoint de estadísticas del collector

Crear estadísticas agregadas para el perfil del collector:

```typescript
// Agregar en collection-requests.service.ts

async getCollectorStats(collectorId: string) {
  const [completed, inProgress, totalAssets] = await Promise.all([
    this.prisma.collectionRequest.count({
      where: {
        assignedCollectorId: collectorId,
        status: 'COMPLETED',
      },
    }),
    this.prisma.collectionRequest.count({
      where: {
        assignedCollectorId: collectorId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    }),
    this.prisma.asset.count({
      where: {
        collectionRequest: {
          assignedCollectorId: collectorId,
        },
      },
    }),
  ]);

  // Calcular peso estimado (20kg por panel promedio)
  const estimatedWeightKg = totalAssets * 20;
  const estimatedWeightTons = estimatedWeightKg / 1000;

  return {
    completedCollections: completed,
    activeCollections: inProgress,
    totalPanelsCollected: totalAssets,
    estimatedWeightKg,
    estimatedWeightTons: Math.round(estimatedWeightTons * 10) / 10,
  };
}
```

```typescript
// Agregar en collection-requests.controller.ts

@Get('stats/:collectorId')
async getCollectorStats(@Param('collectorId') collectorId: string) {
  return this.collectionRequestsService.getCollectorStats(collectorId);
}
```

// turbo
### 5. Verificar compilación

```bash
npm run build
```

// turbo
### 6. Probar endpoints

```bash
# Obtener historial de un collector (reemplazar con ID real)
curl http://localhost:4000/collection-requests/history/COLLECTOR_ID

# Obtener historial con filtro de estado
curl "http://localhost:4000/collection-requests/history/COLLECTOR_ID?status=COMPLETED,IN_PROGRESS"

# Obtener estadísticas
curl http://localhost:4000/collection-requests/stats/COLLECTOR_ID
```

## Respuesta Esperada del Endpoint de Historial

```json
[
  {
    "id": "uuid-1",
    "pickupAddress": "Calle Principal 123",
    "city": "Monterrey",
    "postalCode": "64000",
    "contactName": "Juan Pérez",
    "contactPhone": "8181234567",
    "panelType": "residential",
    "estimatedCount": 50,
    "actualCount": 48,
    "status": "COMPLETED",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "completedAt": "2024-01-15T14:30:00.000Z",
    "assets": [
      { "id": "asset-1", "status": "WAREHOUSE_RECEIVED", "brand": "SunPower", "model": "X22" },
      { "id": "asset-2", "status": "INSPECTED", "brand": "LG", "model": "NeON R" }
    ]
  }
]
```

## Respuesta Esperada del Endpoint de Stats

```json
{
  "completedCollections": 15,
  "activeCollections": 2,
  "totalPanelsCollected": 850,
  "estimatedWeightKg": 17000,
  "estimatedWeightTons": 17
}
```

## Verificación Final

- [ ] Método `getCollectorHistory` agregado al servicio
- [ ] Endpoint `GET /collection-requests/history/:collectorId` funciona
- [ ] Endpoint `GET /collection-requests/history-by-email/:email` funciona
- [ ] Endpoint `GET /collection-requests/stats/:collectorId` funciona
- [ ] Compilación sin errores

## Siguiente Paso

Continúa con `/step-32-collector-history-mobile` para conectar la pantalla de historial de la app mobile con estos endpoints.
