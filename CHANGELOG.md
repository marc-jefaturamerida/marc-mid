## V3.0.4.3 — Recuperación verificable de XLS (20/11/2026)

- Corrección de la interpretación de «0 guardados, 1 duplicado»: el archivo ya puede estar almacenado, aunque el historial no haya terminado de recuperarse.
- Descarga de XLS por metadatos + fichas + fragmentos de filas, con verificación de integridad y adaptación del tamaño de fragmento.
- Lista de archivos almacenados visible incluso mientras faltan filas; la UI distingue almacenamiento y disponibilidad para cálculos.
- Los archivos nuevos pueden guardarse mediante validación de firmas autenticadas, sin alterar archivos existentes ni permitir cálculos parciales.
- Se preservan fórmulas y reglas de comisión, vigencias, objetivos, datos existentes, Supabase Auth, control de acceso y Netlify como respaldo.
- Nueva prueba `validate-v3043.mjs`; se conservan y actualizan las verificaciones anteriores.
- No requiere migración SQL adicional; **sí requiere desplegar la Edge Function nueva**.

---

## Hotfix V3.0.4.2 — Verificación segura de metadatos XLS en Supabase
- La primera importación puede continuar si la API autentica y confirma que el historial remoto está vacío mediante `/files?meta=1`, sin depender del contenido completo de `/files`.
- Si existen archivos históricos no recuperables, se sigue impidiendo una importación que conduciría a sumatorias parciales; ahora se muestra la causa técnica original.
- Se mantienen la validación de duplicados, las fórmulas de comisiones y los datos de PostgreSQL. No hay cambios de migraciones ni de Edge Functions.

## Hotfix de XLS con sesión — 20 noviembre 2026
- Con sesión Supabase, el XLS se lee y la vista previa se presenta antes de esperar al historial remoto.
- La verificación íntegra de duplicados y el historial se mantiene obligatoria ANTES de enviar el XLS a la nube; al fallar se muestra error junto al botón Cargar XLS.
- Estados visibles junto al botón: lectura, vista previa, comprobación del historial, guardado y resultado.
- GET /files usa un tiempo máximo de 20 segundos por consulta y comunica fallos reales de Edge Functions, evitando esperas indefinidas.
- Se conserva el esquema de objetivos obligatorios, sin alterar ventas, comisiones ni migraciones PostgreSQL.

## Hotfix XLS · Selector y vista temporal (20 noviembre 2026)
- El selector «Cargar XLS» usa etiqueta HTML nativa accesible y soporte de teclado, sin depender de un click programático de un input oculto.
- Archivos cargados sin sesión se muestran en el listado como temporales; no se envían a Supabase y se pierden al recargar.
- Se notifica la selección del archivo y se muestra error de importación si falla un proceso asíncrono.
- No modifica los cálculos de comisiones ni la base de datos.

## V3.0.4.2 — Hotfix de navegación (20 de noviembre de 2026)

- Corregido error en apertura de secciones `registryActiveAt is not defined` mediante importación de función de vigencia histórica desde `team-registry.js` a `legacy-app.js`.
- Añadida prueba de regresión en `tests/validate-v3042.mjs` para evitar que se omita esta importación.
- Sin cambios en fórmulas de comisiones, reglas activo/inactivo, SQL, funciones, secretos, XLS o configuración de hosting.
- `npm run check` y `npm test` correctos. Pendiente comprobación con sesión de Supabase en GitHub Pages publicado.

## V3.0.4 — 20 de noviembre de 2026

- **Estados en Objetivos base:** casilla «Perfil activo» junto al botón Guardar para módulos y ejecutivos, conectada al catálogo de estados y al filtro de registros por fecha. No cambia el estado de los ejecutivos al desactivar el módulo ni borra XLS históricos.
- **Captura rápida obligatoria:** revisión de trámites y ventas faltantes (cero o sin configurar), en la semana actual al abrir y en las semanas de cada nuevo XLS. Diálogo con nombre, tipo, semana y dos cantidades; validación integral; guardado por vigencia sin reescribir otras metas y sincronización con la infraestructura existente.
- **Comparativo de ejecutivos:** selector de semana laboral o rango de fechas; cálculo independiente por semana, metas semanales completas en rangos parciales y suma final de comisiones; desglose semanal y CSV adaptado, PDF/PNG conforme a la selección.
- **Consolidados por semana:** exclusión de módulos dados de baja en períodos posteriores al corte, conservando semanas históricas anteriores a la baja.
- **Regresión:** prueba V3.0.4 para detección, perfiles activos, históricas, metas heredadas y controles; `calculate()` no cambió, se conservaron tablas/Functions y claves de datos.

---

## V3.0 · Cantidades de Ventas en el reporte de avance de Jefatura (19 de noviembre de 2026)

- **Comparativa diaria → Exportar → Copiar avance y objetivo de Jefatura:** en Ventas se agrega la cantidad real de ventas comisionables acumuladas junto al porcentaje de alcance, y el número mínimo de ventas requeridas al corte junto al porcentaje esperado.
- **Requeridas:** se calcula `techo(objetivo semanal de ventas × días transcurridos / 7)`; se redondea hacia arriba porque las ventas son unidades enteras. Los porcentajes mantienen precisión previa y no se alteran.
- Se conservan los bloques de Plan Dental y Plan Cero con sus porcentajes de penetración, el texto del reporte diario de WhatsApp, las fórmulas de comisiones y el almacenamiento Netlify/PostgreSQL. Sin migración SQL.
- Se añade prueba del ejemplo de 72 ventas semanales con 29 ventas comisionables acumuladas al miércoles (40.28%, requerido 42.86% = 31 ventas).

## V3.0 · Reportes de avance de Jefatura y validación de visitas (19 de noviembre de 2026)

