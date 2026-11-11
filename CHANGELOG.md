# Cambios V1.9.1 — Filtros sin sincronización

- Los filtros de la tabla de folios (`tableScope`, texto, pago, incidencias, APP, columna y valor) no generan ya ninguna escritura a PostgreSQL.
- Los filtros se conservan en `sessionStorage` mientras dura la pestaña, sin enviarse a otras sesiones o dispositivos.
- La opción “Mostrar folios sin código” también se aplica sólo localmente.
- La selección de columnas visibles sigue sincronizándose como una preferencia permanente.
- Se mantiene el ahorro de v1.9 (sin sondeo cada minuto; ajustes por lotes).
- Sin cambios de esquema SQL ni en las reglas de cálculo de comisiones.

# Cambios V1.9 — Ahorro de créditos

- Eliminada la revisión periódica de PostgreSQL cada 60 segundos.
- Revisión automática solamente al regresar tras 10 minutos de inactividad, con una Function `sync` que comprueba ajustes e historial en una petición.
- La acción **↻ Sincronizar** guarda ajustes pendientes y recarga directamente (sin comprobación extra previa).
- Guardado de ajustes agrupado: espera 3 segundos desde la última edición y envía varias claves en un único PUT/SQL.
- No se reescriben valores de configuración idénticos en la base de datos.
- Cola de ajustes pendientes persistida localmente, separada por ID de cuenta, con máximo dos reintentos automáticos.
- Historial remoto: entrega paginada de hasta 8 archivos XLS pequeños por solicitud, con tope de respuesta.
- Resuelta la exclusión de la clave `wmSamsTablaVisualV18` en la API de ajustes.
- Conservadas las cinco páginas, cálculos, XLS de historial y exportaciones.
- Retirado el texto fijo de explicación del reporte de Comparativa diaria, solicitado en la conversación anterior.
- Versionado visual y del paquete actualizado a 1.9.0.

No modifica las tablas existentes ni requiere un inicio de sesión nuevo. El ahorro de créditos real depende del uso y de las tarifas vigentes de Netlify.
