# Configuración de Imágenes para Marketplace

## Problema Actual

El endpoint de marketplace intenta cargar imágenes desde Cloudinary pero retorna 400 Bad Request porque las imágenes no existen o la ruta es incorrecta.

## Solución

### Opción 1: Subir Imágenes a Cloudinary (Recomendado)

1. **Estructura de carpetas en Cloudinary:**
   ```
   rafiqui/
   └── marketplace/
       ├── Trina_A.png
       ├── Trina_B.png
       ├── Trina_C.png
       ├── Canadian_A.png
       ├── Canadian_B.png
       ├── Canadian_C.png
       ├── SunPower_A.png
       ├── SunPower_B.png
       ├── SunPower_C.png
       ├── JA_A.png
       ├── JA_B.png
       ├── JA_C.png
       ├── Jinko_A.png
       ├── Jinko_B.png
       ├── Jinko_C.png
       ├── LONGi_A.png
       ├── LONGi_B.png
       ├── LONGi_C.png
       ├── LG_A.png
       ├── LG_B.png
       ├── LG_C.png
       └── Generic_A.png (fallback)
   ```

2. **Subir imágenes manualmente:**
   - Ve a tu dashboard de Cloudinary
   - Crea la carpeta `rafiqui/marketplace`
   - Sube las imágenes con los nombres exactos listados arriba

3. **O usar el endpoint de upload:**
   ```bash
   curl -X POST http://localhost:4000/upload/image?folder=rafiqui/marketplace \
     -F "file=@Trina_A.png"
   ```

### Opción 2: Cambiar la Carpeta en Variables de Entorno

Si tus imágenes ya están en Cloudinary pero en otra carpeta, actualiza tu `.env`:

```env
CLOUDINARY_MARKETPLACE_FOLDER="tu-carpeta-actual"
```

Por ejemplo, si tus imágenes están en `Assets_Refurbished`:
```env
CLOUDINARY_MARKETPLACE_FOLDER="Assets_Refurbished"
```

### Opción 3: Usar Placeholder Temporal

Si no tienes las imágenes aún, el sistema usará automáticamente un placeholder:
```
https://via.placeholder.com/400x300/1e40af/ffffff?text=Panel+Solar
```

---

## Formato de Nombres de Archivo

Las imágenes deben seguir este formato:
```
{Marca}_{Grado}.png
```

Donde:
- **Marca**: Nombre mapeado de la marca (ver tabla abajo)
- **Grado**: A, B o C

### Mapeo de Marcas

| Marca en BD | Nombre de Archivo |
|-------------|-------------------|
| Trina | Trina |
| Trina Solar | Trina |
| Canadian | Canadian |
| Canadian Solar | Canadian |
| JA | JA |
| JA Solar | JA |
| Jinko | Jinko |
| Jinko Solar | Jinko |
| LONGi | LONGi |
| Longi | LONGi |
| SunPower | SunPower |
| LG | LG |
| Otros | Generic |

---

## Verificar URLs Generadas

Para ver qué URLs está generando el backend:

1. Llama al endpoint:
   ```bash
   curl http://localhost:4000/marketplace/listings | jq '.groups[0].imageUrl'
   ```

2. Verifica que la URL sea correcta:
   ```
   https://res.cloudinary.com/dszhbfyki/image/upload/rafiqui/marketplace/Trina_B.png
   ```

3. Prueba la URL directamente en el navegador para verificar que la imagen existe

---

## Ejemplo de URLs Correctas

```
https://res.cloudinary.com/dszhbfyki/image/upload/rafiqui/marketplace/Trina_A.png
https://res.cloudinary.com/dszhbfyki/image/upload/rafiqui/marketplace/Canadian_B.png
https://res.cloudinary.com/dszhbfyki/image/upload/rafiqui/marketplace/SunPower_C.png
```

---

## Crear Imágenes de Prueba

Si necesitas crear imágenes de prueba rápidamente:

```bash
# Instalar ImageMagick (si no lo tienes)
brew install imagemagick

# Crear imágenes de prueba
for brand in Trina Canadian SunPower JA Jinko LONGi LG; do
  for grade in A B C; do
    convert -size 400x300 -background "#1e40af" -fill white \
      -gravity center -pointsize 40 \
      label:"$brand\nGrado $grade" \
      "${brand}_${grade}.png"
  done
done

# Subir a Cloudinary
for file in *.png; do
  curl -X POST http://localhost:4000/upload/image?folder=rafiqui/marketplace \
    -F "file=@$file"
done
```

---

## Troubleshooting

### Error 400 Bad Request

**Causa:** La imagen no existe en Cloudinary

**Solución:**
1. Verifica que la carpeta existe en Cloudinary
2. Verifica que el nombre del archivo es exacto (case-sensitive)
3. Sube la imagen si no existe

### URL con "YOUR_CLOUD_NAME"

**Causa:** Variable de entorno no configurada

**Solución:**
```env
CLOUDINARY_CLOUD_NAME="dszhbfyki"  # Tu cloud name real
```

### Imagen no se muestra en Next.js

**Causa:** Next.js necesita configurar dominios permitidos

**Solución en next.config.js:**
```javascript
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
  },
}
```

---

## Variables de Entorno Necesarias

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME="dszhbfyki"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"

# Opcional: Carpeta personalizada para marketplace
CLOUDINARY_MARKETPLACE_FOLDER="rafiqui/marketplace"
```

---

## Recomendación Final

1. ✅ Crea la carpeta `rafiqui/marketplace` en Cloudinary
2. ✅ Sube al menos una imagen de prueba (ej: `Trina_B.png`)
3. ✅ Verifica la URL directamente en el navegador
4. ✅ Configura Next.js para permitir `res.cloudinary.com`
5. ✅ Reinicia el backend y el frontend