- **Visitas de coordinación:** se mantiene la corrección previa del backend de Netlify: acepta mapas de criterios/incidencias y valida los límites de 80 criterios, 3 folios y 150 incidencias sin rechazar el formato válido.
- **Comparativa diaria → Exportar → Copiar para WhatsApp:** conserva las cifras actuales y anteriores y alinea las columnas de texto con anchuras según etiqueta y dato. Al copiar se antepone el texto fijo «Buenas noches cierre del. Día.» y se agrega debajo de Calidad el avance de ventas comisionables acumuladas de lunes a la fecha principal contra la meta semanal de Jefatura: alcance (%), esperado al día (% = días transcurridos/7 × 100) y diferencia entre porcentajes. El reporte no agrega comentario final ni usa el cociente «cumplimiento respecto al esperado».
- **Nuevo botón Comparativa diaria → Exportar → Copiar avance y objetivo de Jefatura:** copia Ventas, Plan Dental y Plan Cero con alcance, requerido al corte y diferencia. Ventas usa cantidad comisionable acumulada/objetivo semanal; Dental usa ventas con plan dental/ventas comisionables; Plan Cero usa planes cero/ventas regulares comisionables. Los dos últimos son porcentajes de penetración con objetivo semanal fijo (NO se prorratean), mientras que Ventas se compara con el avance de la semana de lunes a domingo.
- **Datos históricos y metas:** se utilizan los registros deduplicados del historial disponible y los objetivos explícitamente capturados en Jefatura o consolidados desde todos los módulos con metas configuradas para la semana correspondiente. Si no existe una meta vigente, se muestra un guion (—) o aviso, sin inventar objetivos; no se cambian comisiones, validaciones de pago ni la estructura PostgreSQL.
- **Pruebas:** nueva verificación de formatos y cálculo de reportes; se conserva la verificación de límites de visitas.

## Corrección parcial de validación de visitas y alineación de WhatsApp (19 de noviembre de 2026)

- Netlify /api/visits: acepta el formato real de los criterios e incidencias (objetos por identificador), conservando compatibilidad con listas anteriores. Valida máximo 80 criterios, 3 folios y 150 incidencias, con errores particulares por límite.
- Comparativa diaria: alinea los indicadores dentro del bloque monoespaciado de WhatsApp, con anchuras calculadas según etiqueta y cifras; no cambia métricas.
- **Pendiente de confirmar**: texto del saludo/cierre y definición del progreso contra objetivo de Jefatura; aún no se incorporan esos cambios en esta revisión parcial.

## V3.0 · Ajuste de filtros, alertas y portapapeles (17 de noviembre de 2026)

- **Dashboard de Jefatura:** Menú → Filtros incorpora módulo (afecta consolidado y objetivos del módulo), ejecutivo (acota exclusivamente la tabla de productividad, sin falsear las metas consolidadas), prioridad y categoría de alerta. Se añadió «Restablecer filtros». Se mantiene la semana completa de lunes a domingo.
- **Alertas de Jefatura:** Menú → Configuración permite modificar el mínimo porcentual independiente de Cumplimiento, Primera compra, Programa Cero, Activación APP y de los cinco indicadores de metas operativas (Trámites, Plan Dental, Programa Cero, APP y Primera compra). Conversión y proyección mantienen sus umbrales propios existentes. Alertas por objetivos se pueden activar/desactivar desde esa misma ventana. En ausencia de nuevas preferencias se recuperan los porcentajes históricos como valores de partida; no se modifican las tarifas ni los cálculos.
- **Incidencias:** la ficha de detalle incorpora «Copiar reporte» con folio, módulo, ejecutivo, estados, fechas e historial de comentarios.
- **Actualizaciones:** la ficha de detalle incorpora «Copiar reporte» con folio, datos, campos solicitados, comentarios, estado, fechas y valores aplicados cuando existan. Compatible con valores JSON en distintas representaciones.
- **Logros semanales:** Menú → Exportar agrega «Copiar folios comisionables». Copia exclusivamente los folios de los registros visibles por los filtros actuales que satisfacen la función de pago `payable()` de la aplicación. Agrupa por módulo con líneas «DD/MM/AAAA, folio» y elimina duplicados idénticos por módulo/fecha/folio. No modifica las validaciones originales de pago.
- **Compatibilidad:** implementación sobre el proyecto GitHub/Netlify V3.0, conserva PostgreSQL, XLS históricos y fórmulas. Sin migraciones SQL nuevas.
- **Pruebas:** tests de formatos y umbrales y suite anterior; revisar en Netlify las copias con permiso de portapapeles y la vista móvil del menú flotante.

## V3.0 — Ajustes contextuales por página (17 de noviembre de 2026)

- **Configuración** del menú flotante abre una ventana sobre la página activa; ya no navega a Configuraciones generales.
- Cada ventana incorpora los formularios existentes aplicables a esa página (Jefatura, Logros semanales, calculadoras, históricos, visitas y reportes) sin duplicar IDs, preferencias ni fórmulas.
- **Guardar y volver a la página** utiliza las validaciones y guardados originales, cierra la ventana y conserva la página seleccionada. Los botones de guardar propios también cierran después de guardar con éxito; ante validación fallida se mantiene abierta.
- Accesos directos «Configurar dashboard», «Configurar análisis» e «Histórico por módulo» usan la misma ventana contextual.
- En el editor de textos del informe se selecciona automáticamente la página de origen y se ocultan los controles para editar los textos de otras páginas.
- Para Actualizaciones y Recordatorios, que no cuentan con ajustes exclusivos independientes de sus filtros y fichas, la ventana informa esa condición sin mostrar secciones ajenas.
- Ventana adaptada a móviles y restauración del foco al cerrarla. No requiere migración SQL y no altera las reglas de comisión ni los datos históricos.

# Jefatura Mid Marc — CHANGELOG

## V3.0 · 17 de noviembre de 2026 · GitHub y Netlify

**Base:** Jefatura Mid Marc V2.7.1 corregida de navegación (edición Netlify); NO derivada de la edición Wi-Fi/SQLite.

- **Portada:** Dashboard de Jefatura es ahora la página inicial para configuraciones antiguas; se conserva la posibilidad de escoger y guardar otra principal en la sección 21. Migración de preferencias `layoutVersion: 3`, sin borrar historiales.
- **Filtro de Jefatura:** selector exclusivo de semana laboral completa de lunes a domingo; conserva inclusión de supervisores; eliminado el selector de período Hoy/Mes/Rango de la vista.
- **Logros semanales:** retirada la sección visible de captura manual «Objetivos semanales: cantidades y porcentajes». Los objetivos se resuelven desde los perfiles base de módulo o Jefatura con vigencia, sin recurrir a metas antiguas ni a valores por defecto no configurados; los valores manuales históricos se retienen en la clave original como respaldo.
- **Menú unificado:** único botón flotante «☰ Menú» por página con Filtros, Configuración y Exportar. Se conserva el alcance de los filtros secundarios; se elimina el segundo botón flotante.
- **Exportación PDF:** generación y descarga directa de documento PDF con nombre automático (título de página, filtro módulo/ejecutivo si aplica, fecha/semana de consulta), mediante generación cliente de páginas carta. El navegador decide carpeta de descargas; no se guarda en Netlify. `src/pdf-download.js` incorpora generador PDF sin nueva dependencia npm. Se preservan PNG y CSV.
- **Compatibilidad:** no se cambian los motores de tarifas, bonos, calidad o comisión. Datos XLS, incidencias, visitas, solicitudes y ajustes permanecen en Netlify PostgreSQL/Identity. No se añaden migraciones SQL.
- **Documentación:** manual V3.0 y archivo INICIAR_AQUI actualizados; manuales anteriores retirados del paquete.
- **Verificación:** `npm run check` y `npm test` superados, incluida batería V3.0 y prueba de PDF binario. `npm install`/`npm run build` no verificados porque el registro npm no estuvo accesible; navegador automatizado bloqueado para servidor local.

