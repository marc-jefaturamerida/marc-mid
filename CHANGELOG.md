# Cambios en la versión 2.0.2

- Calculadora individual: los escenarios Base y Simulación muestran el pago de Ventas, Plan Dental, APP, Plan Cero y Bono semanal como **importe total (cantidad × tarifa del escalón)**.
- La tabla comparativa muestra la cantidad y tarifa debajo del importe en cada concepto.
- PDF y PNG reproducen los cinco desgloses en las tarjetas de cada escenario, sin recortes, y el CSV agrega filas descriptivas de cantidades y tarifas.
- No cambian cálculos, reglas, tarifas configuradas, guardado ni sincronización.

# Cambios de versión

## 2.0 — Nueva página de visitas de coordinación

- Sexta página protegida por Netlify Identity, optimizada para smartphone.
- Secciones I–V replicadas según Excel, comentarios por sección, puntuación calculada y resumen.
- Módulos y ejecutivos tomados de todos los XLS guardados; folios de lunes a domingo, hasta tres seleccionados.
- Calidad de folios: 25% código, 25% APP, 25% Plan Cero, 25% Plan Dental; umbral ajustable (75% inicial).
- Incidencias por módulo y semana, evaluación manual Resuelta/Pendiente.
- Checklist personalizable con pesos, títulos, puntuaciones, etiquetas, colores, escala de texto y visibilidad de comentarios.
- Imágenes de encabezado y firma originales del XLS, sustituibles desde Ajustes, incluidas en las exportaciones.
- Historial de visitas por usuario, guardado manual mediante nueva Netlify Function, migración SQL.
- PDF en tamaño carta vertical y PNG de alta resolución; firma de supervisor en blanco.
- Se conserva el modelo económico 1.9.2: navegar por fechas, folios o ejecutivos no escribe en PostgreSQL.

## Versiones anteriores

Se mantienen las cinco páginas del Dashboard, la lógica de comisiones y la sincronización optimizada de 1.9.2.


### Ajuste de impresión 2.0.1
Los cinco apartados muestran un cuadro fijo **Comentarios** a la derecha en PDF y PNG, incluso cuando el campo está vacío. Se conserva una hoja carta vertical con reducción proporcional del contenido cuando hay observaciones extensas. No cambia la base de datos ni la puntuación.
