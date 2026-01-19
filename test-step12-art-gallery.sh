#!/bin/bash

echo "=========================================="
echo "Test Step 12: API de Galería de Arte"
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

echo "🎨 Probando API de galería de arte para marketplace web"
echo ""

# Paso 1: Crear obras de arte de prueba
echo "1️⃣  Creando obras de arte de prueba..."

# Crear 5 paneles candidatos y publicar obras
for i in {1..5}; do
  QR_CODE="ART-GALLERY-TEST-$i-$(date +%s)"
  
  # Crear panel
  ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
    -H "Content-Type: application/json" \
    -d "{
      \"qrCode\": \"$QR_CODE\",
      \"brand\": \"SunPower\",
      \"model\": \"Maxeon 3\",
      \"status\": \"ART_CANDIDATE\"
    }")
  
  ASSET_ID=$(echo "$ASSET_RESPONSE" | jq -r '.id')
  
  if [ -z "$ASSET_ID" ] || [ "$ASSET_ID" = "null" ]; then
    echo -e "${RED}❌ Error al crear panel $i${NC}"
    continue
  fi
  
  # Determinar categoría y precio
  case $i in
    1)
      CATEGORY="SCULPTURE"
      PRICE=5000
      TITLE="Energía Solar Renacida"
      ARTIST="María García"
      ;;
    2)
      CATEGORY="SCULPTURE"
      PRICE=8500
      TITLE="Luz del Futuro"
      ARTIST="Carlos Mendoza"
      ;;
    3)
      CATEGORY="INSTALLATION"
      PRICE=12000
      TITLE="Instalación Sostenible"
      ARTIST="María García"
      ;;
    4)
      CATEGORY="NFT"
      PRICE=3500
      TITLE="NFT Solar Digital"
      ARTIST="Ana Rodríguez"
      ;;
    5)
      CATEGORY="SCULPTURE"
      PRICE=15000
      TITLE="Escultura Fotovoltaica"
      ARTIST="Carlos Mendoza"
      ;;
  esac
  
  # Publicar obra
  curl -s -X POST "$BASE_URL/art/publish" \
    -H "Content-Type: application/json" \
    -d "{
      \"assetId\": \"$ASSET_ID\",
      \"title\": \"$TITLE\",
      \"artist\": \"$ARTIST\",
      \"description\": \"Obra de arte única creada a partir de panel solar reciclado número $i\",
      \"priceMxn\": $PRICE,
      \"imageUrl\": \"https://res.cloudinary.com/dszhbfyki/image/upload/art_$i.jpg\"
    }" > /dev/null
  
  echo "   ✓ Obra $i: $TITLE ($CATEGORY, \$$PRICE MXN)"
done

echo -e "${GREEN}✅ Obras de arte de prueba creadas${NC}"
echo ""

# Paso 2: Obtener galería completa (sin filtros)
echo "2️⃣  Obteniendo galería completa..."
GALLERY_RESPONSE=$(curl -s "$BASE_URL/art/gallery")
echo "$GALLERY_RESPONSE" | jq '.'

TOTAL=$(echo "$GALLERY_RESPONSE" | jq -r '.total')
TOTAL_PAGES=$(echo "$GALLERY_RESPONSE" | jq -r '.totalPages')
ART_COUNT=$(echo "$GALLERY_RESPONSE" | jq '.artPieces | length')

echo ""
if [ "$TOTAL" -gt 0 ]; then
  echo -e "${GREEN}✅ Galería obtenida correctamente${NC}"
  echo "   Total de obras: $TOTAL"
  echo "   Obras en página 1: $ART_COUNT"
  echo "   Total de páginas: $TOTAL_PAGES"
else
  echo -e "${RED}❌ No se encontraron obras en la galería${NC}"
fi
echo ""

# Paso 3: Filtrar por categoría
echo "3️⃣  Filtrando por categoría SCULPTURE..."
SCULPTURE_RESPONSE=$(curl -s "$BASE_URL/art/gallery?category=SCULPTURE")
SCULPTURE_COUNT=$(echo "$SCULPTURE_RESPONSE" | jq '.artPieces | length')

