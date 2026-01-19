#!/bin/bash

echo "=========================================="
echo "Test de Integración Blockchain - Assets"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

echo "1. Verificando estado de blockchain..."
curl -s "$BASE_URL/blockchain/status" | jq '.'
echo ""

echo "2. Creando un nuevo asset (panel solar)..."
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-INTEGRATION-TEST-001",
    "brand": "SunPower",
    "model": "Maxeon 3",
    "status": "IN_TRANSIT"
  }')

echo "$ASSET_RESPONSE" | jq '.'
ASSET_ID=$(echo "$ASSET_RESPONSE" | jq -r '.id')
echo ""
echo "Asset ID creado: $ASSET_ID"
echo ""

echo "3. Esperando 3 segundos para que se registre en blockchain..."
sleep 3
echo ""

echo "4. Verificando registro en blockchain..."
curl -s "$BASE_URL/blockchain/panel/PANEL-INTEGRATION-TEST-001" | jq '.'
echo ""

echo "5. Actualizando estado del asset..."
curl -s -X PATCH "$BASE_URL/assets/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "WAREHOUSE_RECEIVED"
  }' | jq '.'
echo ""

echo "6. Esperando 3 segundos para que se actualice en blockchain..."
sleep 3
echo ""

echo "7. Verificando historial en blockchain..."
curl -s "$BASE_URL/blockchain/panel/PANEL-INTEGRATION-TEST-001/history" | jq '.'
echo ""

echo "=========================================="
echo "Test completado"
echo "=========================================="
