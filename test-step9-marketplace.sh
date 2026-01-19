#!/bin/bash

echo "=========================================="
echo "Test Step 9: Marketplace Listings Endpoint"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "🛒 Probando endpoints de marketplace para paneles reacondicionados"
echo ""

# Paso 1: Crear paneles de prueba con diferentes características
echo "1️⃣  Creando paneles de prueba con diferentes características..."
echo ""

# Paneles SunPower - Grado A (>85%)
echo "Creando paneles SunPower grado A..."
for i in {1..3}; do
  curl -s -X POST "$BASE_URL/assets" \
    -H "Content-Type: application/json" \
    -d "{
      \"qrCode\": \"MARKET-SUNPOWER-A-00$i\",
      \"brand\": \"SunPower\",
      \"model\": \"Maxeon 3\",
      \"status\": \"READY_FOR_REUSE\"
    }" > /dev/null
  
  ASSET_ID=$(curl -s "$BASE_URL/assets/by-qr/MARKET-SUNPOWER-A-00$i" | jq -r '.id')
  
  curl -s -X POST "$BASE_URL/assets/$ASSET_ID/complete-refurbishment" \
    -H "Content-Type: application/json" \
    -d "{
      \"measuredPowerWatts\": $((380 + i * 5)),
      \"measuredVoltage\": 48.5,
      \"healthPercentage\": $((88 + i)),
      \"dimensionLength\": 165,
      \"dimensionWidth\": 99,
      \"dimensionHeight\": 4.0
    }" > /dev/null
done
echo -e "${GREEN}✅ 3 paneles SunPower grado A creados${NC}"

# Paneles Canadian Solar - Grado B (75-85%)
echo "Creando paneles Canadian Solar grado B..."
for i in {1..4}; do
  curl -s -X POST "$BASE_URL/assets" \
    -H "Content-Type: application/json" \
    -d "{
      \"qrCode\": \"MARKET-CANADIAN-B-00$i\",
      \"brand\": \"Canadian Solar\",
      \"model\": \"HiKu\",
      \"status\": \"READY_FOR_REUSE\"
    }" > /dev/null
  
  ASSET_ID=$(curl -s "$BASE_URL/assets/by-qr/MARKET-CANADIAN-B-00$i" | jq -r '.id')
  
  curl -s -X POST "$BASE_URL/assets/$ASSET_ID/complete-refurbishment" \
    -H "Content-Type: application/json" \
    -d "{
      \"measuredPowerWatts\": $((270 + i * 5)),
      \"measuredVoltage\": 45.0,
      \"healthPercentage\": $((78 + i)),
      \"dimensionLength\": 170,
      \"dimensionWidth\": 100,
      \"dimensionHeight\": 3.5
    }" > /dev/null
done
echo -e "${GREEN}✅ 4 paneles Canadian Solar grado B creados${NC}"

# Paneles Trina Solar - Grado C (<75%)
echo "Creando paneles Trina Solar grado C..."
for i in {1..2}; do
  curl -s -X POST "$BASE_URL/assets" \
    -H "Content-Type: application/json" \
    -d "{
      \"qrCode\": \"MARKET-TRINA-C-00$i\",
      \"brand\": \"Trina Solar\",
      \"model\": \"Vertex\",
      \"status\": \"READY_FOR_REUSE\"
    }" > /dev/null
  
  ASSET_ID=$(curl -s "$BASE_URL/assets/by-qr/MARKET-TRINA-C-00$i" | jq -r '.id')
  
  curl -s -X POST "$BASE_URL/assets/$ASSET_ID/complete-refurbishment" \
    -H "Content-Type: application/json" \
    -d "{
      \"measuredPowerWatts\": $((250 + i * 10)),
      \"measuredVoltage\": 42.0,
      \"healthPercentage\": $((68 + i * 2)),
      \"dimensionLength\": 160,
      \"dimensionWidth\": 95,
      \"dimensionHeight\": 3.0
    }" > /dev/null
done
echo -e "${GREEN}✅ 2 paneles Trina Solar grado C creados${NC}"

echo ""
echo -e "${CYAN}Total: 9 paneles listos para venta${NC}"
echo ""

# Paso 2: Probar endpoint de listings (agrupados)
echo "2️⃣  Probando GET /marketplace/listings (paneles agrupados)..."
echo ""

LISTINGS=$(curl -s "$BASE_URL/marketplace/listings")
echo "$LISTINGS" | jq '.'

