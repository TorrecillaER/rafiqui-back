#!/bin/bash

# Script de pruebas para Step 20: Compra de Obras de Arte con Transferencia de NFT
# Este script prueba el flujo completo de compra de una obra de arte

BASE_URL="http://localhost:4000"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}=== Test Step 20: Compra de Obras de Arte con Transferencia de NFT ===${NC}\n"

# Variables globales
ASSET_ID=""
ART_PIECE_ID=""
TOKEN=""
ART_TOKEN_ID=""
BUYER_WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"

# Paso 1: Login como operador
echo -e "${BLUE}${BOLD}Paso 1: Login como operador${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@rafiqui.com",
    "password": "operator123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login exitoso${NC}"
  echo "Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Error en login${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo ""

# Paso 2: Crear panel para arte
echo -e "${BLUE}${BOLD}Paso 2: Crear panel candidato para arte${NC}"
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "QR-ART-'$(date +%s)'",
    "brand": "SunPower",
    "model": "X-Series",
    "status": "IN_TRANSIT"
  }')

ASSET_ID=$(echo $ASSET_RESPONSE | jq -r '.id')

if [ "$ASSET_ID" != "null" ] && [ -n "$ASSET_ID" ]; then
  echo -e "${GREEN}✓ Panel creado${NC}"
  echo "Asset ID: $ASSET_ID"
  echo "QR Code: $(echo $ASSET_RESPONSE | jq -r '.qrCode')"
else
  echo -e "${RED}✗ Error al crear panel${NC}"
  echo $ASSET_RESPONSE | jq '.'
  exit 1
fi

echo ""

# Paso 3: Crear inspección con recomendación ART
echo -e "${BLUE}${BOLD}Paso 3: Crear inspección con recomendación ART${NC}"
INSPECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assetId": "'$ASSET_ID'",
    "inspectorId": "inspector-id-placeholder",
    "measuredVoltage": 12.5,
    "measuredAmps": 2.8,
    "physicalCondition": "Daño estético único, patrón interesante",
    "notes": "Panel con características visuales únicas, ideal para arte"
  }')

INSPECTION_ID=$(echo $INSPECTION_RESPONSE | jq -r '.id')

if [ "$INSPECTION_ID" != "null" ] && [ -n "$INSPECTION_ID" ]; then
  echo -e "${GREEN}✓ Inspección creada${NC}"
  echo "Inspection ID: $INSPECTION_ID"
  echo "Recomendación: $(echo $INSPECTION_RESPONSE | jq -r '.aiRecommendation')"
else
  echo -e "${RED}✗ Error al crear inspección${NC}"
  echo $INSPECTION_RESPONSE | jq '.'
fi

echo ""

# Paso 4: Crear obra de arte desde el asset
echo -e "${BLUE}${BOLD}Paso 4: Crear obra de arte y mintear NFT${NC}"
ART_RESPONSE=$(curl -s -X POST "$BASE_URL/art/from-asset/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Solar Decay #'$(date +%s)'",
    "artist": "María González",
    "description": "Una exploración de la belleza en la obsolescencia tecnológica. Este panel solar captura la intersección entre funcionalidad perdida y estética emergente.",
    "price": 2500,
    "category": "NFT"
  }')

ART_PIECE_ID=$(echo $ART_RESPONSE | jq -r '.id')
ART_TOKEN_ID=$(echo $ART_RESPONSE | jq -r '.tokenId')

if [ "$ART_PIECE_ID" != "null" ] && [ -n "$ART_PIECE_ID" ]; then
  echo -e "${GREEN}✓ Obra de arte creada${NC}"
  echo "Art Piece ID: $ART_PIECE_ID"
  echo "Token ID: $ART_TOKEN_ID"
  echo "Título: $(echo $ART_RESPONSE | jq -r '.title')"
  echo "Artista: $(echo $ART_RESPONSE | jq -r '.artist')"
  echo "Precio: \$$(echo $ART_RESPONSE | jq -r '.price')"
  echo "Blockchain TX: $(echo $ART_RESPONSE | jq -r '.blockchainTxHash')"
else
  echo -e "${RED}✗ Error al crear obra de arte${NC}"
  echo $ART_RESPONSE | jq '.'
fi

echo ""

# Paso 5: Obtener obras de arte disponibles en marketplace
echo -e "${BLUE}${BOLD}Paso 5: Obtener obras de arte disponibles en marketplace${NC}"
AVAILABLE_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/art/available")

AVAILABLE_COUNT=$(echo $AVAILABLE_RESPONSE | jq '. | length')

echo -e "${GREEN}✓ Obras disponibles: $AVAILABLE_COUNT${NC}"
echo ""
echo "Primeras 3 obras:"
echo $AVAILABLE_RESPONSE | jq '.[0:3] | .[] | {id, title, artist, price, tokenId, category}'

echo ""

# Paso 6: Obtener detalles de la obra específica
echo -e "${BLUE}${BOLD}Paso 6: Obtener detalles de la obra de arte${NC}"
DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/art/$ART_PIECE_ID")