---

# CHANGELOG — Jefatura Mid Marc

## V2.7.1 — 16 de noviembre de 2026

- **Corrección de navegación:** «Actualizaciones» ya no muestra los cuatro apartados de la Calculadora Individual («Resumen global», «Escenarios base y simulación», «Tarifario y reglas aplicadas» y «Desglose comparativo de comisiones»). Se aísla su contenedor y los filtros rápidos tanto por CSS como por navegación JavaScript. Se añade prueba de regresión; no se cambia la lógica de comisiones ni de las solicitudes.

- Administración: nueva página **Actualizaciones** con filtros superiores por folio, módulo, ejecutivo, estado, fecha desde/hasta y búsqueda general.
- Ficha de registros: botón **Solicitar actualización** y estado calculado **Pendiente de actualizar**.
- Solicitudes por cuenta en PostgreSQL, con una pendiente por registro, selección de columnas originales, comentarios acumulables y fecha de alta permanente.
- Modal de detalles con acciones de editar, enviar a papelera, restaurar y **Ya se actualizó**.
- Resolución con captura de valores definitivos y guardado como corrección no destructiva del registro antes de cambiar el estado a resuelta; el XLS original no se reescribe.
- Recordatorio emergente en cada apertura de la aplicación los lunes, martes y miércoles cuando existan pendientes; no se envían notificaciones externas.
- `netlify/functions/updates.js`, `src/updates-ui.js`, `src/update-request-rules.js`, `src/record-overrides.js` y migración `20261116190000_jefatura_v271_record_updates.sql`; sin cambios deliberados en los motores de comisiones.
- Batería automatizada de regresión y prueba propia `tests/validate-v271.mjs`; sintaxis y pruebas completadas. **Build y pruebas reales con Netlify Database pendientes de validar en despliegue.**

---

## V2.7.0 — 16 de noviembre de 2026

- Nombre visible, metadatos y documentación actualizados a **Jefatura Mid Marc**. Sin cambios en el motor de comisiones ni sus escalones.
- Catálogo más robusto con identificadores estables, alias, vigencia de metas semanales y estados activos con fechas históricas. Los objetivos base y las metas del catálogo se resuelven sin eliminar excepciones semanales.
- Vista previa de cada XLS/CSV: diagnóstico de filas, muestra, duplicados, fechas faltantes, folios y códigos ausentes, previo a la carga.
- Tabla adaptable a celular en páginas comparativas e históricos; ajustes filtrables por buscador y categorías.
- Calculadora individual con tres simulaciones comparables y aclaración del origen editable del objetivo. Se reutiliza `calculate()` original.
- Resumen de alertas por prioridad en Dashboard de Jefatura.
- Papelera de incidencias, restauración inactiva, eventos de auditoría e historial en Ajustes; migración `20261116080000_jefatura_v27_audit_trash.sql`.
- Sincronización de ajustes con revisión optimista en API; impide sobrescrituras silenciosas por otros dispositivos y conserva una cola local para resolver conflictos.
- Archivo de respaldo JSON actualizado a 2.7, compatible con el formato de claves anterior.
- Nuevas pruebas `tests/validate-v270.mjs`.

**Compatibilidad:** claves de configuración, archivos XLS, identificadores históricos de folio y fórmulas de comisiones preservados. La auditoría comienza a registrar desde V2.7; no fabrica un historial anterior. No se convierte un XLS ni se cambian sus filas en la importación.

**Límites comprobados:** todas las pruebas automáticas pasan. No se pudo verificar `npm run build` por instalación de dependencias incompleta. Sin pruebas reales de Netlify en este entorno.

---

# INVEX V2.6.1 — Ajuste de tarjetas de Jefatura (16 de noviembre de 2026)

- **Objetivos operativos y su origen:** tarjetas compactadas aproximadamente a una cuarta parte de su superficie anterior en escritorio, con cuadrícula adaptativa de ~215 px de ancho, menor espaciado y una sola columna de valores por indicador.
- Se mantienen visibles los nombres de los indicadores, sus objetivos, resultados y avances. El origen se muestra de forma abreviada y se despliega al tocarlo. En móvil las tarjetas siguen usando una columna legible.
- **Sin cambios** en cálculos, porcentajes, registros, catálogo ni persistencia. Es un ajuste de presentación sobre V2.6.1.

---

# INVEX V2.6.1 — Catálogo, incidencias móviles, recordatorios y configuración

**Fecha:** 16 de noviembre de 2026. **Base:** V2.6.0 completa. **Compatibilidad:** se preservan las fórmulas de cálculo de comisión, calidad y Alcance Global, y el contrato de correcciones lógicas por folio `wmSamsRecordEditsV260`.

## Cambios funcionales

