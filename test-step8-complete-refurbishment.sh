#!/bin/bash

echo "=========================================="
echo "Test Step 8: Completar Reacondicionamiento"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Creando panel en estado READY_FOR_REUSE..."
ASSET=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-REFURB-001",
    "brand": "SunPower",
    "model": "Maxeon 3",
    "status": "READY_FOR_REUSE"
  }')

ASSET_ID=$(echo "$ASSET" | jq -r '.id')
echo "Asset creado: $ASSET_ID"
echo "Estado inicial: READY_FOR_REUSE"
echo ""

echo "2. Verificando que el panel está en estado READY_FOR_REUSE..."
CURRENT_STATUS=$(curl -s "$BASE_URL/assets/by-qr/PANEL-REFURB-001" | jq -r '.status')
if [ "$CURRENT_STATUS" = "READY_FOR_REUSE" ]; then
  echo -e "${GREEN}✅ Panel en estado correcto: $CURRENT_STATUS${NC}"
else
  echo -e "${RED}❌ Estado incorrecto: $CURRENT_STATUS${NC}"
fi
echo ""

echo "3. Completando reacondicionamiento con datos completos..."
REFURB_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/$ASSET_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Panel reacondicionado exitosamente. Reemplazadas celdas dañadas y limpieza profunda.",
    "measuredPowerWatts": 285.5,
    "capacityRetainedPercent": 95.2,
    "technicianId": "tech-001"
  }')

echo "$REFURB_RESPONSE" | jq '.'
SUCCESS=$(echo "$REFURB_RESPONSE" | jq -r '.success')
MESSAGE=$(echo "$REFURB_RESPONSE" | jq -r '.message')
BLOCKCHAIN_TX=$(echo "$REFURB_RESPONSE" | jq -r '.blockchainTxHash')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Reacondicionamiento completado${NC}"
  echo "Mensaje: $MESSAGE"
  if [ "$BLOCKCHAIN_TX" != "null" ] && [ -n "$BLOCKCHAIN_TX" ]; then
    echo -e "${GREEN}✅ Blockchain actualizado: $BLOCKCHAIN_TX${NC}"
  else
    echo -e "${YELLOW}⚠️  Blockchain no conectado o sin TX hash${NC}"
  fi
else
  echo -e "${RED}❌ Error: $MESSAGE${NC}"
fi
echo ""

echo "4. Verificando que el estado cambió a LISTED_FOR_SALE..."
UPDATED_ASSET=$(curl -s "$BASE_URL/assets/by-qr/PANEL-REFURB-001")
NEW_STATUS=$(echo "$UPDATED_ASSET" | jq -r '.status')
REFURB_NOTES=$(echo "$UPDATED_ASSET" | jq -r '.refurbishmentNotes')
POWER=$(echo "$UPDATED_ASSET" | jq -r '.measuredPowerWatts')
CAPACITY=$(echo "$UPDATED_ASSET" | jq -r '.capacityRetainedPercent')

if [ "$NEW_STATUS" = "LISTED_FOR_SALE" ]; then
  echo -e "${GREEN}✅ Estado actualizado correctamente a LISTED_FOR_SALE${NC}"
else
  echo -e "${RED}❌ Estado incorrecto: $NEW_STATUS, esperaba LISTED_FOR_SALE${NC}"
fi

echo ""
echo "Datos del panel reacondicionado:"
echo "  Notas: $REFURB_NOTES"
echo "  Potencia medida: ${POWER}W"
echo "  Capacidad retenida: ${CAPACITY}%"
echo ""

echo "5. Creando panel en estado REFURBISHING..."
ASSET2=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-REFURB-002",
    "brand": "Canadian Solar",
    "model": "HiKu",
    "status": "REFURBISHING"
  }')

ASSET2_ID=$(echo "$ASSET2" | jq -r '.id')
echo "Asset 2 creado: $ASSET2_ID"
echo ""

