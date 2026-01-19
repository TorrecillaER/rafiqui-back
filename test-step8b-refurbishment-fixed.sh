#!/bin/bash

echo "=========================================="
echo "Test Step 8b: Endpoint de Reacondicionamiento CORREGIDO"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔧 Verificando que todos los campos técnicos se guarden correctamente"
echo ""

# Paso 1: Crear panel en estado READY_FOR_REUSE
echo "1️⃣  Creando panel en estado READY_FOR_REUSE..."
ASSET=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-REFURB-FIXED-001",
    "brand": "SunPower",
    "model": "Maxeon 3 400W",
    "status": "READY_FOR_REUSE"
  }')

ASSET_ID=$(echo "$ASSET" | jq -r '.id')
echo -e "${BLUE}Asset ID: $ASSET_ID${NC}"
echo -e "${BLUE}Estado inicial: READY_FOR_REUSE${NC}"
echo ""

# Paso 2: Completar reacondicionamiento con TODOS los campos técnicos
echo "2️⃣  Completando reacondicionamiento con datos técnicos completos..."
REFURB_RESPONSE=$(curl -s -X POST "$BASE_URL/assets/$ASSET_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Panel reacondicionado exitosamente. Reemplazadas 3 celdas dañadas, limpieza profunda y pruebas completas.",
    "measuredPowerWatts": 385.5,
    "measuredVoltage": 48.2,
    "capacityRetainedPercent": 96.4,
    "healthPercentage": 95.8,
    "dimensionLength": 165.5,
    "dimensionWidth": 99.2,
    "dimensionHeight": 4.0,
    "technicianId": "tech-refurb-001"
  }')

echo "$REFURB_RESPONSE" | jq '.'
SUCCESS=$(echo "$REFURB_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Reacondicionamiento completado exitosamente${NC}"
else
  echo -e "${RED}❌ Error en reacondicionamiento${NC}"
  exit 1
fi
echo ""

# Paso 3: Verificar que el estado sea LISTED_FOR_SALE
echo "3️⃣  Verificando estado final..."
UPDATED_ASSET=$(curl -s "$BASE_URL/assets/by-qr/PANEL-REFURB-FIXED-001")
FINAL_STATUS=$(echo "$UPDATED_ASSET" | jq -r '.status')

if [ "$FINAL_STATUS" = "LISTED_FOR_SALE" ]; then
  echo -e "${GREEN}✅ Estado correcto: LISTED_FOR_SALE${NC}"
else
  echo -e "${RED}❌ Estado incorrecto: $FINAL_STATUS (esperaba LISTED_FOR_SALE)${NC}"
  exit 1
fi
echo ""

# Paso 4: Verificar que TODOS los campos técnicos se guardaron
echo "4️⃣  Verificando que todos los campos técnicos se guardaron..."
echo ""

# Extraer todos los campos
NOTES=$(echo "$UPDATED_ASSET" | jq -r '.refurbishmentNotes')
POWER=$(echo "$UPDATED_ASSET" | jq -r '.measuredPowerWatts')
VOLTAGE=$(echo "$UPDATED_ASSET" | jq -r '.measuredVoltage')
CAPACITY=$(echo "$UPDATED_ASSET" | jq -r '.capacityRetainedPercent')
HEALTH=$(echo "$UPDATED_ASSET" | jq -r '.healthPercentage')
LENGTH=$(echo "$UPDATED_ASSET" | jq -r '.dimensionLength')
WIDTH=$(echo "$UPDATED_ASSET" | jq -r '.dimensionWidth')
HEIGHT=$(echo "$UPDATED_ASSET" | jq -r '.dimensionHeight')
TECH_ID=$(echo "$UPDATED_ASSET" | jq -r '.refurbishedById')
REFURB_DATE=$(echo "$UPDATED_ASSET" | jq -r '.refurbishedAt')

# Verificar cada campo
ERRORS=0

echo "📋 Datos guardados:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Notas
if [ "$NOTES" != "null" ] && [ -n "$NOTES" ]; then
  echo -e "${GREEN}✅ Notas: $NOTES${NC}"
else
  echo -e "${RED}❌ Notas: NO GUARDADAS${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Potencia
if [ "$POWER" != "null" ] && [ "$POWER" = "385.5" ]; then
  echo -e "${GREEN}✅ Potencia: ${POWER}W${NC}"
else
  echo -e "${RED}❌ Potencia: $POWER (esperaba 385.5)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Voltaje (NUEVO)
if [ "$VOLTAGE" != "null" ] && [ "$VOLTAGE" = "48.2" ]; then
  echo -e "${GREEN}✅ Voltaje: ${VOLTAGE}V${NC}"
else
  echo -e "${RED}❌ Voltaje: $VOLTAGE (esperaba 48.2)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Capacidad retenida
if [ "$CAPACITY" != "null" ] && [ "$CAPACITY" = "96.4" ]; then
  echo -e "${GREEN}✅ Capacidad retenida: ${CAPACITY}%${NC}"
else
  echo -e "${RED}❌ Capacidad retenida: $CAPACITY (esperaba 96.4)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Health percentage (NUEVO)
if [ "$HEALTH" != "null" ] && [ "$HEALTH" = "95.8" ]; then
  echo -e "${GREEN}✅ Estado de salud: ${HEALTH}%${NC}"
else
  echo -e "${RED}❌ Estado de salud: $HEALTH (esperaba 95.8)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Dimensiones (NUEVAS)
if [ "$LENGTH" != "null" ] && [ "$LENGTH" = "165.5" ]; then
  echo -e "${GREEN}✅ Largo: ${LENGTH}cm${NC}"
else
  echo -e "${RED}❌ Largo: $LENGTH (esperaba 165.5)${NC}"
  ERRORS=$((ERRORS + 1))
fi

if [ "$WIDTH" != "null" ] && [ "$WIDTH" = "99.2" ]; then
  echo -e "${GREEN}✅ Ancho: ${WIDTH}cm${NC}"
else
  echo -e "${RED}❌ Ancho: $WIDTH (esperaba 99.2)${NC}"
  ERRORS=$((ERRORS + 1))
fi

if [ "$HEIGHT" != "null" ] && [ "$HEIGHT" = "4" ]; then
  echo -e "${GREEN}✅ Alto: ${HEIGHT}cm${NC}"
else
  echo -e "${RED}❌ Alto: $HEIGHT (esperaba 4.0)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Técnico
if [ "$TECH_ID" != "null" ] && [ -n "$TECH_ID" ]; then
  echo -e "${GREEN}✅ Técnico ID: $TECH_ID${NC}"
else
  echo -e "${RED}❌ Técnico ID: NO GUARDADO${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Fecha
if [ "$REFURB_DATE" != "null" ] && [ -n "$REFURB_DATE" ]; then
  echo -e "${GREEN}✅ Fecha: $REFURB_DATE${NC}"
else
  echo -e "${RED}❌ Fecha: NO GUARDADA${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 TODOS LOS CAMPOS SE GUARDARON CORRECTAMENTE${NC}"
else
  echo -e "${RED}⚠️  $ERRORS campo(s) NO se guardaron correctamente${NC}"
  exit 1
fi
echo ""

# Paso 5: Probar desde estado REFURBISHING
echo "5️⃣  Probando desde estado REFURBISHING..."
ASSET2=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-REFURB-FIXED-002",
    "brand": "Canadian Solar",
    "model": "HiKu 450W",
    "status": "REFURBISHING"
  }')

