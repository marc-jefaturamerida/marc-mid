# INVEX V2.6.0 — Gestor de registros y filtros flotantes

Proyecto completo GitHub + Netlify. Base: V2.5.9 con nuevas funciones de **búsqueda global de folios**, **ficha de registros**, **edición múltiple**, **eliminación reversible**, **filtros secundarios flotantes** y **apartados plegables**.

Las fórmulas de comisiones, objetivos porcentuales, Alcance Global, históricos y base de incidencias se conservan. No se reescriben los archivos de origen: las correcciones se aplican sobre la lectura mediante `src/record-overrides.js` y se sincronizan en `wmSamsRecordEditsV260` por cuenta.

La versión incluye documentación completa en `MANUAL_USUARIO_INVEX_V260.md`, `public/MANUAL_INVEX_V260.pdf` y `CHANGELOG.md`. Para futuras ediciones, lee primero esas fuentes y revisa el contrato de ediciones por folio. Ejecuta `npm run check && npm test`; el build de Vite requiere instalar dependencias (`npm install`, luego `npm run build`).

**Precauciones:** las ediciones sin sesión pueden no sincronizarse, y los folios duplicados comparten corrección; el borrado es reversible y no modifica XLS almacenados. Verifica navegación móvil y sincronización en Netlify después de publicar.
