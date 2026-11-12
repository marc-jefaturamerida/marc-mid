# Versión 2.2 · Calidad, objetivos y supervisores

- Páginas 3 **Comparativa diaria** y 4 **Acumulado general**: columna final **Calidad** para módulos y ejecutivos; también se imprime y exporta.
- Página 5 **Comparativa semanal por módulo**: nueva columna Calidad y filas **CALIDAD DE FACTORES** y **ALCANCE GLOBAL**, con metas semanales de registros y ventas y comparativas de los objetivos.
- **Ajustes → 10. Calidad y objetivos de módulos y ejecutivos**: configuración global de objetivos, mínimo de puntuación, pesos de factores y meta semanal ejecutiva; adicionalmente, cada módulo tiene objetivos, metas y ponderaciones personalizadas. Los valores de módulos vacíos heredan los globales.
- **Ajustes → 11. Supervisores por módulo**: asigna como supervisores a los ejecutivos detectados en los XLS del módulo. Se conserva por usuario en la nube.
- En las páginas 3, 4 y 5, casilla **Incluir registros de supervisores**, marcada inicialmente. Su cambio solo filtra/recalcula la página activa, sin persistir cambios en Netlify.
- Búsqueda general de texto siempre visible antes de la tabla de folios de la página 1 y de la tabla de registros de la página 7; filtros por página, sin consultas remotas.
- En la página 7 se conserva ordenamiento descendente por fecha, con registros sin fecha al final, también en PDF, PNG y CSV.
- Se mantiene intacta la fórmula de comisiones; las columnas de calidad son análisis operativo independiente.
- No requiere modificar el esquema PostgreSQL ni añadir Netlify Functions. Las dos nuevas preferencias se sincronizan por la función de Ajustes ya incluida.

## Fórmula de calidad operativa configurada

- **Cumplimiento**: ventas con código de barras / meta asignada. Referencia global 100%; sin tope superior.
- **Primera compra**: ventas con Plan Cero **o** Plan Dental (una vez por venta) / ventas con código. Referencia 90%; calidad máxima 100%.
- **Programa Cero**: Planes Cero en ventas regulares / ventas regulares. Referencia 30%; sin tope superior.
- **Activación APP**: activaciones según casillas APP / ventas con código. Referencia 90%; calidad máxima 100%.
- Si el cumplimiento real respecto al objetivo de un factor está por debajo del 60% (mínimo configurable), su puntuación es cero; la calidad global es el promedio ponderado de los factores, tomando pesos editables.
- En la página 5, la fila Calidad de factores mide, para los seis indicadores, su resultado respecto a la meta capturada o predefinida, con la regla mínima; Alcance global muestra los cuatro factores de calidad operativa anteriores. La meta de ventas que se escriba en la comparativa semanal prevalece para ese cálculo global.

# Versión 2.1 · Consulta de registros XLS

- Nueva página 7 con tabla completa de los registros XLS activos, sin limitar por semana ni ejecutivo de la calculadora.
- Filtros principales Módulo y Ejecutivo siempre visibles; filtros avanzados contraídos por defecto y combinables.
- Búsqueda general, rango de fechas, pago, incidencia, APP, código, regulares/garantizadas, P0, Dental, filtrado por columna y selección de múltiples valores.
- Misma configuración de columnas ocultas de página 1; Incidencia y APP fijadas a la vista para validarlas.
- Paginación eficiente de 50/100/200 filas con filtros aplicados al total.
- Los cambios de casillas se reflejan en la calculadora y persisten por cuenta conforme a las reglas existentes.
- Exportación PDF, PNG y CSV del conjunto filtrado completo.
- Filtrar/paginar no crea escrituras ni llamadas a la nube.
- Sin cambios de esquema PostgreSQL ni de Netlify Functions.

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
