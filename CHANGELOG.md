# Versión 2.4.1 — Calculadora de supervisor

- Todos los apartados de la calculadora pueden expandirse y contraerse; las dos tablas de registros comienzan contraídas.
- Control **Imprimir** junto a cada flecha de despliegue; independiente del estado abierto/cerrado, respetado en PDF y PNG.
- Resultados del equipo, desglose del bono y ventas propias alineados en tres columnas compactas en escritorio y apilados en móvil.
- Se explicita la penalización por Plan Cero en ventas propias: planes P0 / ventas propias regulares válidas; por debajo del mínimo configurado se descuenta el porcentaje configurado sobre las comisiones propias. Sin ventas regulares, la penalización no aplica.
- Los filtros, plegados y selección de impresión no sincronizan con PostgreSQL. La configuración original de bonos y las nueve páginas se conservan.
