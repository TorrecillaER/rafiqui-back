# Diagrama Entidad-Relación - Rafiqui Backend

Base de datos PostgreSQL con trazabilidad completa de paneles solares desde recolección hasta reciclaje/reutilización.

## Diagrama Completo

```mermaid
erDiagram
    User ||--o{ CollectionRequest : "dona (DonorRequests)"
    User ||--o{ CollectionRequest : "colecta (AssignedCollector)"
    User ||--o{ Inspection : "inspecciona"
    User ||--o{ RecycleRecord : "procesa reciclaje"
    User ||--o{ MaterialOrder : "compra materiales"
    
    CollectionRequest ||--o{ Asset : "contiene"
    
    Asset ||--o| Inspection : "es inspeccionado"
    Asset ||--o| ArtPiece : "se convierte en arte"
    Asset ||--o| RecycleRecord : "se recicla"
    
    User {
        uuid id PK
        string email UK "Único"
        string password
        string name
        enum role "DONOR|OPERATOR|PARTNER|ADMIN"
        string walletAddress "Wallet blockchain (opcional)"
        timestamp createdAt
    }
    
    CollectionRequest {
        uuid id PK
        uuid donorId FK "Nullable"
        uuid assignedCollectorId FK "Nullable"
        string pickupAddress
        string city
        string postalCode
        int estimatedCount
        string panelType
        string contactName
        string contactPhone
        string notes "Nullable"
        string status "Default: PENDING"
        timestamp createdAt
        timestamp completedAt "Nullable"
    }
    
    Asset {
        uuid id PK
        string nfcTagId UK "Único, Nullable"
        string qrCode "Nullable"
        enum status "AssetStatus"
        string brand "Nullable"
        string model "Nullable"
        uuid collectionRequestId FK "Nullable"
        uuid inspectorId "Nullable"
        timestamp inspectionStartedAt "Nullable"
        timestamp inspectedAt "Nullable"
        uuid refurbishedById "Nullable"
        timestamp refurbishedAt "Nullable"
        string refurbishmentNotes "Nullable"
        float measuredPowerWatts "Nullable"
        float measuredVoltage "Nullable"
        float capacityRetainedPercent "Nullable"
        float healthPercentage "Nullable"
        float dimensionLength "Nullable"
        float dimensionWidth "Nullable"
        float dimensionHeight "Nullable"
        timestamp createdAt
    }
    
    Inspection {
        uuid id PK
        uuid assetId FK_UK "Único - relación 1:1"
        uuid inspectorId FK
        float measuredVoltage
        float measuredAmps
        string physicalCondition
        string photoUrl "Nullable"
        string notes "Nullable"
        enum aiRecommendation "REUSE|RECYCLE|ART"
        timestamp createdAt
    }
    
    RecycleRecord {
        uuid id PK
        uuid assetId FK_UK "Único - relación 1:1"
        uuid operatorId FK
        float panelWeightKg "Default: 20.0"
        float aluminumKg "35% del peso"
        float glassKg "40% del peso"
        float siliconKg "15% del peso"
        float copperKg "10% del peso"
        string blockchainTxHash "RafiquiTracker, Nullable"
        string materialsTxHash "RafiquiMaterials ERC-1155, Nullable"
        string ipfsHash "Hash de datos, Nullable"
        timestamp createdAt
    }
    
    MaterialStock {
        uuid id PK
        enum type UK "ALUMINUM|GLASS|SILICON|COPPER - Único"
        string name
        float totalKg "Default: 0"
        float availableKg "Default: 0"
        float reservedKg "Default: 0"
        float pricePerKg "USD/kg"
        timestamp updatedAt
        timestamp createdAt
    }
    
    MaterialOrder {
        uuid id PK
        uuid buyerId FK
        enum materialType "ALUMINUM|GLASS|SILICON|COPPER"
        float quantityKg
        float pricePerKg
        float totalPrice
        string buyerWallet "Dirección Ethereum"
        enum status "PENDING|PROCESSING|COMPLETED|FAILED|CANCELLED"
        string blockchainTxHash "TX de transferencia ERC-1155, Nullable"
        timestamp createdAt
        timestamp completedAt "Nullable"
    }
    
    ArtPiece {
        uuid id PK
        uuid sourceAssetId FK_UK "Único - relación 1:1, Nullable"
        string title
        string artist
        string description
        float price
        string currency "Default: USD"
        enum category "NFT|SCULPTURE|INSTALLATION"
        string imageUrl "Nullable"
        boolean isAvailable "Default: true"
        string tokenId UK "Token ID del NFT, Único, Nullable"
        string contractAddress "Dirección del contrato, Nullable"
        timestamp createdAt
        timestamp updatedAt
    }
```