ASSET2_ID=$(echo "$ASSET2" | jq -r '.id')

REFURB2=$(curl -s -X POST "$BASE_URL/assets/$ASSET2_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{
    "measuredPowerWatts": 440.0,
    "measuredVoltage": 49.5,
    "healthPercentage": 98.0
  }')

SUCCESS2=$(echo "$REFURB2" | jq -r '.success')
if [ "$SUCCESS2" = "true" ]; then
  echo -e "${GREEN}✅ Completado desde REFURBISHING${NC}"
else
  echo -e "${RED}❌ Error desde REFURBISHING${NC}"
fi
echo ""

# Paso 6: Verificar que rechace estados inválidos
echo "6️⃣  Verificando rechazo de estados inválidos..."
ASSET3=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-INVALID-STATE",
    "status": "WAREHOUSE_RECEIVED"
  }')

ASSET3_ID=$(echo "$ASSET3" | jq -r '.id')

INVALID=$(curl -s -X POST "$BASE_URL/assets/$ASSET3_ID/complete-refurbishment" \
  -H "Content-Type: application/json" \
  -d '{}')

SUCCESS3=$(echo "$INVALID" | jq -r '.success')
if [ "$SUCCESS3" = "false" ]; then
  echo -e "${GREEN}✅ Rechazó estado inválido correctamente${NC}"
  MESSAGE3=$(echo "$INVALID" | jq -r '.message')
  echo "   Mensaje: $MESSAGE3"
else
  echo -e "${RED}❌ No rechazó estado inválido${NC}"
fi
echo ""

echo "=========================================="
echo "✅ TEST COMPLETADO EXITOSAMENTE"
echo "=========================================="
echo ""
echo "📊 Resumen de correcciones implementadas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Estado final: LISTED_FOR_SALE (corregido)"
echo "✅ Campos guardados correctamente:"
echo "   • measuredPowerWatts"
echo "   • measuredVoltage (NUEVO)"
echo "   • capacityRetainedPercent"
echo "   • healthPercentage (NUEVO)"
echo "   • dimensionLength (NUEVO)"
echo "   • dimensionWidth (NUEVO)"
echo "   • dimensionHeight (NUEVO)"
echo "   • refurbishmentNotes"
echo "   • refurbishedById"
echo "   • refurbishedAt"
echo ""
echo "🎯 El endpoint ahora funciona correctamente con todos los datos técnicos"
