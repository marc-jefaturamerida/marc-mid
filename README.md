# V4.1.2 · Ajustes, perfiles inactivos y manual de usuario

Esta actualización mantiene la estructura de Supabase, las políticas de Storage y las fórmulas de comisiones.

- Perfiles inactivos quedan excluidos de toda la semana operativa actual en los resultados; el histórico anterior se conserva.
- Ajustes incluye categoría **Avanzado** para portapapeles, restablecimiento y auditoría/recuperación.
- Búsqueda de ajustes en la barra superior junto a **Guardar ajustes y cerrar**, sin categoría duplicada.
- El botón Manual del proyecto abre `manual-usuario.html`, publicado desde `public/`, sin instrucciones técnicas de despliegue.
- Manual descargable en `MANUAL_USUARIO_JEFATURA_MID_MARC_V411.md`.

# Novedades de V4.1

Consulta `MANUAL_USUARIO_JEFATURA_MID_MARC_V410.md` para la nueva página Análisis del día, objetivos agrupados y datos locales. Se conserva la arquitectura de Supabase Storage y las migraciones de V4.0; **no ejecutes de nuevo migraciones** por esta actualización.

# JEFATURA MID MARC V4.1.0 — Supabase nativo para archivos XLS

**Proyecto completo para GitHub Pages + Supabase Auth, PostgreSQL y Storage privado.**

Esta edición sustituye el almacenamiento activo de XLS: las filas y encabezados se guardan como **un objeto JSON íntegro** por XLS dentro de Supabase Storage. PostgreSQL contiene únicamente el catálogo, la firma y el estado de cada carga. Los cálculos usan solo descargas íntegras validadas con SHA-256.

## Qué se conserva

El motor `calculate()` y los cálculos existentes, menús, módulos y ejecutivos, objetivos, comisiones, comparativos, exportaciones, incidencias, visitas y ajustes de la V3.0.4.4. Estas últimas funciones todavía utilizan `dashboard-api` autenticada (PostgreSQL con secreto `DASHBOARD_DATABASE_URL`), sin cambios de esquema ni de lógica.

**Netlify ya no participa en el arranque ni en la compilación de GitHub Pages.** Los archivos Netlify se mantienen únicamente como referencia histórica y para pruebas de regresión de las fórmulas; no son necesarios en producción.

## Instalación

Lee `INICIAR_AQUI.md` y `SUPABASE_DESPLIEGUE.md`. Hay una **nueva migración aditiva** que crea la tabla `marc_xls_archives` y el bucket privado `marc-xls-private`.

**No elimina `dashboard_reports` ni mueve el XLS antiguo:** el historial XLS de V4 empieza vacío para evitar mezclar registros antiguos que no se han podido reconstruir. Puedes volver a importar el XLS original desde tu equipo. Los datos anteriores siguen en la tabla heredada.

### Verificación

- `npm run check`
- `npm test` (incluye prueba V4 de Storage privado, reintentos, duplicados, RLS e integridad)
- `npm run build` (requiere instalar dependencias; GitHub Actions lo ejecuta)

La verificación final del guardado y lectura debe hacerse contra tu propio proyecto Supabase. No compartas secretos ni cadenas PostgreSQL en GitHub ni en conversaciones.


## Novedad V4.1.2

Se agregó **Exportar captura Sheets** en las 16 páginas exportables. Esta opción crea un **JPEG** con apariencia de hoja de cálculo realista usando los filtros y cálculos activos de cada página.