- **Gestión central de módulos y ejecutivos:** catálogo administrable con nombre, módulo vinculado, meta semanal opcional y estado activo/inactivo. Estado prospectivo por día de cambio; se conservan los registros anteriores a la fecha de baja en históricos. Se filtra el conjunto de datos antes de alimentar reportes, sin modificar los XLS. Los selectores de edición admiten elementos activos y muestran el valor histórico sin convertirlo en opción nueva.
- **Calculadoras:** metas específicas existentes siguen teniendo prioridad; las metas del catálogo sirven de respaldo predeterminado y son editables. No se modifican escalones, factores, umbrales, bonos ni fórmulas.
- **Incidencias:** listado adaptable a tarjetas móviles, vista completa al pulsar una fila, botones Editar y Eliminar, formulario de altas inicialmente recogido. Eliminar requiere confirmación y borra definitivamente el folio en la base de incidencias del usuario. La eliminación lógica de registros de venta permanece distinta.
- **Jefatura:** en Objetivos operativos y su origen, tarjetas plegables por módulo con indicadores, objetivos, resultado, cumplimiento y procedencia.
- **Navegación (sección 21):** alta de secciones personalizadas, edición de títulos de secciones y páginas, reordenación y asignación de páginas, y eliminación de secciones vacías. No crea páginas funcionales nuevas. Se conserva la sección de configuración.
- **Ajustes:** cuatro grupos temáticos y revisión de controles aparentemente duplicados. Se mantienen separados los que operan sobre objetos o cálculos distintos. Guardados explícitos de los editores actualizados cierran el panel, mientras errores de validación conservan el formulario.
- **Recordatorios en la app:** página de administración y ventanas emergentes con horario local, repeticiones, activar/desactivar, posponer y confirmación. Solo funcionan con la aplicación abierta, sin push externo.
- **Respaldos de configuración:** JSON con lista blanca de claves; exportación local e importación bajo sesión con confirmación, sincronización y recarga; excluye archivos XLS, incidencias de la base y credenciales.

## Persistencia, archivos y pruebas

- Nuevas claves `wmSamsTeamRegistryV261` y `wmSamsRemindersV261` en PostgreSQL `dashboard_settings` por cuenta, usando la estructura existente, sin crear migración SQL relacional adicional.
- Nuevo endpoint DELETE autenticado en `netlify/functions/incidents.js`.
- Nuevos módulos `src/team-registry.js`, `src/reminders.js`, `src/settings-transfer.js` y prueba `tests/validate-v261.mjs`.
- Manual vigente: `MANUAL_USUARIO_INVEX_V261.md` y `public/MANUAL_INVEX_V261.pdf`. Los manuales históricos no se empaquetan; el historial técnico anterior permanece en este CHANGELOG.
- Verificaciones locales: `npm run check` y `npm test`. Compilación Netlify y flujo real de PostgreSQL/Identity requieren prueba en entorno desplegado.

---

# INVEX V2.6.0 — Menús de filtros, gestión de registros y edición múltiple

**Base:** V2.5.9 completa. No se cambian las fórmulas de comisión, calidad, proyecciones, vigencias de objetivos ni la estructura PostgreSQL.

## Cambios de interfaz

- Barra superior: buscador universal de folios junto a **Cargar XLS**; se retira el botón Ajustes de la cabecera (la categoría Configuración sigue disponible).
- Menú flotante **Filtros** independiente del menú Exportar. Los selectores de fecha, módulo y ejecutivo siguen visibles; se trasladan controles secundarios originales a un panel por página, conservando sus eventos y filtros aplicados.
- Apartados plegables en tablas, históricos, comparativos, incidencias y visitas, sin alterar las secciones `details` que ya podían contraerse.
- Jefatura → «Objetivos operativos y su origen»: tabla de seis columnas (Módulo, Indicador, Objetivo, Alcance logrado, % cumplimiento, Origen del objetivo).
- Comparativa diaria → WhatsApp: seis factores con dos espacios entre cada valor dentro del bloque monoespaciado; Calidad en párrafo aparte fuera de ese bloque.

## Nueva gestión de registros

- Clic/tap en fila de ventas → ficha con **Editar**, **Copiar datos visibles**, **Eliminar** reversible y **Crear/ir a Gestión de incidencia**.
- Selección múltiple con casillas en Registros manuales, registros de Calculadora individual y Logros semanales; barra flotante para edición masiva de un campo a la vez, máximo 500 registros.
- Correcciones **no destructivas** por folio (`recordEditKey`); en registros sin folio, por huella UID. El XLS original no se altera y las correcciones reaparecen cuando vuelve a cargarse el folio.
- Nueva clave de Ajustes `wmSamsRecordEditsV260`, sincronizada por `src/cloud-boot.js` y autorizada por `netlify/functions/settings.js`. Sin migración SQL.
- Los registros ocultados se excluyen de cálculos y reportes. Restaurar es posible en la ficha o en el buscador global.
- Casillas originales de APP, incidencia permanente y dinámica siguen funcionando.

## Archivos clave y contrato técnico

- `src/legacy-app.js`: `FILTER_MOVES`, `initFloatingFilters`, `initGlobalCollapses`, `initRecordManagement`, `recordEditKey`, `refreshAfterRecordChange`; se deben mantener referencias originales de los elementos de filtro, sin clonar controles.
- `src/record-overrides.js`: módulo puro y mapa de campos que admite edición. `overlayRecord` se aplica al combinar los datos originales, después de deduplicar.
- `src/daily-whatsapp-report.js`: separación exacta de dos espacios y Calidad fuera del monoespaciado.
- `index.html`: menús, overlays, tabla de objetivos y CSS de controles nuevos.
- `src/cloud-boot.js` / `netlify/functions/settings.js`: incluir exactamente la clave `wmSamsRecordEditsV260`.
- `tests/validate-v260.mjs`: cobertura nueva. Ejecutar `npm run check && npm test`.
- `MANUAL_USUARIO_INVEX_V260.md` / `public/MANUAL_INVEX_V260.pdf`: guía completa y pruebas de aceptación.

## Riesgos y límites

- La identidad de edición por folio presupone unicidad de folios. Folios duplicados comparten corrección.
- Las correcciones no reescriben archivos; el borrado es lógico. Con datos sin folio o con cambios radicales de origen, la huella puede diferir después de reimportar.
- La clave de ajustes remotos admite como máximo el tamaño permitido por Netlify; para uso masivo a escala puede necesitarse tabla SQL dedicada más adelante.
- La validación actual ejecutó las pruebas de fórmula y sintaxis; navegación en Chromium, sincronización real entre dispositivos y compilación en Netlify deben comprobarse tras publicar.

---

# INVEX V2.5.9 — Objetivos porcentuales y tarjetas compactas

**Base:** V2.5.8. Se conserva el proyecto Netlify/GitHub y las fórmulas de comisiones.

