---
description: Integrar blockchain automáticamente al crear/actualizar paneles
---

# Step 5: Integración Automática de Blockchain en Paneles

Este workflow integra el `BlockchainService` en el flujo principal de paneles para que cada vez que se cree o actualice un panel, se registre automáticamente en la blockchain.

## Prerrequisitos

- [ ] Backend NestJS funcionando
- [ ] Módulo `BlockchainModule` configurado y exportando `BlockchainService`
- [ ] Variables de entorno de blockchain configuradas:
  - `BLOCKCHAIN_RPC_URL`
  - `BLOCKCHAIN_PRIVATE_KEY`
  - `BLOCKCHAIN_CONTRACT_ADDRESS`

---

## Paso 1: Identificar el Servicio de Paneles

Buscar el servicio principal donde se crean los paneles:

```bash
grep -r "createPanel\|create.*panel\|Panel.*create" src/ --include="*.ts"
```

O buscar el servicio de paneles:

```bash
find src -name "*panel*.service.ts" -o -name "*solar*.service.ts"
```

---

## Paso 2: Importar BlockchainModule en el Módulo de Paneles

En el módulo donde está definido el servicio de paneles (ej: `panel.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
// ... otros imports

@Module({
  imports: [
    BlockchainModule, // ← Agregar esta línea
    // ... otros módulos
  ],
  // ... resto de la configuración
})
export class PanelModule {}
```

---

## Paso 3: Inyectar BlockchainService en el Servicio de Paneles

En el servicio de paneles (ej: `panel.service.ts`):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
// ... otros imports

@Injectable()
export class PanelService {
  private readonly logger = new Logger(PanelService.name);

  constructor(
    private readonly blockchainService: BlockchainService, // ← Agregar
    // ... otros servicios inyectados
  ) {}

  // ... resto del servicio
}
```

---

## Paso 4: Integrar Registro en Blockchain al Crear Panel

Modificar el método de creación de paneles:

```typescript
async createPanel(createPanelDto: CreatePanelDto): Promise<Panel> {
  // 1. Guardar en base de datos
  const panel = await this.panelRepository.save({
    ...createPanelDto,
    // ... otros campos
  });

  // 2. Registrar en blockchain (async, no bloquea)
  this.registerInBlockchain(panel).catch(err => {
    this.logger.error(`Failed to register panel ${panel.qrCode} in blockchain`, err);
  });

  return panel;
}

/**
 * Registra el panel en la blockchain de forma asíncrona
 */
private async registerInBlockchain(panel: Panel): Promise<void> {
  if (!this.blockchainService.isConnected()) {
    this.logger.warn('Blockchain not connected, skipping registration');
    return;
  }

  try {
    const txHash = await this.blockchainService.registerPanel(
      panel.qrCode,
      panel.brand || 'Unknown',
      panel.model || 'Unknown',
      panel.location || 'Unknown',
      '' // ipfsHash - opcional
    );
    
    this.logger.log(`Panel ${panel.qrCode} registered in blockchain: ${txHash}`);
    
    // Opcional: Guardar el txHash en la base de datos
    await this.panelRepository.update(panel.id, { blockchainTxHash: txHash });
  } catch (error) {
    this.logger.error(`Blockchain registration failed for ${panel.qrCode}`, error);
    // No lanzar error para no afectar el flujo principal
  }
}
```

---

## Paso 5: Integrar Actualización de Estado en Blockchain

Modificar el método de actualización de estado:

```typescript
import { PanelStatus } from '../blockchain/blockchain.service';

async updatePanelStatus(
  qrCode: string, 
  newStatus: string, 
  location: string
): Promise<Panel> {
  // 1. Actualizar en base de datos
  const panel = await this.panelRepository.findOne({ where: { qrCode } });
  if (!panel) {
    throw new NotFoundException(`Panel ${qrCode} not found`);
  }
  
  panel.status = newStatus;
  panel.location = location;
  await this.panelRepository.save(panel);

  // 2. Actualizar en blockchain
  this.updateStatusInBlockchain(qrCode, newStatus, location).catch(err => {
    this.logger.error(`Failed to update status in blockchain for ${qrCode}`, err);
  });

  return panel;
}

/**
 * Mapea el estado de la aplicación al enum de blockchain
 */
private mapStatusToBlockchain(status: string): PanelStatus {
  const statusMap: Record<string, PanelStatus> = {
    'collected': PanelStatus.COLLECTED,
    'warehouse_received': PanelStatus.WAREHOUSE_RECEIVED,
    'inspected': PanelStatus.INSPECTED,
    'reuse_approved': PanelStatus.REUSE_APPROVED,
    'recycle_approved': PanelStatus.RECYCLE_APPROVED,
    'art_approved': PanelStatus.ART_APPROVED,
    'sold': PanelStatus.SOLD,
    'recycled': PanelStatus.RECYCLED,
    'art_minted': PanelStatus.ART_MINTED,
  };
  
  return statusMap[status.toLowerCase()] ?? PanelStatus.COLLECTED;
}

private async updateStatusInBlockchain(
  qrCode: string, 
  status: string, 
  location: string
): Promise<void> {
  if (!this.blockchainService.isConnected()) {
    return;
  }

  try {
    const blockchainStatus = this.mapStatusToBlockchain(status);
    const txHash = await this.blockchainService.updatePanelStatus(
      qrCode,
      blockchainStatus,
      location,
      '' // ipfsHash
    );
    
    this.logger.log(`Panel ${qrCode} status updated in blockchain: ${txHash}`);
  } catch (error) {
    this.logger.error(`Blockchain status update failed for ${qrCode}`, error);
  }
}
```

---

## Paso 6: Agregar Campo blockchainTxHash a la Entidad (Opcional)

Si quieres guardar el hash de la transacción:

```typescript
// panel.entity.ts
@Entity()
export class Panel {
  // ... otros campos

  @Column({ nullable: true })
  blockchainTxHash: string;

  @Column({ nullable: true })
  blockchainRegisteredAt: Date;
}
```

Luego ejecutar migración:

```bash
npm run migration:generate -- -n AddBlockchainFields
npm run migration:run
```

---

## Paso 7: Verificar Integración

### 7.1 Verificar conexión blockchain

```bash
curl http://localhost:4000/blockchain/status
```

Respuesta esperada:
```json
{"connected": true}
```

### 7.2 Crear un panel de prueba

```bash
curl -X POST http://localhost:4000/panels \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-INTEGRATION-TEST",
    "brand": "TestBrand",
    "model": "TestModel",
    "location": "Test Location"
  }'
