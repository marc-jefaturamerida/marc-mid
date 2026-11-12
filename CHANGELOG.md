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
