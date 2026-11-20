# JEFATURA MID MARC V3.0.4.2

## Para Netlify (proyecto actual)

Sustituye los archivos del repositorio conservando los ajustes actuales del sitio y la base PostgreSQL. Sin `VITE_CLOUD_PROVIDER` configurado, la interfaz utiliza las Functions y Netlify Identity originales. Mantén el despliegue anterior como copia de respaldo hasta validar la versión.

## Para Supabase + GitHub Pages

Lee `SUPABASE_DESPLIEGUE.md`. Contiene la arquitectura, migración SQL, Edge Function, secretos de servidor y despliegue automático con GitHub Actions. El código de Supabase es **una nueva vía de despliegue que necesita configuración y pruebas en un proyecto real antes de reemplazar Netlify**.

### Mejoras de la interfaz

- Comparativa diaria como página principal para instalaciones y ajustes de navegación anteriores.
- Navegación de pestañas con eventos delegados. La ventana de objetivos obligatorios explica el bloqueo de las demás secciones hasta guardar.
- Detección inicial de metas faltantes y botones de aplicación masiva de cantidades de trámites/ventas a campos pendientes, conservando las metas ya guardadas.

### Comprobaciones

`npm run check` y `npm test`. La compilación con `npm run build` requiere instalar dependencias en una máquina con acceso a npm.
