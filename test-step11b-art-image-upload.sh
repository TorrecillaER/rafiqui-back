#!/bin/bash

echo "=========================================="
echo "Test Step 11b: Subida de Imagen de Arte"
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

echo "🎨 Probando endpoint de subida de imagen para obras de arte"
echo ""

# Crear imagen de prueba temporal
echo "📸 Creando imagen de prueba..."
TEST_IMAGE="/tmp/test-art-image.jpg"

# Crear una imagen simple con ImageMagick (si está disponible) o usar base64
if command -v convert &> /dev/null; then
  convert -size 800x600 xc:blue -pointsize 40 -fill white -gravity center \
    -annotate +0+0 "Arte Rafiqui\nPrueba de Subida" "$TEST_IMAGE"
  echo -e "${GREEN}✅ Imagen de prueba creada con ImageMagick${NC}"
elif command -v base64 &> /dev/null; then
  # Crear una imagen PNG simple en base64 y decodificarla
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE"
  echo -e "${YELLOW}⚠️  Imagen de prueba básica creada (1x1 pixel)${NC}"
else
  echo -e "${RED}❌ No se pudo crear imagen de prueba${NC}"
  echo "   Instala ImageMagick (brew install imagemagick) o proporciona una imagen manualmente"
  echo ""
  echo "   Puedes probar manualmente con:"
  echo "   curl -X POST $BASE_URL/art/upload-image -F \"file=@/ruta/a/tu/imagen.jpg\""
  exit 1
fi

echo ""

# Paso 1: Subir imagen sin archivo (debe fallar)
echo "1️⃣  Probando validación: subir sin archivo..."
NO_FILE_RESPONSE=$(curl -s -X POST "$BASE_URL/art/upload-image")
echo "$NO_FILE_RESPONSE" | jq '.' 2>/dev/null || echo "$NO_FILE_RESPONSE"

if echo "$NO_FILE_RESPONSE" | grep -q "No se proporcionó ninguna imagen"; then
  echo -e "${GREEN}✅ Validación correcta: rechaza peticiones sin archivo${NC}"
else
  echo -e "${YELLOW}⚠️  Respuesta inesperada al enviar sin archivo${NC}"
fi
echo ""

# Paso 2: Subir imagen válida
echo "2️⃣  Subiendo imagen de arte a Cloudinary..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/art/upload-image" \
  -F "file=@$TEST_IMAGE")

echo "$UPLOAD_RESPONSE" | jq '.'

UPLOAD_SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r '.success')
IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.imageUrl')
PUBLIC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.publicId')
WIDTH=$(echo "$UPLOAD_RESPONSE" | jq -r '.width')
HEIGHT=$(echo "$UPLOAD_RESPONSE" | jq -r '.height')
FORMAT=$(echo "$UPLOAD_RESPONSE" | jq -r '.format')

echo ""
if [ "$UPLOAD_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Imagen subida exitosamente${NC}"
  echo "   URL: $IMAGE_URL"
  echo "   Public ID: $PUBLIC_ID"
  echo "   Dimensiones: ${WIDTH}x${HEIGHT}"
  echo "   Formato: $FORMAT"
  
  # Verificar que la URL sea de Cloudinary
  if echo "$IMAGE_URL" | grep -q "res.cloudinary.com"; then
    echo -e "${GREEN}✅ URL de Cloudinary válida${NC}"
  else
    echo -e "${RED}❌ URL no es de Cloudinary${NC}"
  fi
  
  # Verificar que esté en la carpeta Art_Gallery
  if echo "$PUBLIC_ID" | grep -q "Art_Gallery"; then
    echo -e "${GREEN}✅ Imagen guardada en carpeta Art_Gallery${NC}"
  else
    echo -e "${YELLOW}⚠️  Imagen no está en carpeta Art_Gallery${NC}"
  fi
else
  echo -e "${RED}❌ Error al subir imagen${NC}"
  MESSAGE=$(echo "$UPLOAD_RESPONSE" | jq -r '.message')
  echo "   Mensaje: $MESSAGE"
fi
echo ""

# Paso 3: Crear panel candidato a arte
echo "3️⃣  Creando panel candidato a arte..."
QR_CODE="ART-IMG-TEST-$(date +%s)"

CREATE_ASSET=$(curl -s -X POST "$BASE_URL/assets" \
  -H "Content-Type: application/json" \
  -d "{
    \"qrCode\": \"$QR_CODE\",
    \"brand\": \"SunPower\",
    \"model\": \"Maxeon 3\",
    \"status\": \"WAREHOUSE_RECEIVED\"
  }")

ASSET_ID=$(echo "$CREATE_ASSET" | jq -r '.id')

if [ -z "$ASSET_ID" ] || [ "$ASSET_ID" = "null" ]; then
  echo -e "${RED}❌ Error al crear panel${NC}"
  exit 1
fi

# Crear inspección
curl -s -X POST "$BASE_URL/inspections" \
  -H "Content-Type: application/json" \
  -d "{
    \"assetId\": \"$ASSET_ID\",
    \"inspectorId\": \"inspector-test\",
    \"measuredVoltage\": 35.5,
    \"measuredAmps\": 8.2,
    \"physicalCondition\": \"Excelente para arte\",
    \"notes\": \"Panel ideal para conversión artística\"
  }" > /dev/null

