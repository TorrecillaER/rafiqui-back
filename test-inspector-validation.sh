#!/bin/bash

echo "=========================================="
echo "Test de Validación de Inspector - Step 6"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

echo "1. Creando un panel de prueba con estado WAREHOUSE_RECEIVED..."
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-INSPECTOR-TEST-001",
    "brand": "SunPower",
    "model": "Maxeon 3",
    "status": "WAREHOUSE_RECEIVED"
  }')

echo "$ASSET_RESPONSE" | jq '.'
ASSET_ID=$(echo "$ASSET_RESPONSE" | jq -r '.id')
echo ""
echo "Asset ID creado: $ASSET_ID"
echo ""

echo "2. Buscando panel por QR..."
curl -s "$BASE_URL/assets/by-qr/PANEL-INSPECTOR-TEST-001" | jq '.'
echo ""

echo "3. Validando panel para inspección (debe cambiar a INSPECTING)..."
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/validate-for-inspection" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-INSPECTOR-TEST-001",
    "inspectorId": "inspector-123"
  }')

echo "$VALIDATION_RESPONSE" | jq '.'
echo ""

VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.valid')
if [ "$VALID" = "true" ]; then
  echo "✅ Panel válido para inspección"
else
  echo "❌ Panel NO válido para inspección"
fi
echo ""

echo "4. Verificando que el estado cambió a INSPECTING..."
curl -s "$BASE_URL/assets/by-qr/PANEL-INSPECTOR-TEST-001" | jq '.status'
echo ""

echo "5. Intentando validar el mismo panel nuevamente (debe permitirlo porque ya está INSPECTING)..."
curl -s -X POST "$BASE_URL/assets/validate-for-inspection" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-INSPECTOR-TEST-001",
    "inspectorId": "inspector-456"
  }' | jq '.'
echo ""

echo "6. Creando un panel ya INSPECTED para probar rechazo..."
curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-ALREADY-INSPECTED",
    "brand": "Canadian Solar",
    "model": "HiKu",
    "status": "INSPECTED"
  }' | jq '.'
echo ""

echo "7. Intentando validar panel ya INSPECTED (debe rechazarlo)..."
REJECTED_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/validate-for-inspection" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-ALREADY-INSPECTED",
    "inspectorId": "inspector-123"
  }')

echo "$REJECTED_RESPONSE" | jq '.'
echo ""

VALID=$(echo "$REJECTED_RESPONSE" | jq -r '.valid')
if [ "$VALID" = "false" ]; then
  echo "✅ Panel correctamente rechazado (ya procesado)"
else
  echo "❌ Error: Panel debería ser rechazado"
fi
echo ""

echo "8. Intentando validar panel inexistente..."
curl -s -X POST "$BASE_URL/assets/validate-for-inspection" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-NO-EXISTE",
    "inspectorId": "inspector-123"
  }' | jq '.'
echo ""

echo "9. Listando todos los assets con estado INSPECTING..."
curl -s "$BASE_URL/assets?status=INSPECTING" | jq 'length'
echo " paneles en estado INSPECTING"
echo ""

echo "=========================================="
echo "Test completado"
echo "=========================================="
echo ""
echo "Resumen de endpoints implementados:"
echo "  POST /assets/validate-for-inspection - Validar panel para inspección"
echo "  GET  /assets/by-qr/:qrCode - Buscar por código QR"
echo "  GET  /assets/by-nfc/:nfcTagId - Buscar por NFC"
echo "  GET  /assets?status=INSPECTING - Filtrar por estado"