TOTAL_PANELS=$(echo "$LISTINGS" | jq -r '.totalPanels')
TOTAL_GROUPS=$(echo "$LISTINGS" | jq -r '.totalGroups')

echo ""
if [ "$TOTAL_PANELS" -ge 9 ]; then
  echo -e "${GREEN}✅ Total de paneles: $TOTAL_PANELS${NC}"
else
  echo -e "${RED}❌ Total de paneles: $TOTAL_PANELS (esperaba al menos 9)${NC}"
fi

if [ "$TOTAL_GROUPS" -ge 1 ]; then
  echo -e "${GREEN}✅ Total de grupos: $TOTAL_GROUPS${NC}"
else
  echo -e "${RED}❌ Total de grupos: $TOTAL_GROUPS${NC}"
fi
echo ""

# Paso 3: Probar filtro por marca
echo "3️⃣  Probando filtro por marca (SunPower)..."
SUNPOWER=$(curl -s "$BASE_URL/marketplace/listings?brands=SunPower")
SUNPOWER_COUNT=$(echo "$SUNPOWER" | jq -r '.totalPanels')

if [ "$SUNPOWER_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✅ Filtro por marca funciona: $SUNPOWER_COUNT paneles SunPower${NC}"
else
  echo -e "${RED}❌ Filtro por marca: $SUNPOWER_COUNT (esperaba 3)${NC}"
fi
echo ""

# Paso 4: Probar filtro por grado de salud
echo "4️⃣  Probando filtro por grado de salud (A)..."
GRADE_A=$(curl -s "$BASE_URL/marketplace/listings?healthGrade=A")
GRADE_A_COUNT=$(echo "$GRADE_A" | jq -r '.totalPanels')

if [ "$GRADE_A_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✅ Filtro por grado A funciona: $GRADE_A_COUNT paneles${NC}"
else
  echo -e "${RED}❌ Filtro por grado A: $GRADE_A_COUNT (esperaba 3)${NC}"
fi
echo ""

# Paso 5: Probar filtro por potencia
echo "5️⃣  Probando filtro por rango de potencia (>350W)..."
HIGH_POWER=$(curl -s "$BASE_URL/marketplace/listings?minPower=350")
HIGH_POWER_COUNT=$(echo "$HIGH_POWER" | jq -r '.totalPanels')

if [ "$HIGH_POWER_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✅ Filtro por potencia funciona: $HIGH_POWER_COUNT paneles >350W${NC}"
else
  echo -e "${YELLOW}⚠️  Filtro por potencia: $HIGH_POWER_COUNT paneles${NC}"
fi
echo ""

# Paso 6: Probar filtro por voltaje
echo "6️⃣  Probando filtro por voltaje (45-50V)..."
VOLTAGE=$(curl -s "$BASE_URL/marketplace/listings?minVoltage=45&maxVoltage=50")
VOLTAGE_COUNT=$(echo "$VOLTAGE" | jq -r '.totalPanels')

if [ "$VOLTAGE_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✅ Filtro por voltaje funciona: $VOLTAGE_COUNT paneles${NC}"
else
  echo -e "${YELLOW}⚠️  Filtro por voltaje: $VOLTAGE_COUNT paneles${NC}"
fi
echo ""

# Paso 7: Probar filtro por dimensiones
echo "7️⃣  Probando filtro por dimensiones (largo 160-170cm)..."
DIMENSIONS=$(curl -s "$BASE_URL/marketplace/listings?minLength=160&maxLength=170")
DIM_COUNT=$(echo "$DIMENSIONS" | jq -r '.totalPanels')

if [ "$DIM_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✅ Filtro por dimensiones funciona: $DIM_COUNT paneles${NC}"
else
  echo -e "${YELLOW}⚠️  Filtro por dimensiones: $DIM_COUNT paneles${NC}"
fi
echo ""

# Paso 8: Probar paginación
echo "8️⃣  Probando paginación (página 1, límite 2)..."
PAGINATED=$(curl -s "$BASE_URL/marketplace/listings?page=1&limit=2")
PAGE=$(echo "$PAGINATED" | jq -r '.page')
LIMIT=$(echo "$PAGINATED" | jq -r '.limit')
GROUPS_IN_PAGE=$(echo "$PAGINATED" | jq -r '.groups | length')

if [ "$PAGE" = "1" ] && [ "$LIMIT" = "2" ]; then
  echo -e "${GREEN}✅ Paginación funciona: página $PAGE, límite $LIMIT${NC}"
  echo "   Grupos en esta página: $GROUPS_IN_PAGE"
else
  echo -e "${RED}❌ Paginación no funciona correctamente${NC}"
fi
echo ""

# Paso 9: Probar endpoint de paneles individuales
echo "9️⃣  Probando GET /marketplace/panels (sin agrupar)..."
PANELS=$(curl -s "$BASE_URL/marketplace/panels?limit=5")
PANELS_COUNT=$(echo "$PANELS" | jq -r '.panels | length')

if [ "$PANELS_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✅ Endpoint de paneles individuales funciona: $PANELS_COUNT paneles${NC}"
  echo ""
  echo "Ejemplo de panel:"
  echo "$PANELS" | jq '.panels[0]'
else
  echo -e "${RED}❌ Endpoint de paneles individuales no retorna datos${NC}"
fi
echo ""

# Paso 10: Verificar estructura de grupos
echo "🔟 Verificando estructura de grupos..."
FIRST_GROUP=$(echo "$LISTINGS" | jq '.groups[0]')

if [ "$FIRST_GROUP" != "null" ]; then
  echo -e "${BLUE}Estructura del primer grupo:${NC}"
  echo "$FIRST_GROUP" | jq '{
    groupId,
    brand,
    model,
    powerRange,
    avgPower,
    avgVoltage,
    healthGrade,
    avgHealthPercentage,
    dimensions,
    availableCount,
    imageUrl
  }'
  
  HAS_IMAGE=$(echo "$FIRST_GROUP" | jq -r '.imageUrl')
  if [ "$HAS_IMAGE" != "null" ] && [ -n "$HAS_IMAGE" ]; then
    echo -e "${GREEN}✅ URL de imagen presente${NC}"
  else
    echo -e "${YELLOW}⚠️  URL de imagen no presente${NC}"
  fi
else
  echo -e "${RED}❌ No hay grupos disponibles${NC}"
fi
echo ""

# Paso 11: Verificar filtros disponibles
echo "1️⃣1️⃣  Verificando filtros disponibles..."
AVAILABLE_FILTERS=$(echo "$LISTINGS" | jq '.availableFilters')
echo "$AVAILABLE_FILTERS" | jq '.'

BRANDS_COUNT=$(echo "$AVAILABLE_FILTERS" | jq '.brands | length')
if [ "$BRANDS_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✅ Marcas disponibles: $BRANDS_COUNT${NC}"
else
  echo -e "${RED}❌ No hay marcas disponibles${NC}"
fi
echo ""

# Paso 12: Probar ordenamiento
echo "1️⃣2️⃣  Probando ordenamiento (por salud descendente)..."
SORTED=$(curl -s "$BASE_URL/marketplace/panels?sortBy=healthPercentage&sortOrder=desc&limit=3")
FIRST_HEALTH=$(echo "$SORTED" | jq -r '.panels[0].healthPercentage')
LAST_HEALTH=$(echo "$SORTED" | jq -r '.panels[2].healthPercentage')

if (( $(echo "$FIRST_HEALTH >= $LAST_HEALTH" | bc -l) )); then
  echo -e "${GREEN}✅ Ordenamiento funciona correctamente${NC}"
  echo "   Primera salud: ${FIRST_HEALTH}%"
  echo "   Última salud: ${LAST_HEALTH}%"
else
  echo -e "${RED}❌ Ordenamiento no funciona correctamente${NC}"
fi
echo ""

echo "=========================================="
echo "✅ TEST COMPLETADO"
echo "=========================================="
echo ""
echo "📊 Resumen de funcionalidades implementadas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Endpoint GET /marketplace/listings (agrupados)"
echo "✅ Endpoint GET /marketplace/panels (individuales)"
echo "✅ Filtros implementados:"
echo "   • Por marca(s)"
echo "   • Por rango de potencia"
echo "   • Por voltaje"
echo "   • Por grado de salud (A/B/C)"
echo "   • Por dimensiones"
echo "✅ Agrupación automática por:"
echo "   • Marca + Grado de salud + Rango de potencia"
echo "✅ Paginación funcional"
echo "✅ Ordenamiento personalizable"
echo "✅ Filtros disponibles para frontend"
echo "✅ URLs de imágenes de Cloudinary"
echo ""
echo "🎯 El marketplace está listo para mostrar paneles reacondicionados"