echo $DETAILS_RESPONSE | jq '{id, title, artist, description, price, tokenId, isAvailable, sourceAsset: {brand, model, qrCode}}'

echo ""

# Paso 7: Obtener estadísticas del marketplace de arte
echo -e "${BLUE}${BOLD}Paso 7: Obtener estadísticas del marketplace de arte${NC}"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/art/stats")

echo $STATS_RESPONSE | jq '.'

echo ""

# Paso 8: Comprar obra de arte (transferir NFT)
echo -e "${BLUE}${BOLD}Paso 8: Comprar obra de arte y transferir NFT${NC}"
echo -e "${YELLOW}Nota: Esto transferirá el NFT ERC-721 a la wallet del comprador${NC}"

PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/marketplace/art/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "artPieceId": "'$ART_PIECE_ID'",
    "buyerWallet": "'$BUYER_WALLET'",
    "messageToArtist": "¡Hermosa obra! Me encanta la visión sobre la tecnología obsoleta."
  }')

ORDER_ID=$(echo $PURCHASE_RESPONSE | jq -r '.order.id')

if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
  echo -e "${GREEN}✓ Compra exitosa${NC}"
  echo ""
  echo "Detalles de la orden:"
  echo $PURCHASE_RESPONSE | jq '.'
else
  echo -e "${RED}✗ Error en la compra${NC}"
  echo $PURCHASE_RESPONSE | jq '.'
fi

echo ""

# Paso 9: Verificar estado de la obra después de la compra
echo -e "${BLUE}${BOLD}Paso 9: Verificar estado de la obra después de la compra${NC}"
FINAL_ART=$(curl -s -X GET "$BASE_URL/marketplace/art/$ART_PIECE_ID")

echo "Estado final de la obra:"
echo $FINAL_ART | jq '{id, title, artist, tokenId, isAvailable, soldAt, buyerWallet}'

echo ""

# Paso 10: Obtener historial de órdenes de arte
echo -e "${BLUE}${BOLD}Paso 10: Obtener historial de órdenes de arte${NC}"
ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/art/orders")

echo "Últimas 3 órdenes:"
echo $ORDERS_RESPONSE | jq '.[0:3] | .[] | {id, status, price, buyerWallet, messageToArtist, blockchainTxHash, createdAt}'

echo ""

# Paso 11: Verificar en blockchain (opcional)
if [ "$ART_TOKEN_ID" != "null" ] && [ -n "$ART_TOKEN_ID" ]; then
  echo -e "${BLUE}${BOLD}Paso 11: Verificar transferencia en blockchain${NC}"
  
  BLOCKCHAIN_TX=$(echo $PURCHASE_RESPONSE | jq -r '.order.blockchainTxHash')
  
  if [ "$BLOCKCHAIN_TX" != "null" ] && [ -n "$BLOCKCHAIN_TX" ]; then
    echo -e "${GREEN}✓ NFT de arte transferido en blockchain${NC}"
    echo "Transaction Hash: $BLOCKCHAIN_TX"
    echo "Token ID: $ART_TOKEN_ID"
    echo "Nuevo propietario: $BUYER_WALLET"
    echo ""
    echo -e "${YELLOW}Verifica en PolygonScan Amoy:${NC}"
    echo "https://amoy.polygonscan.com/tx/$BLOCKCHAIN_TX"
  else
    echo -e "${YELLOW}⚠ No se pudo obtener el TX hash de blockchain${NC}"
  fi
fi

echo ""

# Paso 12: Verificar estadísticas actualizadas
echo -e "${BLUE}${BOLD}Paso 12: Verificar estadísticas actualizadas del marketplace${NC}"
FINAL_STATS=$(curl -s -X GET "$BASE_URL/marketplace/art/stats")

echo "Estadísticas finales:"
echo $FINAL_STATS | jq '.'

echo ""
echo -e "${BOLD}${GREEN}=== Resumen del Test ===${NC}"
echo -e "Asset ID: ${BLUE}$ASSET_ID${NC}"
echo -e "Art Piece ID: ${BLUE}$ART_PIECE_ID${NC}"
echo -e "Token ID: ${BLUE}$ART_TOKEN_ID${NC}"
echo -e "Order ID: ${BLUE}$ORDER_ID${NC}"
echo -e "Buyer Wallet: ${BLUE}$BUYER_WALLET${NC}"
echo -e "Estado final: ${GREEN}$(echo $FINAL_ART | jq -r '.isAvailable')${NC}"
echo ""
echo -e "${GREEN}✓ Test completado exitosamente${NC}"
echo ""
echo -e "${YELLOW}Endpoints disponibles:${NC}"
echo "  GET  /marketplace/art/available - Listar obras disponibles"
echo "  GET  /marketplace/art/stats - Estadísticas del marketplace"
echo "  GET  /marketplace/art/:artPieceId - Detalles de una obra"
echo "  POST /marketplace/art/purchase - Comprar obra de arte"
echo "  GET  /marketplace/art/orders - Historial de órdenes"
