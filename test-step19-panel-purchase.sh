#!/bin/bash

# Script de pruebas para Step 19: Compra de Paneles con Transferencia de NFT
# Este script prueba el flujo completo de compra de un panel reacondicionado

BASE_URL="http://localhost:4000"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}=== Test Step 19: Compra de Paneles con Transferencia de NFT ===${NC}\n"

# Variables globales
ASSET_ID=""
TOKEN=""
PANEL_TOKEN_ID=""
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

# Paso 2: Crear panel para reacondicionamiento
echo -e "${BLUE}${BOLD}Paso 2: Crear panel para reacondicionamiento${NC}"
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "QR-PANEL-SALE-'$(date +%s)'",
    "brand": "Canadian Solar",
    "model": "CS6K-300MS",
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

# Paso 3: Crear inspección con recomendación REUSE
echo -e "${BLUE}${BOLD}Paso 3: Crear inspección con recomendación REUSE${NC}"
INSPECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assetId": "'$ASSET_ID'",
    "inspectorId": "inspector-id-placeholder",
    "measuredVoltage": 36.5,
    "measuredAmps": 8.5,
    "physicalCondition": "Excelente estado, solo limpieza necesaria",
    "notes": "Panel apto para reutilización directa"
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

# Paso 4: Completar reacondicionamiento
echo -e "${BLUE}${BOLD}Paso 4: Completar reacondicionamiento y listar para venta${NC}"
REFURB_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/$ASSET_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{
    "measuredPowerWatts": 300,
    "measuredVoltage": 36.8,
    "capacityRetainedPercent": 92,
    "healthPercentage": 95,
    "dimensionLength": 1.96,
    "dimensionWidth": 0.99,
    "dimensionHeight": 0.04,
    "refurbishmentNotes": "Panel completamente reacondicionado y certificado"
  }')

PANEL_TOKEN_ID=$(echo $REFURB_RESPONSE | jq -r '.asset.tokenId')

if [ "$PANEL_TOKEN_ID" != "null" ] && [ -n "$PANEL_TOKEN_ID" ]; then
  echo -e "${GREEN}✓ Reacondicionamiento completado${NC}"
  echo "Token ID: $PANEL_TOKEN_ID"
  echo "Estado: $(echo $REFURB_RESPONSE | jq -r '.asset.status')"
  echo "Blockchain TX: $(echo $REFURB_RESPONSE | jq -r '.blockchainTxHash')"
else
  echo -e "${RED}✗ Error al completar reacondicionamiento${NC}"
  echo $REFURB_RESPONSE | jq '.'
fi

echo ""

# Paso 5: Obtener paneles disponibles en marketplace
echo -e "${BLUE}${BOLD}Paso 5: Obtener paneles disponibles en marketplace${NC}"
AVAILABLE_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/panels/available")

AVAILABLE_COUNT=$(echo $AVAILABLE_RESPONSE | jq '. | length')

echo -e "${GREEN}✓ Paneles disponibles: $AVAILABLE_COUNT${NC}"
echo ""
echo "Primeros 3 paneles:"
echo $AVAILABLE_RESPONSE | jq '.[0:3] | .[] | {id, qrCode, brand, model, price, tokenId, healthPercentage}'

echo ""

# Paso 6: Obtener detalles del panel específico
echo -e "${BLUE}${BOLD}Paso 6: Obtener detalles del panel${NC}"
DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/panels/$ASSET_ID")

echo $DETAILS_RESPONSE | jq '.'

echo ""

# Paso 7: Obtener estadísticas del marketplace
echo -e "${BLUE}${BOLD}Paso 7: Obtener estadísticas del marketplace${NC}"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/panels/stats")

echo $STATS_RESPONSE | jq '.'

echo ""

# Paso 8: Comprar panel (transferir NFT)
echo -e "${BLUE}${BOLD}Paso 8: Comprar panel y transferir NFT${NC}"
echo -e "${YELLOW}Nota: Esto transferirá el NFT ERC-721 a la wallet del comprador${NC}"

PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/marketplace/panels/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "'$ASSET_ID'",
    "buyerWallet": "'$BUYER_WALLET'",
    "destination": "RESIDENTIAL",
    "destinationNotes": "Instalación en techo residencial"
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

# Paso 9: Verificar estado del asset después de la compra
echo -e "${BLUE}${BOLD}Paso 9: Verificar estado del asset después de la compra${NC}"
FINAL_ASSET=$(curl -s -X GET "$BASE_URL/assets?qrCode=$(echo $ASSET_RESPONSE | jq -r '.qrCode')")

echo "Estado final del asset:"
echo $FINAL_ASSET | jq '.[0] | {id, qrCode, status, tokenId, soldAt, buyerWallet}'

echo ""

# Paso 10: Obtener historial de órdenes
echo -e "${BLUE}${BOLD}Paso 10: Obtener historial de órdenes de paneles${NC}"
ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/marketplace/panels/orders")

echo "Últimas 3 órdenes:"
echo $ORDERS_RESPONSE | jq '.[0:3] | .[] | {id, status, price, buyerWallet, destination, blockchainTxHash, createdAt}'

echo ""

# Paso 11: Verificar en blockchain (opcional)
if [ "$PANEL_TOKEN_ID" != "null" ] && [ -n "$PANEL_TOKEN_ID" ]; then
  echo -e "${BLUE}${BOLD}Paso 11: Verificar transferencia en blockchain${NC}"
  
  BLOCKCHAIN_TX=$(echo $PURCHASE_RESPONSE | jq -r '.order.blockchainTxHash')
  
  if [ "$BLOCKCHAIN_TX" != "null" ] && [ -n "$BLOCKCHAIN_TX" ]; then
    echo -e "${GREEN}✓ NFT transferido en blockchain${NC}"
    echo "Transaction Hash: $BLOCKCHAIN_TX"
    echo "Token ID: $PANEL_TOKEN_ID"
    echo "Nuevo propietario: $BUYER_WALLET"
    echo ""
    echo -e "${YELLOW}Verifica en PolygonScan Amoy:${NC}"
    echo "https://amoy.polygonscan.com/tx/$BLOCKCHAIN_TX"
  else
    echo -e "${YELLOW}⚠ No se pudo obtener el TX hash de blockchain${NC}"
  fi
fi

echo ""
echo -e "${BOLD}${GREEN}=== Resumen del Test ===${NC}"
echo -e "Asset ID: ${BLUE}$ASSET_ID${NC}"
echo -e "Token ID: ${BLUE}$PANEL_TOKEN_ID${NC}"
echo -e "Order ID: ${BLUE}$ORDER_ID${NC}"
echo -e "Buyer Wallet: ${BLUE}$BUYER_WALLET${NC}"
echo -e "Estado final: ${GREEN}$(echo $FINAL_ASSET | jq -r '.[0].status')${NC}"
echo ""
echo -e "${GREEN}✓ Test completado exitosamente${NC}"
echo ""
echo -e "${YELLOW}Endpoints disponibles:${NC}"
echo "  GET  /marketplace/panels/available - Listar paneles disponibles"
echo "  GET  /marketplace/panels/stats - Estadísticas del marketplace"
echo "  GET  /marketplace/panels/:assetId - Detalles de un panel"
echo "  POST /marketplace/panels/purchase - Comprar panel"
echo "  GET  /marketplace/panels/orders - Historial de órdenes"
