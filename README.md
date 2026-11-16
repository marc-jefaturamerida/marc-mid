# Jefatura Mid Marc V2.7.0

Proyecto completo de seguimiento operativo y simulación de comisiones para GitHub + Netlify. Actualizado desde la V2.6.1 con el mismo motor de cálculo.

## Componentes

- `index.html` y `src/legacy-app.js`: páginas y motor existente. **No se modificaron las reglas de comisiones.**
- `src/import-preview.js`: diagnóstico previo de XLS/CSV; `src/mobile-tables.js`: experiencia móvil; `src/settings-search.js`: búsqueda y filtro temático; `src/audit-ui.js`: papelera y auditoría; `src/jm-enhancements.js`: inicialización de mejoras.
- `src/team-registry.js`, `src/base-goals.js`: catálogo, alias, estados y objetivos por vigencia.
- `src/cloud-boot.js` y `netlify/functions/settings.js`: revisiones de sincronización y prevención de sobrescrituras.
- `netlify/functions/incidents.js`, `netlify/functions/audit.js` y migración V2.7: incidencias recuperables y auditoría.
- `MANUAL_USUARIO_JEFATURA_MID_MARC_V27.md` y `public/MANUAL_JEFATURA_MID_MARC_V27.pdf`: documentación vigente.
- `tests`: regresiones antiguas + nuevas verificaciones V2.7.

## Instalación

```bash
npm install
npm run check
npm test
npm run build
```

Publicar `dist` con Netlify. Mantener Netlify Identity y PostgreSQL, comprobar migración `20261116080000_jefatura_v27_audit_trash.sql`. **No eliminar la base de datos ni reemplazar XLS históricos.**

## Funciones y precauciones

El catálogo y las metas se guardan por cuenta como JSON estructurado en la tabla `dashboard_settings` existente (no se ha creado una tabla normalizada independiente de ejecutivos). La información histórica de cuentas anteriores se conserva. Las metas operativas no sustituyen objetivos de pago ni tarifas. Los recordatorios emergentes funcionan con la app abierta. Restaurar una incidencia la deja inactiva para evitar excluir ventas inesperadamente.

**Validación:** `npm run check` y `npm test` completados correctamente. `npm run build` y funcionamiento real de Netlify Identity/PostgreSQL no verificados aquí (instalación de dependencias agotó el tiempo disponible). Haz despliegue de prueba y consulta el manual antes de sustituir producción.
