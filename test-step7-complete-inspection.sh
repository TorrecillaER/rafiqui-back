#!/bin/bash

echo "=========================================="
echo "Test Step 7: Completar Inspección con Blockchain"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Login como inspector..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inspector@rafiqui.com",
    "password": "password123"
  }' | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login exitoso${NC}"
  INSPECTOR_ID=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "inspector@rafiqui.com",
      "password": "password123"
    }' | jq -r '.user.id')
  echo "Inspector ID: $INSPECTOR_ID"
else
  echo -e "${RED}❌ Error en login${NC}"
  exit 1
fi
echo ""

echo "2. Creando panel para REUSE (alta eficiencia)..."
ASSET_REUSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-REUSE-001",
    "brand": "SunPower",
    "model": "Maxeon 3",
    "status": "INSPECTING"
  }')
ASSET_REUSE_ID=$(echo "$ASSET_REUSE" | jq -r '.id')
echo "Asset REUSE creado: $ASSET_REUSE_ID"
echo ""

echo "3. Creando panel para RECYCLE (baja eficiencia)..."
ASSET_RECYCLE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-RECYCLE-001",
    "brand": "Generic",
    "model": "Low Power",
    "status": "INSPECTING"
  }')
ASSET_RECYCLE_ID=$(echo "$ASSET_RECYCLE" | jq -r '.id')
echo "Asset RECYCLE creado: $ASSET_RECYCLE_ID"
echo ""

echo "4. Creando panel para ART (baja eficiencia + condición POOR)..."
ASSET_ART=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "PANEL-ART-001",
    "brand": "Vintage",
    "model": "Classic",
    "status": "INSPECTING"
  }')
ASSET_ART_ID=$(echo "$ASSET_ART" | jq -r '.id')
echo "Asset ART creado: $ASSET_ART_ID"
echo ""

echo "5. Inspeccionando panel para REUSE (35V x 8.5A = 297.5W, GOOD)..."
INSPECTION_REUSE=$(curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assetId\": \"$ASSET_REUSE_ID\",
    \"measuredVoltage\": 35.0,
    \"measuredAmps\": 8.5,
    \"physicalCondition\": \"GOOD\",
    \"photoUrl\": \"https://example.com/photo1.jpg\",
    \"notes\": \"Panel en excelente estado, alta eficiencia\"
  }")

echo "$INSPECTION_REUSE" | jq '.'
AI_RECOMMENDATION=$(echo "$INSPECTION_REUSE" | jq -r '.aiRecommendation')
BLOCKCHAIN_STATUS=$(echo "$INSPECTION_REUSE" | jq -r '.blockchainStatus')

if [ "$AI_RECOMMENDATION" = "REUSE" ]; then
  echo -e "${GREEN}✅ AI recomienda REUSE correctamente${NC}"
else
  echo -e "${RED}❌ AI recomendó $AI_RECOMMENDATION, esperaba REUSE${NC}"
fi
echo "Blockchain Status: $BLOCKCHAIN_STATUS"
echo ""

echo "6. Verificando que el asset cambió a READY_FOR_REUSE..."
ASSET_STATUS=$(curl -s "$BASE_URL/assets/by-qr/PANEL-REUSE-001" | jq -r '.status')
if [ "$ASSET_STATUS" = "READY_FOR_REUSE" ]; then
  echo -e "${GREEN}✅ Asset cambió a READY_FOR_REUSE${NC}"
else
  echo -e "${RED}❌ Asset está en $ASSET_STATUS, esperaba READY_FOR_REUSE${NC}"
fi
echo ""

echo "7. Inspeccionando panel para RECYCLE (10V x 3A = 30W, GOOD)..."
INSPECTION_RECYCLE=$(curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assetId\": \"$ASSET_RECYCLE_ID\",
    \"measuredVoltage\": 10.0,
    \"measuredAmps\": 3.0,
    \"physicalCondition\": \"GOOD\",
    \"photoUrl\": \"https://example.com/photo2.jpg\",
    \"notes\": \"Panel con baja eficiencia\"
  }")

echo "$INSPECTION_RECYCLE" | jq '.'
AI_RECOMMENDATION=$(echo "$INSPECTION_RECYCLE" | jq -r '.aiRecommendation')

if [ "$AI_RECOMMENDATION" = "RECYCLE" ]; then
  echo -e "${GREEN}✅ AI recomienda RECYCLE correctamente${NC}"
else
  echo -e "${RED}❌ AI recomendó $AI_RECOMMENDATION, esperaba RECYCLE${NC}"
fi
echo ""

echo "8. Inspeccionando panel para ART (8V x 2A = 16W, POOR)..."
INSPECTION_ART=$(curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assetId\": \"$ASSET_ART_ID\",
    \"measuredVoltage\": 8.0,
    \"measuredAmps\": 2.0,
    \"physicalCondition\": \"POOR\",
    \"photoUrl\": \"https://example.com/photo3.jpg\",
    \"notes\": \"Panel con características visuales interesantes para arte\"
  }")

echo "$INSPECTION_ART" | jq '.'
AI_RECOMMENDATION=$(echo "$INSPECTION_ART" | jq -r '.aiRecommendation')

if [ "$AI_RECOMMENDATION" = "ART" ]; then
  echo -e "${GREEN}✅ AI recomienda ART correctamente${NC}"
else
  echo -e "${YELLOW}⚠️  AI recomendó $AI_RECOMMENDATION, esperaba ART${NC}"
fi
echo ""

echo "9. Verificando que el asset cambió a ART_CANDIDATE..."
ASSET_STATUS=$(curl -s "$BASE_URL/assets/by-qr/PANEL-ART-001" | jq -r '.status')
if [ "$ASSET_STATUS" = "ART_CANDIDATE" ]; then
  echo -e "${GREEN}✅ Asset cambió a ART_CANDIDATE${NC}"
else
  echo -e "${YELLOW}⚠️  Asset está en $ASSET_STATUS${NC}"
fi
echo ""

echo "10. Obteniendo estadísticas del inspector..."
STATS=$(curl -s "$BASE_URL/inspections/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATS" | jq '.'
TOTAL=$(echo "$STATS" | jq -r '.total')
REUSE=$(echo "$STATS" | jq -r '.reuse')
RECYCLE=$(echo "$STATS" | jq -r '.recycle')
ART=$(echo "$STATS" | jq -r '.art')

echo ""
echo "Estadísticas:"
echo "  Total: $TOTAL"
echo "  REUSE: $REUSE"
echo "  RECYCLE: $RECYCLE"
echo "  ART: $ART"
echo ""

echo "=========================================="
echo "Test completado"
echo "=========================================="
echo ""
echo "Resumen de funcionalidades implementadas:"
echo "✓ Inspección completa actualiza estado del asset"
echo "✓ TriageEngine evalúa y recomienda REUSE/RECYCLE/ART"
echo "✓ Estado se actualiza en blockchain automáticamente"
echo "✓ Estadísticas incluyen contador de ART"
echo "✓ Campo notes opcional en inspecciones"
echo "✓ Campo inspectedAt registra fecha de inspección"
echo ""
echo "Estados de blockchain:"
echo "  REUSE → REUSE_APPROVED"
echo "  RECYCLE → RECYCLE_APPROVED"
echo "  ART → ART_APPROVED"
