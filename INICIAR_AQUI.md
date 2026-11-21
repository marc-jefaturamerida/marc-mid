# Novedades V4.1.3

Actualiza el código conservando el repositorio Git, el proyecto Supabase y los datos existentes. **No hay migración SQL nueva.** La ruta del manual en la aplicación es `/manual-usuario.html` relativa a la página. Verifica que el botón del manual abra el contenido y que las pruebas finalicen.

# Novedades de V4.1

Consulta `MANUAL_USUARIO_JEFATURA_MID_MARC_V410.md` para la nueva página Análisis del día, objetivos agrupados y datos locales. Se conserva la arquitectura de Supabase Storage y las migraciones de V4.0; **no ejecutes de nuevo migraciones** por esta actualización.

# JEFATURA MID MARC V4.1.0 — instalación sin borrar datos

## A. Publicar el nuevo código

1. Conserva copia del ZIP anterior. No borres tablas, Storage ni usuarios de Supabase.
2. Descomprime este ZIP. Sustituye los archivos del repositorio `marc-jefaturamerida/marc-mid` por **todo el contenido de la raíz**, incluyendo `.github` y `supabase`. Hazlo en un solo commit.
3. Conserva en GitHub > Settings > Secrets and variables > Actions > Variables:
   - `SUPABASE_URL` = URL pública del proyecto (`https://feysztaielfexueulqkn.supabase.co`).
   - `SUPABASE_PUBLISHABLE_KEY` = clave pública `sb_publishable_...`.
   - `APP_BASE` = `/marc-mid/`.
4. En Settings > Pages, Source: **GitHub Actions**.
5. En GitHub > Actions comprueba que terminan **Comprobar proyecto**, **Compilar interfaz** y **Deploy Pages**.

## B. Instalar la NUEVA estructura XLS en Supabase (una sola vez)

**No ejecutes de nuevo la migración antigua `20261120050000_dashboard_complete.sql`.** Ya contiene las tablas heredadas.

Opción automática: si la integración Supabase–GitHub está conectada a `main` con el directorio de trabajo `.`, verifica en la integración que se ha aplicado la migración nueva:

`supabase/migrations/20261121000000_marc_native_xls_storage.sql`

Opción manual, SOLO si todavía NO se ha aplicado: abre Supabase > SQL Editor y ejecuta **una sola vez** el contenido de ese archivo. La migración utiliza `CREATE TABLE IF NOT EXISTS` y políticas identificadas, pero no vuelvas a ejecutarla innecesariamente.

La nueva tabla es `public.marc_xls_archives` y el bucket de Storage **privado** es `marc-xls-private`. Su nombre no debe publicarse como bucket público.

## C. Mantener el resto del sistema

La API `dashboard-api` sigue siendo necesaria para objetivos/ajustes, incidencias, visitas, auditoría y solicitudes. Conserva `DASHBOARD_DATABASE_URL` y `DASHBOARD_ALLOWED_ORIGINS` en Supabase > Edge Functions > Secrets; NO los incluyas en GitHub.

No hay que volver a crear tu cuenta ni cambiar las tres variables públicas. Comprueba que `dashboard-api` está desplegada y puede consultar `/settings`.

## D. Primera prueba de V4

1. Entra en `https://marc-jefaturamerida.github.io/marc-mid/` e inicia sesión.
2. Abre **Ajustes > Archivos XLS guardados**: el archivo antiguo de `dashboard_reports` **no aparecerá**, porque V4 tiene un archivo nuevo separado. Su registro original no se ha eliminado.
3. Carga un XLS original de prueba. Deberá aparecer en la vista previa y guardarse en Supabase Storage.
4. Recarga la página y comprueba que se recupera completo y aparecen registros/cálculos.
5. Vuelve a subir el mismo XLS: debe mostrar **duplicado**, no crear otra copia.
6. En Supabase > Table Editor comprueba `marc_xls_archives`: `state=ready`, `row_count` correcto. En Storage comprueba el bucket `marc-xls-private` (privado).

## E. Diagnóstico de solo lectura

Ejecuta `DIAGNOSTICO_SUPABASE_V400_SOLO_LECTURA.sql` en SQL Editor. Solo muestra estado y cantidad de archivos, nunca modifica nada.

**No uses Reset all para intentar recuperar el XLS anterior.** La versión V4 conserva las tablas heredadas, pero esa acción en la interfaz sigue siendo una operación administrativa destructiva confirmada.


### Nuevo en V4.1.3
- Exportación adicional **Exportar captura Sheets** en JPEG.
- Disponible en barra principal, menú flotante y en **Análisis del día**.


### Identificación de publicación

Tras el éxito de GitHub Actions, comprueba `https://marc-jefaturamerida.github.io/marc-mid/version.json`. Debe indicar `4.1.3`. Si sigue mostrando otra versión, la nueva compilación todavía no está publicada.
