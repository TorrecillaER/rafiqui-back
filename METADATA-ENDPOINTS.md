# 🖼️ Endpoints de Metadata para NFTs

Este documento describe cómo usar los endpoints de metadata para que los NFTs aparezcan automáticamente en wallets y marketplaces.

## 📍 Endpoints disponibles

### 1. Metadata de Obras de Arte
```
GET /metadata/art/:tokenId
```

**Ejemplo:**
```bash
curl http://localhost:4000/metadata/art/1
```

**Respuesta:**
```json
{
  "name": "Solar Decay #123",
  "description": "Una exploración de la belleza en la obsolescencia tecnológica...",
  "image": "https://res.cloudinary.com/rafiqui/image/upload/v123/art-piece.jpg",
  "external_url": "https://rafiqui.com/gallery/abc-123",
  "background_color": "102038",
  "attributes": [
    { "trait_type": "Artist", "value": "María González" },
    { "trait_type": "Category", "value": "NFT" },
    { "trait_type": "Price", "value": 2500 },
    { "trait_type": "Panel Brand", "value": "Canadian Solar" },
    { "trait_type": "Panel Model", "value": "CS6K-300MS" },
    { "trait_type": "Created", "value": 1705282800, "display_type": "date" }
  ]
}
```

---

### 2. Metadata de Paneles Reacondicionados
```
GET /metadata/panel/:tokenId
```

**Ejemplo:**
```bash
curl http://localhost:4000/metadata/panel/5
```

**Respuesta:**
```json
{
  "name": "Rafiqui Panel - Canadian Solar CS6K-300MS",
  "description": "A refurbished solar panel from Rafiqui's circular economy program...",
  "image": "https://rafiqui.com/images/default-panel.png",
  "external_url": "https://rafiqui.com/marketplace/panels/xyz-789",
  "background_color": "93E1D8",
  "attributes": [
    { "trait_type": "Brand", "value": "Canadian Solar" },
    { "trait_type": "Model", "value": "CS6K-300MS" },
    { "trait_type": "Status", "value": "REUSED" },
    { "trait_type": "Power (W)", "value": 300 },
    { "trait_type": "Health (%)", "value": 95 },
    { "trait_type": "Capacity Retained (%)", "value": 92 },
    { "trait_type": "Registered", "value": 1705282800, "display_type": "date" }
  ]
}
```

---

## 🔗 Configuración del Contrato

Para que los NFTs aparezcan automáticamente en wallets, tu contrato debe implementar `tokenURI`:

### Código Solidity necesario:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract RafiquiTracker is ERC721 {
    using Strings for uint256;
    
    string private _baseTokenURI;
    
    constructor(string memory baseURI) ERC721("Rafiqui NFT", "RFQNFT") {
        _baseTokenURI = baseURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }
    
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
}
```

---

## ⚙️ Configuración después del despliegue

### 1. Desplegar el contrato con baseURI

**Para obras de arte:**
```javascript
const contract = await RafiquiTracker.deploy("https://tu-backend.com/metadata/art/");
```

**Para paneles:**
```javascript
const contract = await RafiquiTracker.deploy("https://tu-backend.com/metadata/panel/");
```

### 2. O actualizar baseURI después del despliegue

```javascript
await contract.setBaseURI("https://tu-backend.com/metadata/art/");
```

---

## 🧪 Pruebas

### Probar endpoint localmente:

```bash
# Iniciar el servidor
npm run start:dev

# Probar metadata de arte
curl http://localhost:4000/metadata/art/1 | jq

# Probar metadata de panel
curl http://localhost:4000/metadata/panel/1 | jq
```

### Verificar en el contrato:

```javascript
// Llamar a tokenURI en el contrato
const uri = await contract.tokenURI(1);
console.log(uri); // Debe retornar: https://tu-backend.com/metadata/art/1
```

---

## 🌐 Despliegue en producción

### Requisitos:

1. **Backend accesible públicamente** (no localhost)
   - Usar servicio como Railway, Render, Heroku, etc.
   - Ejemplo: `https://rafiqui-backend.railway.app`

2. **CORS configurado** para permitir peticiones desde wallets
   ```typescript
   // En main.ts
   app.enableCors({
     origin: '*', // Para metadata pública
     methods: 'GET',
   });
   ```

3. **HTTPS habilitado** (requerido por la mayoría de wallets)

4. **Caché configurado** (opcional pero recomendado)
   - Los headers `Cache-Control` ya están configurados (1 hora)

---

## 📱 Resultado esperado

Después de configurar todo correctamente:

1. **MetaMask**: El NFT aparecerá con su imagen y nombre
2. **OpenSea**: La metadata se mostrará automáticamente
3. **Rarible**: Los atributos se mostrarán en la página del NFT
4. **Cualquier wallet compatible con ERC-721**: Mostrará la información

---

## 🔍 Verificación en PolygonScan

1. Ve a tu contrato en PolygonScan Amoy
2. Busca la función `tokenURI`
3. Ingresa un tokenId
4. Verifica que retorna la URL correcta
5. Copia la URL y ábrela en el navegador
6. Debe mostrar el JSON de metadata

**Ejemplo:**
```
https://amoy.polygonscan.com/address/TU_CONTRATO#readContract
```

---

## 🐛 Troubleshooting

### El NFT no aparece en la wallet:
- ✅ Verifica que `tokenURI` retorna la URL correcta
- ✅ Verifica que el endpoint responde con JSON válido
- ✅ Verifica que el backend es accesible públicamente
- ✅ Espera unos minutos (las wallets cachean metadata)

### Error 404 en metadata:
- ✅ Verifica que el tokenId existe en la base de datos
- ✅ Verifica que el campo `tokenId` está correctamente guardado

### Imagen no se muestra:
- ✅ Verifica que la URL de la imagen es accesible públicamente
- ✅ Verifica que usa HTTPS
- ✅ Verifica que el formato es soportado (PNG, JPG, GIF, SVG)

---

## 📚 Recursos adicionales

- [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Polygon Documentation](https://docs.polygon.technology/)