- Objetivos base: solo **Trámites** (`records`) y **Ventas totales** (`sales`) son cantidades semanales enteras. **Regulares, Garantizadas, Dental, P0, APP, Primera compra y Calidad Total** son porcentajes en `[0,100]` con precisión decimal.
- Predeterminados: Regulares 100%, Garantizadas 100%, Dental 90%, P0 30%, APP 90%, Primera compra 90%, Calidad Total 90%. Trámites y Ventas no tienen meta predeterminada en cantidad. P0 siempre se mide sobre ventas regulares; el resto de porcentajes de productos se mide sobre ventas válidas.
- **Importante:** Regulares y Garantizadas son categorías excluyentes. Por defecto ambas tienen objetivo 100% por solicitud; no son simultáneamente alcanzables salvo casos de cero o denominadores distintos. Son editables por perfil.
- Consolidación de Jefatura: suma de cantidades; porcentajes ponderados por los objetivos de ventas de los módulos; si faltan ponderaciones y las tasas son distintas se informa meta incompleta. Un objetivo manual de Jefatura conserva prioridad.
- Dashboard de Jefatura: tabla de objetivos muestra unidades correctas y % de logro por tasa. Se incluye Calidad Total. El cálculo operativo de calidad utiliza metas porcentuales vigentes de Primera compra, P0 y APP. Los históricos por período toman esas tasas y conservan las vigencias. Las comisiones NO se modifican.
- **Migración sin ambigüedad:** esquema de `wmSamsBaseGoalsV258` pasa de `version:1` a `version:2` en `src/base-goals.js`, preservando únicamente metas antiguas de Trámites y Ventas. Las cantidades antiguas de complementos no se interpretan como porcentajes. Se conserva la clave de sincronización; no requiere migración SQL.
- UI: editor de perfiles con unidad y límite adecuado; editor antiguo de Jefatura reducido a Trámites y Ventas; 9 KPI del Resumen general en 2 filas de 5/4 columnas, con desplazamiento horizontal en móvil.
- Manual: `MANUAL_USUARIO_INVEX_V259.md`, `public/MANUAL_INVEX_V259.pdf`. Validaciones añadidas en `tests/validate-v259.mjs`.

---

# INVEX V2.5.8 — Objetivos base persistentes y optimización

**Base:** proyecto completo V2.5.7. **Fecha:** 15 de noviembre de 2026. Se respetan todas las páginas y reglas de cálculo de comisiones anteriores.

## Arquitectura nueva

- **Objetivos base:** nueva sección de Ajustes con botones separados para Jefatura, módulos y ejecutivos. Perfiles dinámicos detectados desde los registros o guardados previamente, con creación manual de módulos/ejecutivos. Sin lista fija de módulos.
- **Ocho metas en cantidades por perfil:** Ventas, Registros, Regulares, Garantizadas, Dental, P0, APP y Primera Compra. Cada versión comienza en un lunes ISO. Los datos anteriores permanecen consultables y el mismo lunes puede editarse sin modificar otras vigencias.
- **Jefatura:** suma automáticamente los objetivos vigentes de todos los módulos conocidos; una meta propia de Jefatura sustituye la suma únicamente para el indicador afectado. No se muestra un consolidado parcial si un módulo carece de objetivo.
- **Fuente de objetivos en análisis:** Objetivos base tiene prioridad en Dashboard de Jefatura, Históricos y análisis semanales/diarios. Se mantienen ajustes previos y metas manuales de períodos como respaldo/excepción. Los objetivos de calidad siguen siendo porcentajes requeridos independientes.
- **Comisiones sin cambios:** `teamGoals`, objetivos de Supervisor, tarifas y bonos siguen operando independientemente; Objetivos base NO alimenta los motores de pago.
- **Accesos rápidos:** nombres clicables de módulos y colaboradores en tablas de análisis y botones junto a filtros históricos. Editor en modal con fecha de inicio.
- **Persistencia:** `wmSamsBaseGoalsV258` en `dashboard_settings` existente y respaldo en localStorage; se añade a lista permitida en `netlify/functions/settings.js` y `src/cloud-boot.js`. No se requiere migración SQL, los perfiles sobreviven a la eliminación de XLS.
- **Rendimiento:** caché de archivos normalizados por identidad de referencias, caché de metas dentro de consultas, agrupación de Jefatura en una sola pasada, repintado de páginas activas; sin eliminar datos ni gráficos.

## Contratos y archivos para futuras modificaciones

- Motor puro `src/base-goals.js`: `cleanBaseGoals`, `upsertBaseGoals`, `effectiveBaseGoal`, `headquartersGoal`, `knownBaseProfiles`, `mondayISO`. Claves `module|NORMALIZADO`, `executive|NORMALIZADO`, `headquarters|JEFATURA`; `versions` por lunes con `goals` de ocho métricas.
- UI/consumidores `src/legacy-app.js`; consolidación `src/leadership-dashboard.js` con `headquartersGoal` inyectado (firma `(week,module,metric)`). Registros históricos `src/individual-history.js` y `src/module-history.js` usan un callback `weeklyGoal` inyectado por el controlador.
- Manifiestos de sincronización: `src/cloud-boot.js` y `netlify/functions/settings.js`, ambos incluyen `wmSamsBaseGoalsV258`.
- Manual `MANUAL_USUARIO_INVEX_V258.md` y `public/MANUAL_INVEX_V258.pdf`. Paquete `package.json` versión `2.5.8`.
- Tests: todas las versiones de `tests/validate-v250.mjs` a `tests/validate-v258.mjs`, sin migración PostgreSQL.

## Validación y pendientes

`npm run check` y `npm test` pasaron, incluidos escenarios de cambios históricos, consolidado incompleto, sustitución manual de Jefatura y lista dinámica de cuatro módulos. **Pendiente verificar** compilación de producción con dependencias, navegación visual en móvil y sincronización real de Netlify. Ver manual §§ 19–21 para procedimientos y datos técnicos.

---

# INVEX V2.5.7 — Objetivos de Jefatura, proyecciones y manual

**Base:** proyecto completo V2.5.6. No se modifican las fórmulas de comisiones ni la base de incidencias.

## Cambios V2.5.7

