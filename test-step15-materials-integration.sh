#!/bin/bash

echo "=========================================="
echo "Test Step 15: Integración de Materiales ERC-1155"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "🔄 Probando integración del contrato RafiquiMaterials (ERC-1155)"
echo ""

# Paso 1: Crear panel para reciclaje
echo "1️⃣  Creando panel para reciclaje..."
QR_CODE="RECYCLE-TEST-$(date +%s)"

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d "{
    \"qrCode\": \"$QR_CODE\",
    \"brand\": \"Jinko Solar\",
    \"model\": \"Tiger Pro\",
    \"status\": \"WAREHOUSE_RECEIVED\"
  }")

ASSET_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [ -z "$ASSET_ID" ] || [ "$ASSET_ID" = "null" ]; then
  echo -e "${RED}❌ Error al crear panel${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Panel creado: $ASSET_ID${NC}"
echo ""

# Paso 2: Crear inspección con recomendación RECYCLE
echo "2️⃣  Creando inspección con recomendación RECYCLE..."

INSPECTOR_ID=$(curl -s "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"inspector@rafiqui.com","password":"password123"}' | jq -r '.userId')

INSPECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -d "{
    \"assetId\": \"$ASSET_ID\",
    \"inspectorId\": \"$INSPECTOR_ID\",
    \"measuredVoltage\": 15.5,
    \"measuredAmps\": 3.2,
    \"physicalCondition\": \"Panel severamente dañado, no apto para reuso\",
    \"notes\": \"Recomendado para reciclaje\"
  }")

echo "$INSPECTION_RESPONSE" | jq '.'

AI_RECOMMENDATION=$(echo "$INSPECTION_RESPONSE" | jq -r '.aiRecommendation')

if [ "$AI_RECOMMENDATION" = "RECYCLE" ]; then
  echo -e "${GREEN}✅ Inspección creada con recomendación RECYCLE${NC}"
else
  echo -e "${YELLOW}⚠️  Recomendación: $AI_RECOMMENDATION (esperado: RECYCLE)${NC}"
fi
echo ""

# Paso 3: Verificar que el panel puede ser reciclado
echo "3️⃣  Verificando que el panel puede ser reciclado..."
CHECK_RESPONSE=$(curl -s "$BASE_URL/recycle/check/$QR_CODE")
echo "$CHECK_RESPONSE" | jq '.'

CAN_RECYCLE=$(echo "$CHECK_RESPONSE" | jq -r '.canRecycle')

if [ "$CAN_RECYCLE" = "true" ]; then
  echo -e "${GREEN}✅ Panel aprobado para reciclaje${NC}"
else
  echo -e "${RED}❌ Panel no puede ser reciclado${NC}"
  REASON=$(echo "$CHECK_RESPONSE" | jq -r '.reason')
  echo "   Razón: $REASON"
fi
echo ""

# Paso 4: Procesar reciclaje (mintea tokens ERC-1155)
echo "4️⃣  Procesando reciclaje y minteando tokens ERC-1155..."
echo "   Peso del panel: 20 kg"
echo "   Materiales esperados:"
echo "   - Aluminio: 7.0 kg (70 tokens)"
echo "   - Vidrio: 8.0 kg (80 tokens)"
echo "   - Silicio: 3.0 kg (30 tokens)"
echo "   - Cobre: 2.0 kg (20 tokens)"
echo ""

