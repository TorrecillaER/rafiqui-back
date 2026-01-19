Ahora vamos a implementar la lógica inteligente del sistema.

1.  Crea un nuevo servicio llamado `TriageEngineService` dentro del módulo de `inspections`.
2.  Implementa una función llamada `evaluatePanel(voltage: number, amperage: number, physicalCondition: string): InspectionResult`.
3.  **Reglas de Negocio (Hardcoded para el MVP):**
    * Si `physicalCondition` contiene la palabra "roto" o "broken" -> Retorna `RECYCLE`.
    * Si `voltage` es menor a 15.0 -> Retorna `RECYCLE`.
    * En cualquier otro caso -> Retorna `REUSE`.

4.  **Integración:**
    * Ve al `InspectionsService` que creaste en el paso anterior.
    * En el método `create`, antes de guardar en la base de datos, llama a `TriageEngineService.evaluatePanel`.
    * Guarda el resultado en el campo `aiRecommendation` de la base de datos.
    * Si el resultado es `REUSE`, actualiza el estado del Asset a `WAREHOUSE_RECEIVED` (o crea un estado `READY_FOR_REUSE`).
    * Si es `RECYCLE`, actualiza el estado del Asset a `RECYCLED`.

Quiero que el código sea limpio y modular para que en el futuro pueda reemplazar estas reglas simples por una llamada a una API de IA real.