- **Jefatura → objetivos y procedencia:** nueva tabla con ocho indicadores por módulo: Ventas, Registros, Regulares, Garantizadas, Dental, P0, APP y Primera Compra. Muestra meta, realizado, porcentaje de logro y origen.
- **Ajustes → Objetivos y proyecciones de Jefatura:** metas base por módulo y excepciones por semana (lunes a domingo); tienen prioridad sobre las metas heredadas. Puedes optar por heredar objetivos existentes o exigir metas explícitas de Jefatura. Las metas adicionales son cantidades operativas de seguimiento, no cambian las comisiones.
- **Proyección configurable:** lineal (siete días de igual peso) o ponderada con pesos editables de lunes a domingo. Utiliza únicamente ventas de fechas hasta el día de consulta; sigue siendo una estimación y no considera jornadas trabajadas.
- **Control de alertas:** mínimo de calidad, alertas opcionales por objetivos operativos y umbral de avance, además de conversión, antigüedad de datos y proyección ya existentes.
- **Secciones plegables:** Resumen general, Módulos, Objetivos, Personal, Calidad, Tendencia, Proyección, Alertas y Gestión, con botones de abrir/cerrar individual, expandir todas y contraer todas. Se guarda la preferencia por cuenta.
- **Manual de usuario:** `MANUAL_USUARIO_INVEX_V257.md` (editable) y `public/MANUAL_INVEX_V257.pdf` (PDF carta de nueve páginas); acceso directo **Manual del proyecto** desde la barra superior.
- **Exportación Jefatura:** agrega una tabla de objetivos y sus fuentes; permite incluirla/ocultarla desde Ajustes → Dashboard de Jefatura. El PDF/PNG conserva la paginación existente.

## Objetivos y proyección, en breve

1. Objetivo **semanal explícito** de Jefatura para el módulo y semana.
2. Objetivo **base de Jefatura** del módulo.
3. Si la herencia está habilitada: Logros semanales → Calidad del módulo → Supervisor → suma de metas individuales detectadas.
4. Si falta una meta necesaria, se muestra `—`; las cifras observadas siguen visibles.

`Lineal = ventas válidas acumuladas hasta hoy / días naturales transcurridos × 7`

`Ponderada = ventas acumuladas hasta hoy × (suma de pesos de los siete días / suma de pesos transcurridos)`

`Proyección % = ventas proyectadas / objetivo semanal × 100`

Todas las metas operativas son cantidades semanales. El avance de días/meses se prorratea sobre siete días naturales por semana. La calidad sigue usando los porcentajes requeridos del Ajuste de calidad preexistente.

## Publicación

Extrae **todo** el ZIP en la raíz del repositorio. Ejecuta `npm run check`, `npm test`, `npm install` y `npm run build` en un entorno con acceso a dependencias, y publica con Git. El manual PDF se ubica en `public/` y Vite lo expone como `/MANUAL_INVEX_V257.pdf`.

No se requiere nueva migración PostgreSQL: se reutiliza la clave existente `wmSamsLeadershipV256` de ajustes por cuenta. Verifica la sesión, la procedencia de metas, un override semanal, el colapsado y PDF/PNG en la aplicación publicada.

**Validación local:** `npm run check` y `npm test` pasaron; el navegador local está bloqueado por el entorno de ejecución, así que la prueba completa de la interfaz y el build de producción en Netlify requieren verificación en la cuenta publicada.

---

## V2.5.6 · 15 de noviembre de 2026 · Dashboard de Jefatura

- Nueva página de jefatura en Análisis y resultados, con filtros de período y ventas de supervisores.
- KPI operativos, consolidado con objetivos por módulo y calidades recalculadas sin promediar porcentajes.
- Productividad, tendencia, proyección semanal de ritmo lineal, alertas configurables y compromisos.
- Configuración y compromisos sincronizables por cuenta mediante `wmSamsLeadershipV256` en Netlify Settings, sin migración SQL.
- Exportaciones PDF tamaño Carta y PNG paginado desde el menú flotante; sin CSV.
- Migración del inicio predeterminado a Dashboard de Jefatura para usuarios con navegación heredada por defecto.
- Pruebas adicionales para metas ausentes, folios incidentados, calidad al 60%, módulo y consolidado, proyecciones y persistencia.

## 2.5.5 · Fecha por archivo y redacción de exportaciones
- Solicitud de fecha obligatoria y cancelable para cada archivo nuevo antes de almacenarlo; nombre AAAA-MM-DD en la cuenta y la lista.
- Netlify acepta fechas como nombre visible y los nombres con extensión de versiones anteriores.
- Las exportaciones PDF/PNG limpian los términos XLS/XLSX de los textos, incluidas preferencias históricas existentes.
- Sin migración SQL, sin modificaciones en los registros ni en las incidencias.

## V2.5.4 — Histórico consolidado por módulo (15 de noviembre de 2026)

- Página nueva **Histórico por módulo**, agrupada en Análisis y resultados, sin alterar Histórico individual.
- Nueve indicadores operativos, promedios de días homólogos y promedios semanales/mensuales solo con registros; calidad y alcance global recalculados.
- Filtros de módulo, fecha y tipo de período, con inclusión/exclusión de registros de supervisor.
- Objetivos automáticos por semana con prioridad Logros semanales → calidad módulo → supervisor → suma de ejecutivos. Objetivos diarios/mensuales prorrateados y metas manuales por período.
- Exportación PDF Carta y PNG paginados con mismos controles del histórico individual, títulos propios y opción de mostrar ejecutivos.
- Ajustes independientes de módulo con persistencia por cuenta (`wmSamsHistoricalModuleV254`) permitida en Functions.
- Navegación agrupada y orden editable; predeterminada Comparativa diaria.
- Tests de regresión y pruebas V2.5.4 completadas; compilación de Netlify sin validar en este entorno.

## V2.5.3 — Histórico individual y agrupación de páginas (15 de noviembre de 2026)

- Nueva pantalla de análisis histórico de colaboradores para los nueve indicadores confirmados. Historial íntegro entre módulos, filtros por fechas/módulo, vista diaria/semanal/mensual y gráfica configurable.
- Promedios del mismo día de la semana (ej. todos los domingos), semanales y mensuales calculados solo entre períodos con registros; recálculo de calidad y alcance global usando numeradores y objetivos agregados, sin promediar porcentajes.
- Objetivos prorrateados por día/mes desde metas semanales, con cambios de meta en semanas intermedias; objetivos manuales por colaborador y período, editables en las filas del histórico. Persistencia mediante ajustes de cuenta, sin alterar XLS.
- Exportación de Histórico individual en PDF (Carta, vertical/horizontal) y PNG con paginación que no omite períodos y configuración visual de título, colores, métricas, promedios y gráfico.
- Cuatro botones de categorías en navegación: Análisis y resultados, Comisiones, Administración y Configuración; dentro de cada una, una sola línea de pestañas deslizable. Ajustes conserva orden individual y añade cambios de categoría y orden entre categorías. La página principal predeterminada continúa siendo Comparativa diaria.
- Nuevo almacenamiento sincronizable `wmSamsHistoricalIndividualV253` permitido por Netlify Settings; sin migración SQL. Tests de regresión y V2.5.3 superados. La compilación Vite queda por validar en un ambiente con conexión a NPM.

