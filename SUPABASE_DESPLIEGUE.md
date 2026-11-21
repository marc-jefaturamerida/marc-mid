# Supabase V4 — configuración de producción

## Diseño

- Autenticación: **Supabase Auth** (la cuenta existente).
- Interfaz: **GitHub Pages**, sin servicios Netlify en la carga.
- Archivos XLS: **Supabase Storage privado** `marc-xls-private`.
- Catálogo e integridad: **PostgreSQL** `marc_xls_archives`, SHA-256 y restricción `UNIQUE(owner_id,fingerprint)`.
- Protección: políticas **RLS** para la tabla y `storage.objects`, asociadas a `auth.uid()`.
- Resto de funciones: `dashboard-api` con validación de sesión y conexión PostgreSQL ya configurada.

No es necesario compartir contraseñas. `sb_publishable_...` y la URL son públicas; la contraseña PostgreSQL sigue solo en Edge Functions > Secrets.

## Migración aditiva necesaria

Archivo: `supabase/migrations/20261121000000_marc_native_xls_storage.sql`.

Esta migración no contiene `DROP TABLE dashboard_reports`, `TRUNCATE dashboard_reports`, ni borra registros, usuarios o formularios. Crea un esquema separado. Si se usa la integración GitHub de Supabase y se detecta la migración aplicada, no debe ejecutarse manualmente.

Para comprobar el resultado en SQL Editor, ejecutar `DIAGNOSTICO_SUPABASE_V400_SOLO_LECTURA.sql`.

## Diferencia frente a V3.0.4.4

Antes cada XLS era un arreglo `rows jsonb` en `dashboard_reports`; la página intentaba descargar filas por lotes a través de la Edge Function. Si una de esas lecturas quedaba incompleta, bloqueaba los cálculos aunque el archivo apareciera guardado.

V4 almacena cada XLS como un solo objeto JSON verificado en Storage. Primero crea una ficha `pending`, luego sube el archivo, y solo después marca `ready`. Si falla la subida, queda `pending` y reintentar el MISMO XLS reanuda el proceso. Un reporte `pending` jamás participa en cálculos.

La consulta y las descargas no dependen de `GET /dashboard-api/files`, de `jsonb_array_elements` ni de la cadena PostgreSQL para el contenido XLS. Si falla Storage, el error identifica el archivo afectado.

## Seguridad

- Mantener `marc-xls-private` como bucket **privado**. No habilitar bucket público ni crear enlaces públicos.
- Mantener Auth y RLS activados; no cambiar políticas por `USING (true)`.
- No subir `DASHBOARD_DATABASE_URL`, contraseñas ni claves de servicio al repositorio.
- No reiniciar el proyecto Supabase ni borrar el XLS que permanece en la tabla `dashboard_reports`.
- El usuario anterior conserva acceso a los ajustes, incidencias y visitas que ya había guardado.

## Prueba de publicación

1. GitHub Actions debe pasar `npm run check`, `npm test` y `npm run build`.
2. Supabase Table Editor debe mostrar `marc_xls_archives` y Storage el bucket `marc-xls-private`.
3. Iniciar sesión, subir un XLS, confirmar `ready`, recargar, verificar filas y reportes, repetir y comprobar el rechazo del duplicado.
4. Solo después de esta prueba podrá considerarse verificado el funcionamiento real.