## Enums

### Role
```
DONOR      - Donante de paneles
OPERATOR   - Operador (colector, inspector, técnico)
PARTNER    - Socio comercial
ADMIN      - Administrador del sistema
```

### AssetStatus
```
PENDING_COLLECTION    - Pendiente de recolección
IN_TRANSIT           - En tránsito
WAREHOUSE_RECEIVED   - Recibido en almacén
INSPECTING           - En proceso de inspección
INSPECTED            - Inspeccionado
RECYCLED             - Reciclado
REUSED               - Reutilizado
READY_FOR_REUSE      - Listo para reutilizar
REFURBISHING         - En reacondicionamiento
LISTED_FOR_SALE      - Listado para venta
ART_CANDIDATE        - Candidato para arte
ART_LISTED_FOR_SALE  - Arte listado para venta
```

### InspectionResult
```
REUSE    - Panel apto para reutilización
RECYCLE  - Panel debe reciclarse
ART      - Panel candidato para arte
```

### ArtCategory
```
NFT          - NFT digital
SCULPTURE    - Escultura física
INSTALLATION - Instalación artística
```

### MaterialType
```
ALUMINUM - Aluminio reciclado (35% del panel)
GLASS    - Vidrio solar premium (40% del panel)
SILICON  - Silicio purificado (15% del panel)
COPPER   - Cobre recuperado (10% del panel)
```

### OrderStatus
```
PENDING    - Orden pendiente
PROCESSING - En procesamiento
COMPLETED  - Completada
FAILED     - Fallida
CANCELLED  - Cancelada
```

## Relaciones Clave

### 1:1 (Uno a Uno)
- **Asset ↔ Inspection**: Un panel tiene máximo una inspección
- **Asset ↔ RecycleRecord**: Un panel puede reciclarse solo una vez
- **Asset ↔ ArtPiece**: Un panel puede convertirse en una obra de arte

### 1:N (Uno a Muchos)
- **User → CollectionRequest** (como donante)
- **User → CollectionRequest** (como colector)
- **User → Inspection** (como inspector)
- **User → RecycleRecord** (como operador)
- **User → MaterialOrder** (como comprador)
- **CollectionRequest → Asset**

### Índices Únicos
- `User.email`
- `Asset.nfcTagId`
- `Inspection.assetId`
- `RecycleRecord.assetId`
- `ArtPiece.sourceAssetId`
- `ArtPiece.tokenId`
- `MaterialStock.type`

## Flujo de Datos Principal

```
1. CollectionRequest (Donante solicita recolección)
   ↓
2. Asset (Colector registra paneles con QR/NFC)
   ↓
3. Inspection (Inspector evalúa panel)
   ↓
4a. RecycleRecord (Si aiRecommendation = RECYCLE)
    → MaterialStock actualizado
    → Tokens ERC-1155 minteados
    → MaterialOrder (Comprador adquiere materiales)
   
4b. Asset.status = READY_FOR_REUSE (Si aiRecommendation = REUSE)
    → Reacondicionamiento
    → Venta en marketplace
   
4c. ArtPiece (Si aiRecommendation = ART)
    → NFT minteado
    → Galería de arte
```

## Integración Blockchain

### RafiquiTracker (Trazabilidad)
- Registra cada panel con `registerPanel()`
- Actualiza estados con `updatePanelStatus()`
- Almacena: `RecycleRecord.blockchainTxHash`

### RafiquiMaterials (ERC-1155)
- Mintea tokens de materiales con `mintFromRecycle()`
- Transfiere tokens con `transferToBuyer()`
- Almacena: `RecycleRecord.materialsTxHash`, `MaterialOrder.blockchainTxHash`

### RafiquiTracker (NFT Arte)
- Mintea NFTs de arte con `mintArtNFT()`
- Almacena: `ArtPiece.tokenId`, `ArtPiece.contractAddress`

## Campos de Trazabilidad

Cada modelo incluye timestamps para auditoría:
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de última actualización (MaterialStock, ArtPiece)
- `completedAt` - Fecha de completado (CollectionRequest, MaterialOrder)
- `inspectedAt` - Fecha de inspección (Asset)
- `refurbishedAt` - Fecha de reacondicionamiento (Asset)

## Notas Técnicas

- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **IDs**: UUID v4 para todos los modelos
- **Relaciones**: Definidas con `@relation` y nombres explícitos
- **Validación**: Enums garantizan valores válidos
- **Integridad**: Foreign keys con cascada según necesidad