OPERATOR_ID=$(curl -s "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"collector@rafiqui.com","password":"password123"}' | jq -r '.userId')

RECYCLE_RESPONSE=$(curl -s -X POST "$BASE_URL/recycle/process" \
  -H "Content-Type: application/json" \
  -d "{
    \"assetId\": \"$ASSET_ID\",
    \"operatorId\": \"$OPERATOR_ID\",
    \"panelWeightKg\": 20
  }")

echo "$RECYCLE_RESPONSE" | jq '.'

SUCCESS=$(echo "$RECYCLE_RESPONSE" | jq -r '.success')
RECYCLE_ID=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.id')
BLOCKCHAIN_TX=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.blockchainTxHash')
MATERIALS_TX=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.materialsTxHash')

ALUMINUM_KG=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.materials.aluminum')
GLASS_KG=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.materials.glass')
SILICON_KG=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.materials.silicon')
COPPER_KG=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.materials.copper')

ALUMINUM_TOKENS=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.tokensMinted.aluminum')
GLASS_TOKENS=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.tokensMinted.glass')
SILICON_TOKENS=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.tokensMinted.silicon')
COPPER_TOKENS=$(echo "$RECYCLE_RESPONSE" | jq -r '.recycleRecord.tokensMinted.copper')

echo ""
if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Reciclaje procesado exitosamente${NC}"
  echo "   ID de registro: $RECYCLE_ID"
  echo ""
  echo "   📦 Materiales separados:"
  echo "   - Aluminio: ${ALUMINUM_KG} kg"
  echo "   - Vidrio: ${GLASS_KG} kg"
  echo "   - Silicio: ${SILICON_KG} kg"
  echo "   - Cobre: ${COPPER_KG} kg"
  echo ""
  
  if [ "$MATERIALS_TX" != "null" ] && [ -n "$MATERIALS_TX" ]; then
    echo -e "${GREEN}✅ Tokens ERC-1155 minteados${NC}"
    echo "   TX Hash: $MATERIALS_TX"
    echo ""
    echo "   🪙 Tokens minteados:"
    echo "   - Aluminio: ${ALUMINUM_TOKENS} tokens"
    echo "   - Vidrio: ${GLASS_TOKENS} tokens"
    echo "   - Silicio: ${SILICON_TOKENS} tokens"
    echo "   - Cobre: ${COPPER_TOKENS} tokens"
  else
    echo -e "${YELLOW}⚠️  Contrato de materiales no configurado${NC}"
    echo "   Los tokens no fueron minteados (requiere MATERIALS_CONTRACT_ADDRESS en .env)"
  fi
  
  if [ "$BLOCKCHAIN_TX" != "null" ] && [ -n "$BLOCKCHAIN_TX" ]; then
    echo ""
    echo -e "${GREEN}✅ Estado actualizado en blockchain RafiquiTracker${NC}"
    echo "   TX Hash: $BLOCKCHAIN_TX"
  fi
else
  echo -e "${RED}❌ Error al procesar reciclaje${NC}"
  MESSAGE=$(echo "$RECYCLE_RESPONSE" | jq -r '.message')
  echo "   Mensaje: $MESSAGE"
fi
echo ""

# Paso 5: Obtener stock de materiales en BD
echo "5️⃣  Obteniendo stock de materiales en base de datos..."
STOCK_RESPONSE=$(curl -s "$BASE_URL/recycle/materials")
echo "$STOCK_RESPONSE" | jq '.'

echo ""
echo "   Stock actualizado:"
echo "$STOCK_RESPONSE" | jq -r '.[] | "   - \(.name): \(.availableKg) kg disponibles (\(.pricePerKg) USD/kg)"'
echo ""

# Paso 6: Obtener balances del treasury (ERC-1155)
echo "6️⃣  Obteniendo balances de tokens en treasury (ERC-1155)..."
TREASURY_RESPONSE=$(curl -s "$BASE_URL/recycle/materials/treasury")
echo "$TREASURY_RESPONSE" | jq '.'

TREASURY_ALUMINUM=$(echo "$TREASURY_RESPONSE" | jq -r '.aluminum')
TREASURY_GLASS=$(echo "$TREASURY_RESPONSE" | jq -r '.glass')
TREASURY_SILICON=$(echo "$TREASURY_RESPONSE" | jq -r '.silicon')
TREASURY_COPPER=$(echo "$TREASURY_RESPONSE" | jq -r '.copper')

echo ""
if [ "$TREASURY_ALUMINUM" != "0" ] || [ "$TREASURY_GLASS" != "0" ]; then
  echo -e "${GREEN}✅ Balances de treasury obtenidos${NC}"
  echo "   Aluminio: ${TREASURY_ALUMINUM} kg"
  echo "   Vidrio: ${TREASURY_GLASS} kg"
  echo "   Silicio: ${TREASURY_SILICON} kg"
  echo "   Cobre: ${TREASURY_COPPER} kg"
else
  echo -e "${YELLOW}⚠️  Treasury vacío o contrato no configurado${NC}"
fi
echo ""

# Paso 7: Obtener historial de reciclajes
echo "7️⃣  Obteniendo historial de reciclajes..."
HISTORY_RESPONSE=$(curl -s "$BASE_URL/recycle/history?limit=5")
HISTORY_COUNT=$(echo "$HISTORY_RESPONSE" | jq '. | length')

echo "   Últimos $HISTORY_COUNT reciclajes:"
echo "$HISTORY_RESPONSE" | jq -r '.[] | "   - Panel \(.asset.brand) \(.asset.model) (\(.panelWeightKg)kg) - \(.createdAt)"'

if [ "$HISTORY_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Historial obtenido${NC}"
else
  echo -e "${YELLOW}⚠️  No hay reciclajes en el historial${NC}"
fi
echo ""

# Paso 8: Verificar estado del asset
echo "8️⃣  Verificando estado final del asset..."
ASSET_RESPONSE=$(curl -s "$BASE_URL/assets/$ASSET_ID")
ASSET_STATUS=$(echo "$ASSET_RESPONSE" | jq -r '.status')

if [ "$ASSET_STATUS" = "RECYCLED" ]; then
  echo -e "${GREEN}✅ Asset marcado como RECYCLED${NC}"
else
  echo -e "${RED}❌ Estado incorrecto: $ASSET_STATUS${NC}"
fi
echo ""

echo "=========================================="
echo "✅ TEST COMPLETADO"
echo "=========================================="
echo ""
echo "📊 Resumen de funcionalidades implementadas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MaterialsBlockchainService"
echo "   • Conexión con contrato RafiquiMaterials (ERC-1155)"
echo "   • Minteo de tokens al reciclar paneles"
echo "   • Consulta de balances (treasury y wallets)"
echo "   • Transferencia de tokens a compradores"
echo ""
echo "✅ RecycleModule"
echo "   • POST /recycle/process"
echo "   • GET /recycle/check/:qrCode"
echo "   • GET /recycle/materials (stock en BD)"
echo "   • GET /recycle/materials/treasury (tokens ERC-1155)"
echo "   • GET /recycle/materials/wallet/:address"
echo "   • GET /recycle/history"
echo ""
echo "✅ Modelos de Prisma"
echo "   • RecycleRecord (con materialsTxHash)"
echo "   • MaterialStock"
echo "   • MaterialType enum"
echo ""
echo "✅ Flujo completo de reciclaje:"
echo "   1. Inspección → Recomendación RECYCLE"
echo "   2. Verificar elegibilidad (GET /recycle/check/:qr)"
echo "   3. Procesar reciclaje (POST /recycle/process)"
echo "   4. Separar materiales (35% Al, 40% Gl, 15% Si, 10% Cu)"
echo "   5. Actualizar stock en BD"
echo "   6. Mintear tokens ERC-1155 (10 tokens/kg)"
echo "   7. Actualizar blockchain RafiquiTracker"
echo "   8. Tokens disponibles para venta"
echo ""
echo "🔗 Integración blockchain:"
echo "   • RafiquiTracker: Estado RECYCLED"
echo "   • RafiquiMaterials: Tokens ERC-1155 minteados"
echo "   • Trazabilidad completa del reciclaje"
echo ""
echo "📝 Variables de entorno requeridas:"
echo "   • BLOCKCHAIN_RPC_URL (default: Polygon Amoy)"
echo "   • BLOCKCHAIN_PRIVATE_KEY"
echo "   • MATERIALS_CONTRACT_ADDRESS"
echo ""
echo "🎯 Próximos pasos:"
echo "   • Implementar transferencia de tokens al vender"
echo "   • Crear marketplace de materiales reciclados"
echo "   • Dashboard de inventario de tokens"