## V2.5.2 — Seguimiento administrativo semanal en Logros semanales (13 de noviembre de 2026)

- Rehecha la integración desde V2.5.0; restauradas y preservadas las exportaciones existentes de Calculadora supervisor. Nuevo informe exclusivamente para PDF/PNG de **Logros semanales**.
- Plantilla carta vertical de 612×792 puntos con logotipos INVEX/MARC, firma de visitas, datos de la selección, indicadores, dos tablas dinámicas por un máximo de 50 folios por hoja, oportunidades y áreas manuscritas ajustables. No se escribe nada después de las firmas.
- El modelo toma las metas, filtros e incidencias de Logros semanales sin inventar datos ausentes. A los folios con incidencia se les conserva la marca de revisión, aunque se excluyan del cálculo de objetivos.
- Ajustes → 15 para textos, etiquetas, personas, color, visibilidad y espacio de escritura. Persistencia local y Netlify Settings permitida mediante la nueva clave `wmSamsWeeklyAdminReportV252`.
- Navegación dentro de Ajustes mediante botones por sección. Se mantienen todas las funciones de V2.5.0; tests de regresión y nuevo generador aprobados, sin cambio SQL.

## V2.5.0 — Incidencias permanentes, navegación y recordatorio XLS (13 de noviembre de 2026)

- Nueva tabla `dashboard_incidents` segregada por cuenta en PostgreSQL, sin dependencia de `dashboard_reports`.
- Nueva Function `incidents` con listado y escritura autenticados, validación de folio y comentarios históricos append-only.
- Página «Gestión de incidencias» con alta y edición, comentarios, activa/inactiva, resuelta/pendiente, filtros y exportación CSV; exportación general PDF/PNG integrada.
- Casillas en tablas vinculadas a folio estable. Importaciones futuras heredan estados; se intenta migrar las marcas de XLS anteriores cuando sus folios siguen disponibles.
- Popup los lunes una vez al día por navegador/cuenta, con acceso directo a subir XLS.
- Navegación de pestañas en una línea horizontal desplazable, orden y página principal configurables por cuenta (comparativa diaria por defecto).
- Exportaciones trasladadas a menú flotante; copiar WhatsApp se incluye ahí solamente para Comparativa diaria.
- Se preservan motor de comisiones, cálculo de supervisor, bono por dinámica, exportaciones y sesión recordada hasta 7 días.

## V2.4.9 — Sesión persistente y plazo de siete días (13 de noviembre de 2026)

- El Dashboard vuelve a consultar el estado de Identity al abrir y renueva el JWT de acceso si está próximo a expirar, utilizando su cookie de renovación, sin almacenar credenciales de usuario.
- Las Functions verifican y renuevan la sesión antes de autorizar el acceso a PostgreSQL. No se quita ninguna comprobación de identidad ni separación por cuenta.
- Política local de máximo siete días por usuario y navegador desde el último inicio de sesión con credenciales (no se reinicia al recargar). Cierre de sesión manual y vencimiento eliminan esa marca. El backend de Identity puede expirar/revocar antes.
- Los ajustes pendientes conservan su cola local vinculada al usuario; no se transfieren datos entre cuentas.
- También se incorporan las correcciones del formato WhatsApp aprobadas después de V2.4.8: no repetir fechas y nombres de hasta ocho caracteres.
- Actualización de números de versión de pies de página, exportaciones y package.json. Sin migraciones SQL.

## V2.4.8 — Reporte diario listo para WhatsApp (13 de noviembre de 2026)

- Botón flotante **Copiar para WhatsApp** visible solo en la página **Comparativa diaria**. Se desactiva cuando no hay registros o se seleccionan dos fechas idénticas.
- Copia los **totales de la tabla Por módulo**, respetando fechas, inclusión/exclusión de supervisores, métricas y calidad operativa calculadas por la aplicación. No reutiliza cifras de ejemplo ni de la tabla de ejecutivos.
- Indicadores: Registros, Ventas, Regulares, Garantizadas, Programa Cero, Plan Dental y Calidad (Alcance Global de la tabla). Cantidad del día principal y diferencia positiva, negativa o cero; Calidad se presenta en puntos porcentuales.
- Mensaje con título, fechas y bloque monoespaciado de WhatsApp (tres acentos graves), etiquetas/números alineados a ancho uniforme y aviso de copia exitosa o bloqueo de permisos. Soporta portapapeles seguro y mecanismo alternativo en navegadores compatibles.
- Sin alteraciones a cálculos, base de datos, login, comisiones ni exportaciones. Se actualiza a **V2.4.8**.

## V2.4.7 — Exportación de supervisor rediseñada (13 de noviembre de 2026)

- Nuevo estado de comisión de supervisor para **Imprimir / PDF** y **PNG**, basado en el diseño de referencia entregado: encabezado azul, datos de supervisor/módulo/semana, indicadores, bono, color naranja para A PAGAR, equipo, ventas propias y folios.
- Fuentes de datos exclusivamente propias de la V2.4.6: `supervisorCalculator()`, ajustes editables, objetivo del módulo, metas individuales y marcas de folio. No se inventan pagos individuales de ejecutivos ni ajustes de otras semanas.
- Calidad Total y Alcance Global respetan las reglas actuales. Bono por dinámica se muestra como concepto final separado, sin duplicaciones ni nuevas penalizaciones.
- La tabla de folios propios incorpora componente bruto, distribución de neto, y dinámica; el total de netos reconcilia el agregado de ventas propias.
- Los controles de impresión permiten ocultar los detalles. Por defecto, se omite el listado íntegro de folios del equipo para mantener un estado compacto; se puede activar.
- El PDF usa estilos propios de impresión A4 vertical; la imagen se dibuja como Canvas nativo con los mismos datos, sin dependencias nuevas. El CSV no cambia.
- Actualizados `package.json` y los pies visibles a **2.4.7**. Sin cambios SQL ni reimportación de XLS.

## V2.4.6 — Bono por dinámica y guardar/cerrar ajustes (13 de noviembre de 2026)