echo "6. Completando reacondicionamiento desde estado REFURBISHING..."
REFURB2_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/$ASSET2_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Reacondicionamiento básico completado",
    "measuredPowerWatts": 270.0,
    "capacityRetainedPercent": 90.0
  }')

SUCCESS2=$(echo "$REFURB2_RESPONSE" | jq -r '.success')
if [ "$SUCCESS2" = "true" ]; then
  echo -e "${GREEN}✅ Reacondicionamiento desde REFURBISHING completado${NC}"
else
  echo -e "${RED}❌ Error en reacondicionamiento${NC}"
fi
echo ""

echo "7. Intentando completar reacondicionamiento desde estado inválido..."
ASSET3=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-REFURB-003",
    "brand": "Test",
    "model": "Invalid",
    "status": "WAREHOUSE_RECEIVED"
  }')

ASSET3_ID=$(echo "$ASSET3" | jq -r '.id')

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/$ASSET3_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{}')

SUCCESS3=$(echo "$INVALID_RESPONSE" | jq -r '.success')
MESSAGE3=$(echo "$INVALID_RESPONSE" | jq -r '.message')

if [ "$SUCCESS3" = "false" ]; then
  echo -e "${GREEN}✅ Validación correcta: rechazó estado inválido${NC}"
  echo "Mensaje: $MESSAGE3"
else
  echo -e "${RED}❌ Error: debería haber rechazado el estado WAREHOUSE_RECEIVED${NC}"
fi
echo ""

echo "8. Listando todos los paneles LISTED_FOR_SALE..."
LISTED_PANELS=$(curl -s "$BASE_URL/assets?status=LISTED_FOR_SALE")
LISTED_COUNT=$(echo "$LISTED_PANELS" | jq 'length')

echo "Paneles listos para venta: $LISTED_COUNT"
if [ "$LISTED_COUNT" -ge 2 ]; then
  echo -e "${GREEN}✅ Se encontraron paneles en estado LISTED_FOR_SALE${NC}"
  echo "$LISTED_PANELS" | jq -r '.[] | "  - \(.qrCode): \(.brand) \(.model) - \(.measuredPowerWatts)W (\(.capacityRetainedPercent)%)"'
else
  echo -e "${YELLOW}⚠️  Se esperaban al menos 2 paneles${NC}"
fi
echo ""

echo "9. Probando actualización manual a REFURBISHING..."
MANUAL_UPDATE=$(curl -s -X PATCH "$BASE_URL/assets/$ASSET3_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REFURBISHING"
  }')

MANUAL_STATUS=$(echo "$MANUAL_UPDATE" | jq -r '.status')
if [ "$MANUAL_STATUS" = "REFURBISHING" ]; then
  echo -e "${GREEN}✅ Actualización manual a REFURBISHING exitosa${NC}"
else
  echo -e "${RED}❌ Error en actualización manual${NC}"
fi
echo ""

echo "=========================================="
echo "Test completado"
echo "=========================================="
echo ""
echo "Resumen de funcionalidades implementadas:"
echo "✓ Endpoint POST /assets/:id/complete-refurbishment"
echo "✓ Validación de estados (solo READY_FOR_REUSE y REFURBISHING)"
echo "✓ Actualización a LISTED_FOR_SALE en BD"
echo "✓ Actualización automática en blockchain (REUSE_APPROVED)"
echo "✓ Campos de tracking: refurbishedAt, notes, power, capacity"
echo "✓ Estados REFURBISHING y LISTED_FOR_SALE en enums"
echo ""
echo "Flujo de reacondicionamiento:"
echo "  1. Panel inspeccionado → READY_FOR_REUSE"
echo "  2. Técnico inicia trabajo → REFURBISHING (opcional)"
echo "  3. Técnico completa → POST /complete-refurbishment"
echo "  4. Sistema actualiza → LISTED_FOR_SALE + Blockchain"
echo "  5. Panel disponible para venta en marketplace"