```

### 7.3 Verificar en blockchain

```bash
curl http://localhost:4000/blockchain/panel/PANEL-INTEGRATION-TEST
```

### 7.4 Ver logs del backend

Deberías ver logs como:
```
[PanelService] Panel PANEL-INTEGRATION-TEST registered in blockchain: 0x...
```

---

## Manejo de Errores y Consideraciones

### Estrategia de Registro Asíncrono

El registro en blockchain se hace de forma **asíncrona** para no bloquear el flujo principal:

```typescript
// ✅ Correcto - No bloquea
this.registerInBlockchain(panel).catch(err => {
  this.logger.error('Blockchain error', err);
});

// ❌ Incorrecto - Bloquea y puede fallar
await this.registerInBlockchain(panel);
```

### Cola de Reintentos (Opcional Avanzado)

Para mayor robustez, considera usar una cola de mensajes (Bull/Redis):

```typescript
// En panel.service.ts
await this.blockchainQueue.add('register-panel', {
  qrCode: panel.qrCode,
  brand: panel.brand,
  model: panel.model,
  location: panel.location,
});
```

---

## Verificación Final

- [ ] `BlockchainModule` importado en el módulo de paneles
- [ ] `BlockchainService` inyectado en el servicio de paneles
- [ ] Método `createPanel` llama a `registerInBlockchain`
- [ ] Método `updateStatus` llama a `updateStatusInBlockchain`
- [ ] Logs muestran transacciones exitosas
- [ ] Paneles verificables en blockchain vía endpoint o PolygonScan

---

## Troubleshooting

### Error: "Blockchain not connected"
- Verificar variables de entorno `BLOCKCHAIN_*`
- Verificar que el contrato esté desplegado

### Error: "insufficient funds"
- Obtener más MATIC del faucet: https://faucet.polygon.technology/

### Error: "panel already exists"
- El panel ya fue registrado en blockchain
- Verificar con `GET /blockchain/panel/:qrCode`

### Transacción muy lenta
- La red Amoy puede tener congestión
- Verificar en PolygonScan el estado de la transacción
