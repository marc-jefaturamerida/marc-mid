## V2.5.1 — 13 de noviembre de 2026
- Nueva exportación Seguimiento administrativo semanal en la página Supervisor para PDF y PNG en formato carta.
- Logo INVEX/MARC y firma original de Visitas de coordinador.
- Apartados sin numeración, comentarios y plan de trabajo ampliados, firmas al final sin notas inferiores.
- Hasta 50 folios por hoja en dos tablas; sin recortes para semanas de más de 50.
- No se alteran las fórmulas ni los datos guardados en PostgreSQL.

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
