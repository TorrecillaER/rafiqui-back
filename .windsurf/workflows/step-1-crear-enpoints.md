Excelente. Ahora actúa como un Desarrollador Backend Senior. Vamos a crear los endpoints RESTful usando las mejores prácticas de NestJS (DTOs, Services, Controllers).

Genera los recursos (Resource) para los siguientes módulos. Usa `nest g resource [nombre] --no-spec`:

1.  **Módulo `collection-requests`:**
    * Endpoint `POST /collection-requests`: Para que un donante cree una solicitud. Debe recibir `donorId`, `address`, `estimatedCount`.
    * Endpoint `GET /collection-requests/:id`: Para ver el estado.

2.  **Módulo `assets`:**
    * Necesito un endpoint especial `POST /assets/scan`.
    * **Lógica de Negocio:** Este endpoint simula lo que hace el chofer. Recibe un `nfcTagId` y un `requestId`.
    * Si el asset no existe, lo crea y lo vincula al Request.
    * Si el asset ya existe, actualiza su estado a `IN_TRANSIT`.

3.  **Módulo `inspections`:**
    * Endpoint `POST /inspections`.
    * Debe recibir: `assetId`, `voltage`, `amperage`, `photoUrl`.
    * **Importante:** Al guardar la inspección, debe actualizar automáticamente el `status` del Asset relacionado a `INSPECTED`.

**Requisito Técnico:**
* Usa PrismaService para todas las consultas a base de datos.
* Crea DTOs (Data Transfer Objects) con `class-validator` para asegurar que el voltaje y amperaje sean números (`IsNumber`).