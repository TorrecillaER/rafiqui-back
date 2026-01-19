#!/bin/bash

# Script para probar el flujo de arte candidato
# Primero crea un panel ART_CANDIDATE y luego prueba el endpoint

BASE_URL="http://192.168.100.144:4000"
QR_CODE="RAFIQUI-ART-001"

echo "🎨 Test: Flujo de Arte Candidato"
echo "================================"
echo ""

# Paso 1: Crear un asset con estado ART_CANDIDATE
echo "📦 Paso 1: Creando panel candidato a arte..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d "{
    \"qrCode\": \"$QR_CODE\",
    \"brand\": \"SunPower\",
    \"model\": \"Maxeon 3\",
    \"status\": \"ART_CANDIDATE\"
  }")

echo "Respuesta: $CREATE_RESPONSE"
ASSET_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✅ Asset ID: $ASSET_ID"
echo ""

# Paso 2: Buscar panel candidato por QR
echo "🔍 Paso 2: Buscando panel candidato por QR..."
CANDIDATE_RESPONSE=$(curl -s -X GET "$BASE_URL/art/candidate/$QR_CODE")
echo "Respuesta: $CANDIDATE_RESPONSE"
echo ""

# Paso 3: Publicar obra de arte
echo "🎨 Paso 3: Publicando obra de arte..."
PUBLISH_RESPONSE=$(curl -s -X POST "$BASE_URL/art/publish" \
  -H "Content-Type: application/json" \
  -d "{
    \"assetId\": \"$ASSET_ID\",
    \"title\": \"Energía Renovada\",
    \"artist\": \"Artista Rafiki\",
    \"description\": \"Panel solar transformado en arte contemporáneo\",
    \"priceMxn\": 5000,
    \"imageUrl\": \"https://placeholder.com/art.jpg\"
  }")

echo "Respuesta: $PUBLISH_RESPONSE"
echo ""

# Paso 4: Verificar estado del asset
echo "✅ Paso 4: Verificando estado final del asset..."
ASSET_STATUS=$(curl -s -X GET "$BASE_URL/assets/$ASSET_ID")
echo "Estado del asset: $ASSET_STATUS"
echo ""

echo "🎉 Test completado!"
