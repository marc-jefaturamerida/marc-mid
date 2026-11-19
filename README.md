# Jefatura Mid Marc V3.0

Proyecto completo de seguimiento operativo y simulación de comisiones para GitHub + Netlify. Actualizado desde la V2.6.1 con el mismo motor de cálculo.

## Componentes

- `index.html` y `src/legacy-app.js`: páginas y motor existente. **No se modificaron las reglas de comisiones.**
- `src/import-preview.js`: diagnóstico previo de XLS/CSV; `src/mobile-tables.js`: experiencia móvil; `src/settings-search.js`: búsqueda y filtro temático; `src/audit-ui.js`: papelera y auditoría; `src/jm-enhancements.js`: inicialización de mejoras.
- `src/team-registry.js`, `src/base-goals.js`: catálogo, alias, estados y objetivos por vigencia.
- `src/cloud-boot.js` y `netlify/functions/settings.js`: revisiones de sincronización y prevención de sobrescrituras.
- `netlify/functions/incidents.js`, `netlify/functions/audit.js` y migración V2.7: incidencias recuperables y auditoría.
- `MANUAL_USUARIO_JEFATURA_MID_MARC_V300.md` y `public/MANUAL_JEFATURA_MID_MARC_V300.pdf`: documentación vigente.
- `netlify/functions/updates.js`, `src/updates-ui.js`, `src/update-request-rules.js` y migración V2.7.1: solicitudes por registro, filtro, historial, resolución y recordatorios lunes a miércoles.
- `tests`: regresiones antiguas + nuevas verificaciones V3.0.

## Instalación

```bash
npm install
npm run check
npm test
npm run build
```

Publicar `dist` con Netlify. Mantener Netlify Identity y PostgreSQL, comprobar migraciones `20261116080000_jefatura_v27_audit_trash.sql` y `20261116190000_jefatura_v271_record_updates.sql`. **No eliminar la base de datos ni reemplazar XLS históricos.**

## Funciones y precauciones

El catálogo y las metas se guardan por cuenta como JSON estructurado en la tabla `dashboard_settings` existente (no se ha creado una tabla normalizada independiente de ejecutivos). La información histórica de cuentas anteriores se conserva. Las metas operativas no sustituyen objetivos de pago ni tarifas. Los recordatorios emergentes funcionan con la app abierta. Restaurar una incidencia la deja inactiva para evitar excluir ventas inesperadamente.

**Validación:** `npm run check` y `npm test` completados correctamente. `npm run build` y funcionamiento real de Netlify Identity/PostgreSQL no verificados aquí (instalación de dependencias agotó el tiempo disponible). Haz despliegue de prueba y consulta el manual antes de sustituir producción.

## Actualizaciones V2.7.1

En Administración → Actualizaciones gestiona solicitudes asociadas a registros. Una cuenta mantiene una solicitud pendiente por registro; al solicitar nuevamente se agregan campos. Los cambios reales del XLS se reflejan mediante correcciones guardadas en la nube y posteriormente la solicitud queda resuelta. La tabla PostgreSQL `dashboard_update_requests` conserva fechas, comentarios, resoluciones y papelera incluso si el XLS no está activo. Los avisos se muestran en la apertura del navegador lunes, martes y miércoles si hay pendientes.

## Novedades V3.0 (Netlify)

- Dashboard de Jefatura abre por defecto y consulta semanas completas de lunes a domingo.
- Logros semanales usa exclusivamente objetivos configurados en los perfiles de módulos o Jefatura con vigencia histórica; los objetivos antiguos de la sección eliminada quedan como respaldo, sin participar en resultados.
- Un solo botón «☰ Menú» reúne filtros, configuración y exportación.
- **Descargar PDF** entrega un archivo con nombre de página, módulo/ejecutivo seleccionado y fecha/período. El navegador descarga en la carpeta configurada (normalmente Descargas) sin pedir nombre manual salvo ajustes propios del navegador.
- `src/pdf-download.js` construye PDF carta en el cliente sin agregar dependencias npm. La base permanece en PostgreSQL, no SQLite.
- No hay migraciones SQL nuevas para V3.0. Mantén las migraciones previas.

**Límite de verificación:** se completaron las pruebas automáticas y de sintaxis, pero no se pudo instalar npm ni ejecutar el build por fallo de DNS del registro. Prueba primero en un despliegue de ensayo Netlify.


### Configuración contextual de cada página (V3.0)
Desde el botón flotante **Menú → Configuración** se abre una ventana sobre la página actual, con sus formularios correspondientes. **Guardar y volver a la página** guarda los cambios pendientes y cierra la ventana sin cambiar de página. Las opciones generales siguen existiendo en Configuraciones, para administrarlas cuando se necesite. Algunos controles ya se guardan en el momento de modificarlos. Las páginas sin ajustes específicos muestran un aviso en vez de controles de otras páginas.


## Ajustes recientes V3.0 — filtros, alertas y reportes de texto

- Menú flotante de Jefatura: módulo, ejecutivo (productividad), categoría y prioridad de alertas, más restablecimiento.
- Configuración contextual de Jefatura: umbrales porcentuales por factor y meta operativa, guardado en los ajustes de la cuenta.
- Incidencias y Actualizaciones: botón Copiar reporte desde la ficha de detalle.
- Logros semanales: **Menú → Exportar → Copiar folios comisionables** en formato `Nombre del módulo` seguido de `fecha, folio`, usando los mismos criterios de validación de pago.
- Componentes nuevos: `src/report-copy.js`, `public/assets/jm-v301.css`, `tests/validate-v301.mjs` y `tests/validate-clipboard-v301.mjs`.
- Sin cambios en `netlify/functions`, SQL ni fórmulas de pago. No requiere una nueva migración.


## Reportes diarios de Jefatura (19/11/2026)

En Comparativa diaria → Menú → Exportar están **Copiar para WhatsApp** y **Copiar avance y objetivo de Jefatura**. Ambos toman los valores comisionables del histórico al corte de la fecha principal; los porcentajes usan metas base explícitas de Jefatura o metas vigentes de todos los módulos. La primera copia conserva las cifras operativas de la tabla del día, agrega el avance acumulado y no introduce comentarios automáticos. La segunda copia Ventas, Plan Dental y Plan Cero con alcance, requerido y diferencia. Consulte el manual vigente para los denominadores (Dental: ventas comisionables; Plan Cero: regulares comisionables).

La validación de visitas en Netlify acepta listas y mapas para criterios/incidencias; la tabla de datos y las migraciones PostgreSQL permanecen sin cambios. Pruebas de regresión: `npm test`.
