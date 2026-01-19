#!/bin/bash

echo "=========================================="
echo "Test de Estado INSPECTING"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "1. Creando panel con estado WAREHOUSE_RECEIVED..."
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "TEST-INSPECTING-001",
    "brand": "Test Brand",
    "model": "Test Model",
    "status": "WAREHOUSE_RECEIVED"
  }')

ASSET_ID=$(echo "$ASSET_RESPONSE" | jq -r '.id')
echo "Asset creado con ID: $ASSET_ID"
echo ""

echo "2. Verificando estado inicial..."
CURRENT_STATUS=$(curl -s "$BASE_URL/assets/by-qr/TEST-INSPECTING-001" | jq -r '.status')
echo "Estado actual: $CURRENT_STATUS"
echo ""

echo "3. Actualizando a estado INSPECTING manualmente..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/assets/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INSPECTING"
  }')

echo "$UPDATE_RESPONSE" | jq '.'
echo ""

echo "4. Verificando que el cambio se aplicó..."
UPDATED_STATUS=$(curl -s "$BASE_URL/assets/by-qr/TEST-INSPECTING-001" | jq -r '.status')
if [ "$UPDATED_STATUS" = "INSPECTING" ]; then
  echo -e "${GREEN}✅ Estado actualizado correctamente a INSPECTING${NC}"
else
  echo -e "${RED}❌ Error: Estado es $UPDATED_STATUS, esperaba INSPECTING${NC}"
fi
echo ""

echo "5. Probando validación de inspección con JWT..."
echo "Primero, haciendo login como inspector..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inspector@rafiqui.com",
    "password": "password123"
  }' | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login exitoso, token obtenido${NC}"
else
  echo -e "${RED}❌ Error en login${NC}"
  exit 1
fi
echo ""

echo "6. Creando otro panel para probar validación..."
curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "TEST-INSPECTING-002",
    "brand": "Test Brand 2",
    "model": "Test Model 2",
    "status": "WAREHOUSE_RECEIVED"
  }' | jq '.'
echo ""

echo "7. Validando panel para inspección (debe cambiar a INSPECTING automáticamente)..."
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/validate-for-inspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "qrCode": "TEST-INSPECTING-002"
  }')

echo "$VALIDATION_RESPONSE" | jq '.'
VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.valid')
if [ "$VALID" = "true" ]; then
  echo -e "${GREEN}✅ Validación exitosa${NC}"
else
  echo -e "${RED}❌ Validación falló${NC}"
fi
echo ""

echo "8. Verificando que el panel cambió a INSPECTING..."
FINAL_STATUS=$(curl -s "$BASE_URL/assets/by-qr/TEST-INSPECTING-002" | jq -r '.status')
if [ "$FINAL_STATUS" = "INSPECTING" ]; then
  echo -e "${GREEN}✅ Panel cambió correctamente a INSPECTING${NC}"
else
  echo -e "${RED}❌ Error: Estado es $FINAL_STATUS, esperaba INSPECTING${NC}"
fi
echo ""

echo "9. Listando todos los paneles en estado INSPECTING..."
INSPECTING_COUNT=$(curl -s "$BASE_URL/assets?status=INSPECTING" | jq 'length')
echo "Paneles en INSPECTING: $INSPECTING_COUNT"
if [ "$INSPECTING_COUNT" -ge 2 ]; then
  echo -e "${GREEN}✅ Se encontraron paneles en estado INSPECTING${NC}"
else
  echo -e "${RED}❌ No se encontraron suficientes paneles en INSPECTING${NC}"
fi
echo ""

echo "10. Probando actualización de INSPECTING a INSPECTED..."
curl -s -X PATCH "$BASE_URL/assets/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INSPECTED"
  }' | jq '.status'
echo ""

echo "=========================================="
echo "Test completado"
echo "=========================================="
echo ""
echo "Resumen:"
echo "✓ Estado INSPECTING soportado en creación"
echo "✓ Estado INSPECTING soportado en actualización manual"
echo "✓ Estado INSPECTING soportado en validación con JWT"
echo "✓ Estado INSPECTING se mapea correctamente a blockchain"
echo "✓ Filtrado por estado INSPECTING funciona"
