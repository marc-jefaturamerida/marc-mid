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
