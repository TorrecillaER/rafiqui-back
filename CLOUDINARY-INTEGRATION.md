# Integración de Cloudinary

Este documento describe cómo usar Cloudinary para el manejo de imágenes en Rafiqui Backend.

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
```

Para obtener estas credenciales:
1. Crea una cuenta en [Cloudinary](https://cloudinary.com/)
2. Ve a tu Dashboard
3. Copia las credenciales (Cloud Name, API Key, API Secret)

### 2. Dependencias Instaladas

```bash
npm install cloudinary multer @nestjs/platform-express
npm install --save-dev @types/multer
```

---

## Endpoints Disponibles

### Subir Imagen

**POST** `/upload/image`

Sube una imagen a Cloudinary y retorna la URL pública.

#### Request

- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: Archivo de imagen (JPEG, PNG, WEBP)
- **Query Parameters** (opcional):
  - `folder`: Carpeta en Cloudinary (default: `rafiqui`)

#### Validaciones

- Tipos permitidos: JPEG, PNG, WEBP
- Tamaño máximo: 10MB
- Transformaciones automáticas:
  - Máximo 1920x1080px
  - Calidad: auto:good

#### Response

```json
{
  "success": true,
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/rafiqui/abc123.jpg",
  "publicId": "rafiqui/abc123",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "bytes": 245678
}
```

---

## Uso desde Flutter

### Ejemplo: Subir Imagen de Inspección

```dart
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

Future<String?> uploadInspectionPhoto() async {
  // 1. Seleccionar imagen
  final ImagePicker picker = ImagePicker();
  final XFile? image = await picker.pickImage(
    source: ImageSource.camera,
    maxWidth: 1920,
    maxHeight: 1080,
    imageQuality: 85,
  );

  if (image == null) return null;

  // 2. Preparar FormData
  final formData = FormData.fromMap({
    'file': await MultipartFile.fromFile(
      image.path,
      filename: 'inspection_${DateTime.now().millisecondsSinceEpoch}.jpg',
    ),
  });

  // 3. Subir a Cloudinary
  try {
    final response = await dio.post(
      'http://192.168.100.155:4000/upload/image?folder=inspections',
      data: formData,
      options: Options(
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      ),
    );

    if (response.data['success']) {
      return response.data['url']; // URL de Cloudinary
    }
  } catch (e) {
    print('Error uploading image: $e');
  }

  return null;
}

// Uso en inspección
Future<void> createInspection(String assetId) async {
  // Subir foto primero
  final photoUrl = await uploadInspectionPhoto();
  
  if (photoUrl == null) {
    // Manejar error
    return;
  }

  // Crear inspección con la URL
  await dio.post(
    'http://192.168.100.155:4000/inspections',
    data: {
      'assetId': assetId,
      'measuredVoltage': 35.0,
      'measuredAmps': 8.5,
      'physicalCondition': 'GOOD',
      'photoUrl': photoUrl, // URL de Cloudinary
      'notes': 'Panel en buen estado',
    },
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    ),
  );
}
```

---

## Uso desde cURL

### Subir Imagen

```bash
curl -X POST http://localhost:4000/upload/image \
  -F "file=@/path/to/image.jpg" \
  -F "folder=inspections"
```

### Con Carpeta Personalizada

```bash
curl -X POST "http://localhost:4000/upload/image?folder=refurbishment" \
  -F "file=@panel_photo.jpg"
```

---

## CloudinaryService - Métodos Disponibles

El servicio `CloudinaryService` está disponible para inyectar en otros módulos:

### 1. uploadImage()

```typescript
async uploadImage(
  file: Express.Multer.File,
  folder: string = 'rafiqui',
): Promise<UploadApiResponse>
```

Sube una imagen desde un buffer.

### 2. deleteImage()

```typescript
async deleteImage(publicId: string): Promise<any>
```

Elimina una imagen usando su `public_id`.

### 3. extractPublicId()

```typescript
extractPublicId(url: string): string | null
```

Extrae el `public_id` de una URL de Cloudinary.

### 4. getTransformedUrl()

```typescript
getTransformedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {},
): string
```

Genera una URL transformada con dimensiones específicas.

---

## Ejemplo: Usar CloudinaryService en Otro Módulo

### 1. Importar CloudinaryModule

```typescript
// src/inspections/inspections.module.ts
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
})
export class InspectionsModule {}
```

### 2. Inyectar CloudinaryService

```typescript
// src/inspections/inspections.service.ts
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class InspectionsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async deleteInspectionPhoto(photoUrl: string) {
    const publicId = this.cloudinaryService.extractPublicId(photoUrl);
    if (publicId) {
      await this.cloudinaryService.deleteImage(publicId);
    }
  }
}
```

---

## Estructura de Carpetas en Cloudinary

Recomendación de organización:

```
rafiqui/
├── inspections/        # Fotos de inspecciones
├── refurbishment/      # Fotos de reacondicionamiento
├── art/                # Imágenes de piezas de arte
├── collection/         # Fotos de recolección
└── marketplace/        # Imágenes para marketplace
```

---

## Campos de Imagen en Base de Datos

Los modelos que ya tienen campos para URLs de imágenes:

### Inspection
- `photoUrl` (String?) - URL de foto de inspección

### ArtPiece
- `imageUrl` (String?) - URL de imagen de la pieza de arte

---

## Transformaciones Automáticas

Todas las imágenes subidas se transforman automáticamente:

1. **Límite de tamaño**: Máximo 1920x1080px (mantiene aspect ratio)
2. **Calidad**: Optimización automática (`auto:good`)
3. **Formato**: Conversión automática al mejor formato

---

## Seguridad

- ✅ Validación de tipo de archivo (solo imágenes)
- ✅ Validación de tamaño (máximo 10MB)
- ✅ Credenciales en variables de entorno
- ✅ URLs públicas pero no listables

---

## Testing

### Script de Prueba

```bash
#!/bin/bash

echo "Testing Cloudinary Upload..."

# Crear una imagen de prueba
convert -size 800x600 xc:blue test_image.jpg

# Subir imagen
RESPONSE=$(curl -s -X POST http://localhost:4000/upload/image \
  -F "file=@test_image.jpg" \
  -F "folder=test")

echo "$RESPONSE" | jq '.'

# Limpiar
rm test_image.jpg
```

---

## Troubleshooting

### Error: "Cloudinary credentials not configured"

**Solución**: Verifica que las variables de entorno estén correctamente configuradas en `.env`

### Error: "File too large"

**Solución**: La imagen excede 10MB. Comprime la imagen antes de subirla.

### Error: "Invalid file type"

**Solución**: Solo se permiten JPEG, PNG y WEBP. Convierte la imagen a un formato válido.

---

## Próximos Pasos

1. ✅ Integración básica completada
2. 🔄 Agregar endpoint para eliminar imágenes
3. 🔄 Implementar caché de URLs transformadas
4. 🔄 Agregar soporte para múltiples imágenes
5. 🔄 Implementar galería de imágenes por asset

---

## Referencias

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
