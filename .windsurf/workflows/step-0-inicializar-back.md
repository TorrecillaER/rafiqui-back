Actúa como un Arquitecto de Software Experto en NestJS y Prisma.
Estoy construyendo el backend para "Rafiqui", una plataforma de reciclaje de paneles solares para un Hackathon.

Por favor, realiza las siguientes tareas paso a paso. Detente si hay un error:

1.  **Inicialización:** Genera un nuevo proyecto NestJS en el directorio actual (asegúrate de que sea una instalación limpia).
2.  **Dependencias:** Instala `prisma` como dev dependency y `@prisma/client`.
3.  **Infraestructura Local:** Crea un archivo `docker-compose.yml` para levantar una base de datos PostgreSQL 15.
    * User: rafiqui
    * Pass: rafiqui_pass
    * DB Name: rafiqui_db
    * Port: 5432
4.  **Modelado de Datos:** Inicializa Prisma y modifica el archivo `schema.prisma`. Necesito EXACTAMENTE estos modelos y relaciones:

    * **Enums:**
        * `Role`: DONOR, OPERATOR, PARTNER, ADMIN
        * `AssetStatus`: PENDING_COLLECTION, IN_TRANSIT, WAREHOUSE_RECEIVED, INSPECTED, RECYCLED, REUSED
        * `InspectionResult`: REUSE, RECYCLE

    * **Model User (Usuario):**
        * `id` (UUID), `email` (único), `password`, `name`, `role` (default DONOR).
        * Relación: Un Usuario tiene muchas `CollectionRequests`.

    * **Model CollectionRequest (Solicitud de Recolección):**
        * `id` (UUID), `pickupAddress`, `estimatedCount` (Int), `status` (String default "PENDING").
        * Relación: Pertenece a un `User` (donor).
        * Relación: Tiene muchos `Assets`.

    * **Model Asset (El Panel Físico):**
        * `id` (UUID), `nfcTagId` (String opcional y único), `qrCode` (String opcional).
        * `status` (Enum AssetStatus).
        * `brand` (String opcional), `model` (String opcional).
        * Relación: Pertenece a una `CollectionRequest` (opcional).
        * Relación: Tiene una `Inspection` (1 a 1, opcional).

    * **Model Inspection (Resultados Técnicos):**
        * `id` (UUID).
        * `measuredVoltage` (Float), `measuredAmps` (Float).
        * `physicalCondition` (String).
        * `photoUrl` (String).
        * `aiRecommendation` (Enum InspectionResult).
        * Relación: Pertenece a un `Asset`.

5.  **Finalización:** Genera un script en `package.json` para levantar docker y correr las migraciones fácilmente.