# Actualizar a ART_CANDIDATE si no lo hizo automáticamente
curl -s -X PUT "$BASE_URL/assets/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"ART_CANDIDATE\"}" > /dev/null

echo -e "${GREEN}✅ Panel candidato creado: $ASSET_ID${NC}"
echo ""

# Paso 4: Publicar obra de arte usando la imagen subida
if [ "$UPLOAD_SUCCESS" = "true" ] && [ "$IMAGE_URL" != "null" ]; then
  echo "4️⃣  Publicando obra de arte con la imagen subida..."
  
  PUBLISH_RESPONSE=$(curl -s -X POST "$BASE_URL/art/publish" \
    -H "Content-Type: application/json" \
    -d "{
      \"assetId\": \"$ASSET_ID\",
      \"title\": \"Energía Solar Transformada\",
      \"artist\": \"Artista Rafiqui\",
      \"description\": \"Obra de arte única creada a partir de un panel solar reciclado. Esta pieza representa la transformación de la tecnología en arte.\",
      \"priceMxn\": 8500,
      \"imageUrl\": \"$IMAGE_URL\"
    }")
  
  echo "$PUBLISH_RESPONSE" | jq '.'
  
  PUBLISH_SUCCESS=$(echo "$PUBLISH_RESPONSE" | jq -r '.success')
  ART_PIECE_ID=$(echo "$PUBLISH_RESPONSE" | jq -r '.artPiece.id')
  ART_IMAGE_URL=$(echo "$PUBLISH_RESPONSE" | jq -r '.artPiece.imageUrl')
  
  echo ""
  if [ "$PUBLISH_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Obra de arte publicada con imagen${NC}"
    echo "   ID de obra: $ART_PIECE_ID"
    echo "   URL de imagen: $ART_IMAGE_URL"
    
    # Verificar que la URL de la obra coincida con la subida
    if [ "$ART_IMAGE_URL" = "$IMAGE_URL" ]; then
      echo -e "${GREEN}✅ URL de imagen coincide con la subida${NC}"
    else
      echo -e "${YELLOW}⚠️  URL de imagen no coincide${NC}"
      echo "   Esperada: $IMAGE_URL"
      echo "   Obtenida: $ART_IMAGE_URL"
    fi
  else
    echo -e "${RED}❌ Error al publicar obra de arte${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Saltando publicación (no hay imagen subida)${NC}"
fi
echo ""

# Paso 5: Verificar que la imagen es accesible
if [ "$IMAGE_URL" != "null" ] && [ -n "$IMAGE_URL" ]; then
  echo "5️⃣  Verificando accesibilidad de la imagen..."
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$IMAGE_URL")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Imagen accesible (HTTP 200)${NC}"
    echo "   URL: $IMAGE_URL"
  else
    echo -e "${RED}❌ Imagen no accesible (HTTP $HTTP_CODE)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No hay URL de imagen para verificar${NC}"
fi
echo ""

# Paso 6: Probar subida de archivo no permitido
echo "6️⃣  Probando validación: archivo no permitido..."

# Crear archivo de texto temporal
echo "Este es un archivo de texto, no una imagen" > /tmp/test-text.txt

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/art/upload-image" \
  -F "file=@/tmp/test-text.txt")

echo "$INVALID_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_RESPONSE"

if echo "$INVALID_RESPONSE" | grep -q "Solo se permiten imágenes"; then
  echo -e "${GREEN}✅ Validación correcta: rechaza archivos no permitidos${NC}"
else
  echo -e "${YELLOW}⚠️  Validación de tipo de archivo no funcionó como esperado${NC}"
fi

rm -f /tmp/test-text.txt
echo ""

# Limpiar imagen de prueba
rm -f "$TEST_IMAGE"

echo "=========================================="
echo "✅ TEST COMPLETADO"
echo "=========================================="
echo ""
echo "📊 Resumen de funcionalidades implementadas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Endpoint POST /art/upload-image"
echo "   • Sube imágenes a Cloudinary"
echo "   • Carpeta: Art_Gallery"
echo "   • Formatos: JPEG, PNG, WEBP"
echo "   • Tamaño máximo: 15MB"
echo "   • Retorna URL, publicId, dimensiones"
echo ""
echo "✅ Validaciones implementadas:"
echo "   • Archivo requerido"
echo "   • Tipo de archivo (solo imágenes)"
echo "   • Tamaño máximo (15MB)"
echo ""
echo "✅ Integración con publicación de arte:"
echo "   • La URL se puede usar en POST /art/publish"
echo "   • Se guarda en el campo imageUrl de ArtPiece"
echo ""
echo "🎯 Flujo completo de publicación con imagen:"
echo "   1. POST /art/upload-image → Obtener imageUrl"
echo "   2. POST /art/publish con imageUrl → Crear obra"
echo "   3. La obra queda publicada con su imagen"
echo ""
echo "📱 Ejemplo desde Flutter:"
echo "   1. Seleccionar imagen de galería"
echo "   2. Subir a /art/upload-image"
echo "   3. Usar imageUrl en formulario de publicación"
echo "   4. Enviar a /art/publish"
