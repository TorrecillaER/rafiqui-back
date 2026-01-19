# 🔐 Autenticación JWT Implementada

## Resumen de Cambios

Se ha implementado autenticación JWT en todos los endpoints críticos para **eliminar IDs mockeados** y usar automáticamente el ID del usuario autenticado desde el token JWT.

---

## ✅ Archivos Creados

### 1. JWT Auth Guard
**Archivo:** `src/auth/jwt-auth.guard.ts`
- Guard de NestJS que valida el token JWT en cada petición protegida

### 2. Decorador CurrentUser
**Archivo:** `src/auth/decorators/current-user.decorator.ts`
- Decorador personalizado que extrae automáticamente el usuario del JWT
- Retorna: `{ userId, email, role }`

---

## 🔒 Endpoints Protegidos

### Assets (Paneles)

#### POST `/assets/validate-for-inspection`
- **Antes:** Recibía `inspectorId` en el body (mockeado)
- **Ahora:** Usa automáticamente el `userId` del JWT
- **Requiere:** Bearer Token
- **Body:**
  ```json
  {
    "qrCode": "PANEL-001"
  }
  ```

### Collection Requests (Solicitudes de Recolección)

#### GET `/collection-requests?myRequests=true`
- **Antes:** Requería pasar `assignedCollectorId` manualmente
- **Ahora:** Con `myRequests=true` filtra automáticamente por el usuario autenticado
- **Requiere:** Bearer Token

#### PATCH `/collection-requests/:id`
- **Antes:** Podía asignar cualquier `assignedCollectorId`
- **Ahora:** 
  - Opción 1: Usar `assignedCollectorEmail` (recomendado)
  - Opción 2: Usar `assignToMe: true` para auto-asignarse
- **Requiere:** Bearer Token
- **Body (opción 1):**
  ```json
  {
    "assignedCollectorEmail": "collector@rafiqui.com",
    "status": "ASSIGNED"
  }
  ```
- **Body (opción 2):**
  ```json
  {
    "assignToMe": true,
    "status": "ASSIGNED"
  }
  ```

### Inspections (Inspecciones)

#### POST `/inspections`
- **Antes:** Recibía `inspectorId` en el body (mockeado)
- **Ahora:** Usa automáticamente el `userId` del JWT
- **Requiere:** Bearer Token
- **Body:**
  ```json
  {
    "assetId": "uuid-del-asset",
    "measuredVoltage": 35.5,
    "measuredAmps": 8.2,
    "physicalCondition": "Good",
    "photoUrl": "https://..."
  }
  ```

#### GET `/inspections?myInspections=true`
- **Antes:** Requería pasar `inspectorId` manualmente
- **Ahora:** Con `myInspections=true` filtra automáticamente por el usuario autenticado
- **Requiere:** Bearer Token

#### GET `/inspections/stats`
- **Antes:** Requería pasar `inspectorId` en query
- **Ahora:** Usa automáticamente el `userId` del JWT
- **Requiere:** Bearer Token

---

## 📱 Cómo Usar desde Flutter

### 1. Guardar el Token después del Login

```dart
// Login
final response = await dio.post(
  'http://192.168.100.155:4000/auth/login',
  data: {
    'email': 'inspector@rafiqui.com',
    'password': 'password123',
  },
);

// Guardar el token
final token = response.data['access_token'];
await storage.write(key: 'jwt_token', value: token);
```

### 2. Incluir el Token en Todas las Peticiones

```dart
// Configurar Dio con interceptor
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await storage.read(key: 'jwt_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  },
));
```

### 3. Ejemplos de Peticiones

#### Validar Panel para Inspección
```dart
// ANTES (incorrecto - ID mockeado)
await dio.post('/assets/validate-for-inspection', data: {
  'qrCode': scannedQr,
  'inspectorId': 'fake-id-123', // ❌ Mockeado
});

// AHORA (correcto - usa JWT automáticamente)
await dio.post('/assets/validate-for-inspection', data: {
  'qrCode': scannedQr,
  // ✅ inspectorId se obtiene del JWT automáticamente
});
```

#### Crear Inspección
```dart
// ANTES (incorrecto)
await dio.post('/inspections', data: {
  'assetId': assetId,
  'inspectorId': 'fake-id', // ❌ Mockeado
  'measuredVoltage': 35.5,
  // ...
});

// AHORA (correcto)
await dio.post('/inspections', data: {
  'assetId': assetId,
  // ✅ inspectorId se obtiene del JWT automáticamente
  'measuredVoltage': 35.5,
  // ...
});
```

#### Obtener Mis Solicitudes
```dart
// ANTES (incorrecto)
final userId = 'fake-id'; // ❌ Mockeado
await dio.get('/collection-requests?assignedCollectorId=$userId');

// AHORA (correcto)
await dio.get('/collection-requests?myRequests=true');
// ✅ Filtra automáticamente por el usuario autenticado
```

#### Auto-asignarse una Solicitud
```dart
// AHORA (nuevo feature)
await dio.patch('/collection-requests/$requestId', data: {
  'assignToMe': true,
  'status': 'ASSIGNED',
});
// ✅ Se asigna automáticamente al usuario autenticado
```

---

## 🛡️ Beneficios de Seguridad

1. **No más IDs falsos:** Imposible enviar IDs de otros usuarios
2. **Autenticación obligatoria:** Todos los endpoints críticos requieren login
3. **Trazabilidad:** Cada acción está vinculada al usuario real del JWT
4. **Menos errores:** No hay que pasar IDs manualmente (menos bugs)
5. **Mejor UX:** La app no necesita gestionar IDs de usuario manualmente

---

## 🔄 Migración de Código Existente

### En tu App Flutter

1. **Eliminar** todos los campos `inspectorId` de los bodies
2. **Eliminar** todos los campos `assignedCollectorId` de los bodies
3. **Agregar** el token JWT a todas las peticiones protegidas
4. **Usar** `myRequests=true` y `myInspections=true` para filtrar

### Ejemplo de Refactor

```dart
// ❌ ANTES
class InspectionService {
  final String inspectorId; // Eliminar esto
  
  Future<void> validatePanel(String qrCode) async {
    await dio.post('/assets/validate-for-inspection', data: {
      'qrCode': qrCode,
      'inspectorId': inspectorId, // Eliminar esto
    });
  }
}

// ✅ AHORA
class InspectionService {
  // Ya no necesita inspectorId
  
  Future<void> validatePanel(String qrCode) async {
    await dio.post('/assets/validate-for-inspection', data: {
      'qrCode': qrCode,
      // inspectorId se obtiene automáticamente del JWT
    });
  }
}
```

---

## 📝 Testing con cURL

```bash
# 1. Login y obtener token
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inspector@rafiqui.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Validar panel (con token)
curl -X POST http://localhost:4000/assets/validate-for-inspection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"qrCode":"PANEL-001"}'

# 3. Obtener mis inspecciones
curl http://localhost:4000/inspections?myInspections=true \
  -H "Authorization: Bearer $TOKEN"

# 4. Obtener mis estadísticas
curl http://localhost:4000/inspections/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ Importante

- **Todos los endpoints protegidos retornan 401 Unauthorized** si no se envía el token
- **El token expira** según la configuración de JWT (verificar `JWT_SECRET` y tiempo de expiración)
- **Swagger UI** ahora tiene un botón "Authorize" para probar con token

---

## 🎯 Próximos Pasos Recomendados

1. Actualizar la app móvil para usar JWT en todas las peticiones
2. Eliminar todos los campos de ID mockeados del código Flutter
3. Implementar refresh tokens para sesiones largas
4. Agregar roles y permisos más granulares si es necesario