- Nueva sección **Ajustes → 13 · Bono por dinámica**: importe fijo editable en MXN, inicial $0.00; se sincroniza por usuario utilizando la infraestructura de ajustes de Netlify existente.
- Nueva columna de registros **Bono adicional**, visible de forma predeterminada y fija en los listados principales, logros y supervisor. Las casillas se comparten mediante el UID de folio y se conservan en las mismas preferencias de marcas de Incidencia y APP.
- Cada folio de venta válida marcado cobra una vez el importe fijo de dinámica. Una venta rechazada, cancelada, incompleta, sin código o con incidencia no cobra la dinámica; si después deja de estar excluida, su marca se conserva.
- La dinámica se agrega **después** de aplicar todos los descuentos, penalizaciones y recuperaciones: Total ejecutivo = Neto anterior + Nº de folios pagables marcados × monto dinámico.
- Supervisor = Bono neto del módulo + Neto de ventas propias + dinámica pagable **solo de ventas propias**. El bono del módulo no duplica los bonos de ejecutivos.
- Las tablas de folios, impresión/PDF/PNG y CSV incluyen la casilla/valor, y los resúmenes financieros revelan el concepto por separado.
- **Guardar ajustes y cerrar** valida conjuntamente los ajustes de supervisor y dinámica. Los botones individuales «Guardar» también cierran tras finalizar sin errores.
- Versiones visibles y archivo `package.json` alineados en **2.4.6**. No hay cambios de SQL ni necesidad de reimportar XLS.

## V2.4.5 corregida — 13 de noviembre de 2026
- Pies de página y exportaciones PDF/PNG alineados con la versión real 2.4.5.
- Mínimos predeterminados de calidad individual 60% editables. Configuraciones antiguas con ceros predeterminados migran a 60%; los mínimos personalizados distintos de cero se preservan y los nuevos ceros explícitos son válidos.
- Calidad Total sigue siendo media simple de cuatro, topada al 100%; Alcance Global media de cinco, sin tope.
- Bono base del supervisor = base × alcance global × min(1, cumplimiento módulo); no aplica multiplicación adicional por 110%, 120%, etc.
- Casilla en Ajustes 12 activada por defecto: incluir ventas pagables propias en cumplimiento del módulo. Tarifas de ventas propias continúan usando el escalón del equipo sin supervisores.
- Resumen, CSV, PDF/PNG y notas de cálculo actualizados; se quitan controles de ponderación obsoletos para evitar falsas expectativas.
- Se mantienen los tres bonos adicionales editables (110%/$1,000, 115%/$1,500, 120%/$2,000), siempre excluyentes. Sin nuevas migraciones SQL.

## 2.4.5 — Bonos editables y no acumulables
- Los tres umbrales y montos vuelven a ser editables y se conservan en la configuración.
- Solo se paga el tramo de mayor umbral alcanzado.

## 2.4.4 — Bono de sobrecumplimiento
- Bonos fijos excluyentes: 110% $1,000; 115% $1,500; 120%+ $2,000.
- No acumulables; se aplica únicamente el tramo mayor alcanzado.
- Se mantiene el alcance global corregido de 2.4.3.

## V2.4.3 — Corrección Alcance Global
- Calidad Total = min(100%, promedio simple de Cumplimiento, Primera Compra, Programa Cero y Activaciones).
- Alcance Global = promedio simple de esas cuatro calidades y Calidad Total, sin tope.
- Cumplimiento y Programa Cero sin tope; Primera Compra y Activaciones topadas al 100%.
- Aplicado a dashboard, logros, comparativos, exportaciones y calculadora de supervisores.

# Versión 2.4.2 — Calculadora de supervisor

- Todos los apartados de la calculadora pueden expandirse y contraerse; las dos tablas de registros comienzan contraídas.
- Control **Imprimir** junto a cada flecha de despliegue; independiente del estado abierto/cerrado, respetado en PDF y PNG.
- Resultados del equipo, desglose del bono y ventas propias alineados en tres columnas compactas en escritorio y apilados en móvil.
- Penalización sobre ventas propias con base elegible: P0 de ventas regulares propias o P0 de ventas regulares válidas del módulo sin supervisores; la regla aplicable y el descuento se muestran en resultados.
- Los filtros, plegados y selección de impresión no sincronizan con PostgreSQL. La configuración original de bonos y las nueve páginas se conservan.


## 2.4.2 · Supervisor: tablas, alcance y Plan Cero

- Tablas del supervisor compactas: corrige `min-width: 640px` heredado; la tabla de folios conserva desplazamiento horizontal propio.
- Alcance global del bono sin máximo de calidad, incluso con ajustes antiguos (100%). El mínimo sigue siendo configurable.
- Nuevo ajuste de selección **Plan Cero de módulo vs ventas propias** para la penalización sobre las comisiones personales; no cambia el descuento P0 del bono del módulo.
- El reporte muestra la base y el porcentaje usado en la penalización.
- No se requieren migraciones de base de datos.

## 3.0.3 — Configuración de reportes y restablecimiento
- Ajustes de portapapeles por reporte: encabezados, etiquetas, visibilidad, orden, textos adicionales y formato. Sincronización por cuenta mediante settings y respaldo JSON.
- Restablecimiento de ajustes conservando objetivos base, registros y equipo; restablecimiento completo de la cuenta mediante función autenticada y confirmación escrita. No elimina la cuenta de Identity.
- Comparativa semanal e históricos utilizan metas base vigentes; las excepciones existentes siguen disponibles. Los objetivos faltantes se indican explícitamente en estos controles y exportaciones; P0 y Dental convierten tasas en cantidades para las comparativas de conteos.
- El botón flotante abre Exportar primero.
- Validación de sintaxis y pruebas Node; el build y la operación real de Netlify requieren dependencias y despliegue.

## V3.0.4.2 — Navegación, inicio y alternativa Supabase (20 noviembre 2026)
- Se migra la página principal a **Comparativa diaria**; el usuario aún puede personalizarla después desde Ajustes > Páginas.
- Navegación con delegación de eventos y errores visibles al seleccionar otra vista. Se aclara que la captura obligatoria de objetivos impide cambiar de página hasta guardar.
- Asignación rápida con dos entradas masivas independientes y botón que escribe en todos los campos **faltantes y editables**, preservando los objetivos preexistentes.
- Se incorpora `src/start-app.js` para seleccionar proveedor Netlify o Supabase mediante `VITE_CLOUD_PROVIDER`, y cliente de Supabase Auth/Edge Functions sin sustituir los mecanismos Netlify originales.
- Se incluyen SQL consolidado, Edge Functions con validación de JWT y CORS, guía de despliegue, plantilla `.env.example` y workflow de GitHub Pages.
- La migración de cuentas, históricos XLS e incidencias **no es automática**: requiere confirmación de propietarios. Las fórmulas de comisiones y calidad permanecen sin alterar.