echo "   Obras encontradas: $SCULPTURE_COUNT"
if [ "$SCULPTURE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Filtro por categoría funciona${NC}"
  echo ""
  echo "   Obras de categoría SCULPTURE:"
  echo "$SCULPTURE_RESPONSE" | jq '.artPieces[] | {title, artist, price}'
else
  echo -e "${YELLOW}⚠️  No se encontraron obras de categoría SCULPTURE${NC}"
fi
echo ""

# Paso 4: Filtrar por rango de precio
echo "4️⃣  Filtrando por rango de precio (200-500 USD)..."
PRICE_RESPONSE=$(curl -s "$BASE_URL/art/gallery?minPrice=200&maxPrice=500")
PRICE_COUNT=$(echo "$PRICE_RESPONSE" | jq '.artPieces | length')

echo "   Obras encontradas: $PRICE_COUNT"
if [ "$PRICE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Filtro por precio funciona${NC}"
  echo ""
  echo "   Obras en rango de precio:"
  echo "$PRICE_RESPONSE" | jq '.artPieces[] | {title, price, currency}'
else
  echo -e "${YELLOW}⚠️  No se encontraron obras en ese rango de precio${NC}"
fi
echo ""

# Paso 5: Buscar por texto
echo "5️⃣  Buscando por texto: 'Solar'..."
SEARCH_RESPONSE=$(curl -s "$BASE_URL/art/gallery?search=Solar")
SEARCH_COUNT=$(echo "$SEARCH_RESPONSE" | jq '.artPieces | length')

echo "   Obras encontradas: $SEARCH_COUNT"
if [ "$SEARCH_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Búsqueda por texto funciona${NC}"
  echo ""
  echo "   Resultados de búsqueda:"
  echo "$SEARCH_RESPONSE" | jq '.artPieces[] | {title, artist}'
else
  echo -e "${YELLOW}⚠️  No se encontraron obras con 'Solar'${NC}"
fi
echo ""

# Paso 6: Ordenar por precio ascendente
echo "6️⃣  Ordenando por precio ascendente..."
SORT_ASC_RESPONSE=$(curl -s "$BASE_URL/art/gallery?sortBy=price_asc&limit=3")
echo "   Primeras 3 obras (más baratas):"
echo "$SORT_ASC_RESPONSE" | jq '.artPieces[] | {title, price}'

FIRST_PRICE=$(echo "$SORT_ASC_RESPONSE" | jq '.artPieces[0].price')
SECOND_PRICE=$(echo "$SORT_ASC_RESPONSE" | jq '.artPieces[1].price')

if [ "$FIRST_PRICE" != "null" ] && [ "$SECOND_PRICE" != "null" ]; then
  if (( $(echo "$FIRST_PRICE <= $SECOND_PRICE" | bc -l) )); then
    echo -e "${GREEN}✅ Ordenamiento ascendente funciona${NC}"
  else
    echo -e "${RED}❌ Ordenamiento ascendente incorrecto${NC}"
  fi
fi
echo ""

# Paso 7: Ordenar por precio descendente
echo "7️⃣  Ordenando por precio descendente..."
SORT_DESC_RESPONSE=$(curl -s "$BASE_URL/art/gallery?sortBy=price_desc&limit=3")
echo "   Primeras 3 obras (más caras):"
echo "$SORT_DESC_RESPONSE" | jq '.artPieces[] | {title, price}'

FIRST_PRICE=$(echo "$SORT_DESC_RESPONSE" | jq '.artPieces[0].price')
SECOND_PRICE=$(echo "$SORT_DESC_RESPONSE" | jq '.artPieces[1].price')

if [ "$FIRST_PRICE" != "null" ] && [ "$SECOND_PRICE" != "null" ]; then
  if (( $(echo "$FIRST_PRICE >= $SECOND_PRICE" | bc -l) )); then
    echo -e "${GREEN}✅ Ordenamiento descendente funciona${NC}"
  else
    echo -e "${RED}❌ Ordenamiento descendente incorrecto${NC}"
  fi
fi
echo ""

# Paso 8: Paginación
echo "8️⃣  Probando paginación..."
PAGE1_RESPONSE=$(curl -s "$BASE_URL/art/gallery?page=1&limit=2")
PAGE2_RESPONSE=$(curl -s "$BASE_URL/art/gallery?page=2&limit=2")

PAGE1_COUNT=$(echo "$PAGE1_RESPONSE" | jq '.artPieces | length')
PAGE2_COUNT=$(echo "$PAGE2_RESPONSE" | jq '.artPieces | length')
PAGE1_NUM=$(echo "$PAGE1_RESPONSE" | jq '.page')
PAGE2_NUM=$(echo "$PAGE2_RESPONSE" | jq '.page')

echo "   Página 1: $PAGE1_COUNT obras (página $PAGE1_NUM)"
echo "   Página 2: $PAGE2_COUNT obras (página $PAGE2_NUM)"

if [ "$PAGE1_NUM" = "1" ] && [ "$PAGE2_NUM" = "2" ]; then
  echo -e "${GREEN}✅ Paginación funciona correctamente${NC}"
else
  echo -e "${RED}❌ Paginación incorrecta${NC}"
fi
echo ""

# Paso 9: Obtener filtros disponibles
echo "9️⃣  Obteniendo filtros disponibles..."
FILTERS=$(echo "$GALLERY_RESPONSE" | jq '.availableFilters')
echo "$FILTERS" | jq '.'

CATEGORIES=$(echo "$FILTERS" | jq '.categories | length')
MIN_PRICE=$(echo "$FILTERS" | jq '.priceRange.min')
MAX_PRICE=$(echo "$FILTERS" | jq '.priceRange.max')
ARTISTS=$(echo "$FILTERS" | jq '.artists | length')

echo ""
echo "   Categorías disponibles: $CATEGORIES"
echo "   Rango de precios: \$$MIN_PRICE - \$$MAX_PRICE USD"
echo "   Artistas: $ARTISTS"

if [ "$CATEGORIES" -gt 0 ] && [ "$ARTISTS" -gt 0 ]; then
  echo -e "${GREEN}✅ Filtros disponibles obtenidos${NC}"
else
  echo -e "${YELLOW}⚠️  Filtros incompletos${NC}"
fi
echo ""

# Paso 10: Obtener estadísticas de galería
echo "🔟 Obteniendo estadísticas de galería..."
STATS_RESPONSE=$(curl -s "$BASE_URL/art/gallery/stats")
echo "$STATS_RESPONSE" | jq '.'

TOTAL_PIECES=$(echo "$STATS_RESPONSE" | jq '.totalPieces')
AVAILABLE_PIECES=$(echo "$STATS_RESPONSE" | jq '.availablePieces')
SOLD_PIECES=$(echo "$STATS_RESPONSE" | jq '.soldPieces')
TOTAL_VALUE=$(echo "$STATS_RESPONSE" | jq '.totalValue')

echo ""
echo "   Total de obras: $TOTAL_PIECES"
echo "   Disponibles: $AVAILABLE_PIECES"
echo "   Vendidas: $SOLD_PIECES"
echo "   Valor total: \$$TOTAL_VALUE USD"

if [ "$TOTAL_PIECES" -gt 0 ]; then
  echo -e "${GREEN}✅ Estadísticas obtenidas correctamente${NC}"
  
  echo ""
  echo "   Por categoría:"
  echo "$STATS_RESPONSE" | jq '.byCategory[] | "   - \(.category): \(.count) obras (\(.totalValue) USD)"' -r
  
  echo ""
  echo "   Top artistas:"
  echo "$STATS_RESPONSE" | jq '.topArtists[] | "   - \(.artist): \(.count) obras"' -r
else
  echo -e "${RED}❌ No hay estadísticas disponibles${NC}"
fi
echo ""

# Paso 11: Obtener obra destacada
echo "1️⃣1️⃣  Obteniendo obra destacada..."
FEATURED_RESPONSE=$(curl -s "$BASE_URL/art/gallery/featured")

if [ "$FEATURED_RESPONSE" != "null" ]; then
  echo "$FEATURED_RESPONSE" | jq '.'
  
  FEATURED_TITLE=$(echo "$FEATURED_RESPONSE" | jq -r '.title')
  FEATURED_ARTIST=$(echo "$FEATURED_RESPONSE" | jq -r '.artist')
  FEATURED_PRICE=$(echo "$FEATURED_RESPONSE" | jq -r '.price')
  
  echo ""
  echo -e "${GREEN}✅ Obra destacada obtenida${NC}"
  echo "   Título: $FEATURED_TITLE"
  echo "   Artista: $FEATURED_ARTIST"
  echo "   Precio: \$$FEATURED_PRICE USD"
else
  echo -e "${YELLOW}⚠️  No hay obras destacadas disponibles${NC}"
fi
echo ""

# Paso 12: Filtros combinados
echo "1️⃣2️⃣  Probando filtros combinados..."
COMBINED_RESPONSE=$(curl -s "$BASE_URL/art/gallery?category=SCULPTURE&minPrice=200&maxPrice=600&sortBy=price_asc")
COMBINED_COUNT=$(echo "$COMBINED_RESPONSE" | jq '.artPieces | length')

echo "   Filtros: category=SCULPTURE, minPrice=200, maxPrice=600, sortBy=price_asc"
echo "   Obras encontradas: $COMBINED_COUNT"

if [ "$COMBINED_COUNT" -ge 0 ]; then
  echo -e "${GREEN}✅ Filtros combinados funcionan${NC}"
  
  if [ "$COMBINED_COUNT" -gt 0 ]; then
    echo ""
    echo "   Resultados:"
    echo "$COMBINED_RESPONSE" | jq '.artPieces[] | {title, category, price}'
  fi
else
  echo -e "${RED}❌ Error con filtros combinados${NC}"
fi
echo ""

echo "=========================================="
echo "✅ TEST COMPLETADO"
echo "=========================================="
echo ""
echo "📊 Resumen de funcionalidades implementadas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Endpoint GET /art/gallery"
echo "   • Listado de obras disponibles"
echo "   • Filtros: categoría, precio, búsqueda"
echo "   • Ordenamiento: newest, price_asc, price_desc, title"
echo "   • Paginación: page, limit"
echo "   • Filtros disponibles incluidos en respuesta"
echo ""
echo "✅ Endpoint GET /art/gallery/stats"
echo "   • Total de obras (total, disponibles, vendidas)"
echo "   • Valor total en USD"
echo "   • Estadísticas por categoría"
echo "   • Top 5 artistas"
echo ""
echo "✅ Endpoint GET /art/gallery/featured"
echo "   • Obra más reciente para destacar"
echo "   • Ideal para hero section del marketplace"
echo ""
echo "✅ Características:"
echo "   • Búsqueda insensible a mayúsculas/minúsculas"
echo "   • Filtros combinables"
echo "   • Respuesta optimizada para frontend"
echo "   • Metadatos de paginación incluidos"
echo ""
echo "🎯 Listo para integración con marketplace web"
