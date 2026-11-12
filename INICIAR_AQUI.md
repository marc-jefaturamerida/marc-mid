# Dashboard y comisiones Mérida · Versión 2.2

## Publicación en Netlify

1. Descomprime el ZIP y sube el **contenido** de esta carpeta a la raíz de tu repositorio en GitHub. Mantén `index.html`, `package.json`, `netlify.toml`, `src/`, `public/` y `netlify/`.
2. En Netlify importa el repositorio. Configura **Build command** `npm run build`, **Publish directory** `dist`, y deja **Base directory** vacío.
3. Verifica que Netlify Database esté aprovisionada y que se ejecuten las migraciones de `netlify/database/migrations/`, especialmente **`20261111190000_create_dashboard_visits.sql`**.
4. En **Data & storage → Database**, confirma las tablas `dashboard_settings`, `dashboard_reports` y `dashboard_visits`.
5. Activa Netlify Identity, configura **Invite only** e invita los correos autorizados. Cada usuario accede a sus propios XLS, ajustes y visitas.
6. Entra al Dashboard, importa XLS históricos y abre la **sexta pestaña, «Visitas de coordinación»**. El módulo y supervisor se eligen de los XLS. Solo aparecen los folios de la semana correspondiente (lunes a domingo).
7. Completa el checklist, revisa folios e incidencias y captura compromisos. **La visita solo se envía al servidor cuando pulsas «Guardar visita».**
8. Para editar títulos, ponderaciones, criterios, color, tamaño inicial de fuente, imagen de encabezado o firma del coordinador, abre **Ajustes → 9. Visitas de coordinación**.
9. Para exportar, utiliza los botones PDF o PNG desde la visita, o los botones superiores. El PDF se optimiza para carta vertical y mantiene espacio para firmar en papel.

## Archivos principales

- `src/visits.js`: pantalla y cálculo de la visita.
- `public/assets/visits.css`: diseño móvil, impresión y colores.
- `public/assets/visit-header.png` y `public/assets/visit-signature.png`: imágenes **originales** extraídas de `Visitas del coordinador.xlsx`.
- `netlify/functions/visits.js`: CRUD de visitas en el servidor, protegido con Netlify Identity.
- `netlify/database/migrations/20261111190000_create_dashboard_visits.sql`: nueva tabla PostgreSQL `dashboard_visits`.
- `src/legacy-app.js` y `src/cloud-boot.js`: seis páginas anteriores y sincronización optimizada.

## Reglas y limitaciones

- Apartado II: los 50 puntos se calculan mediante los pesos de los criterios respondidos; solo Cumple suma puntos. Sin respuestas, 0.
- Apartado III: selecciona hasta 3 folios de la semana; se calculan dos comprobaciones por folio: «registro correcto» y «calidad ≥ 75%». La calidad es 25% por código de barras, APP, Plan Cero y Plan Dental. La validación técnica de registro comprueba que estén presentes folio, fecha, ejecutivo y módulo. **No sustituye una revisión humana de la veracidad de los datos.** Puedes exigir además estatus pagable desde Ajustes. Si el XLS no contiene columna de activación APP, utiliza el estado predeterminado del Dashboard, y lo indica en pantalla.
- Apartado IV: muestra las incidencias de la semana y módulo. El estado Resuelta/Pendiente se responde manualmente. Se conserva la fórmula original `20 / 3 × resueltas`, topada al máximo. Si no hay incidencias se asignan 20 puntos de manera predeterminada (personalizable en Ajustes).
- Apartado V: Sí = +10, No = 0, En ceros = −10, conservando la fórmula.
- Cinco campos de comentarios extensos, uno por sección. El reporte reduce su escala automáticamente para caber en carta; con textos excepcionalmente largos podría dejar de ser legible.
- No se capturan fotografías ni firma del supervisor; la firma del coordinador sale impresa y la del supervisor queda en blanco.
- Los XLS no se recargan de la nube al cambiar filtros, fechas o ejecutivos. Solo las ediciones de preferencias sincronizables y el botón explícito **Guardar visita** generan escrituras.
- Las visitas de la nueva cuenta de Netlify no se copian automáticamente desde la cuenta anterior.

La compilación de Netlify y el funcionamiento real del entorno remoto requieren validar el nuevo despliegue en tu propia cuenta. Si `dashboard_visits` no existe tras desplegar, revisa que el SQL haya llegado a GitHub y el registro de migraciones de Netlify.


### Ajuste de impresión 2.0.1
Los cinco apartados muestran un cuadro fijo **Comentarios** a la derecha en PDF y PNG, incluso cuando el campo está vacío. Se conserva una hoja carta vertical con reducción proporcional del contenido cuando hay observaciones extensas. No cambia la base de datos ni la puntuación.

## Versión 2.0.2 · Detalle de comisiones

La Calculadora individual ahora incluye en Base y Simulación un desglose de cada concepto: total pagado, cantidad y tarifa unitaria vigente del escalón. Se incluye en PDF, PNG y CSV. La actualización es visual y no cambia la base de datos ni las reglas de cálculo.


## Página 7 · Registros XLS (V2.1)

1. Después de desplegar, entra a **Registros XLS** en la navegación del Dashboard.
2. Importa archivos desde **Cargar XLS** o selecciona los que ya guardaste en **Ajustes → 1. Archivos XLS guardados**.
3. Filtra por **Módulo** y **Ejecutivo** usando los dos desplegables siempre visibles.
4. Abre **Filtros avanzados** si necesitas rango de fechas, estado de pago, incidencias, APP, búsqueda textual, P0, Dental o seleccionar varios valores de una columna.
5. Revisa las casillas **Incidencia** y **APP**. Esas casillas sí actualizan las marcas compartidas con la calculadora; no son filtros de solo lectura.
6. Para mostrar otras columnas: **⚙ Ajustes → 8. Tabla de folios → Columnas visibles**. Ambas páginas comparten esa selección. Incidencia y APP permanecen fijas en la vista de registros.
7. Cambia la cantidad de filas por página abajo de la tabla. El botón global **Exportar CSV** y las exportaciones **PDF / PNG** usan todas las filas que cumplan los filtros, no sólo las que ves en la página actual.

Esta nueva página no requiere migraciones SQL adicionales. La navegación y los filtros se ejecutan en el navegador, por lo que no incrementan el consumo de Netlify Database. Los XLS históricos siguen en la base existente.


## Novedades de la versión 2.2

1. Abre las páginas 3 (**Comparativa diaria**) y 4 (**Acumulado general**) y comprueba la columna final **Calidad** en tablas de módulo y ejecutivo.
2. En la página 5 (**Comparativa semanal**) revisa **Calidad de factores** y **Alcance global** en ambas tablas. Puedes introducir o cambiar metas en la fila de objetivos.
3. Desde **⚙ Ajustes → 10. Calidad y objetivos** define metas semanales por módulo, meta global por ejecutivo, objetivos de cuatro factores, umbral mínimo y ponderaciones. Las metas/ponderaciones específicas de un módulo prevalecen; si se dejan vacías aplican las globales.
4. Desde **⚙ Ajustes → 11. Supervisores por módulo** selecciona entre los ejecutivos presentes en los XLS. Puedes marcar más de uno por módulo.
5. Las casillas **Incluir registros de supervisores** en páginas 3, 4 y 5 filtran los registros localmente y no modifican el origen XLS.
6. La búsqueda principal sobre folios de las páginas 1 y 7 permanece visible y no sincroniza. Los resultados de la página 7 se muestran de fecha más reciente a más antigua, también en exportaciones.

**Implementación:** solo sustituye el repositorio con este proyecto completo y realiza Commit. No se añade ninguna tabla ni migración SQL en la V2.2. Las nuevas configuraciones se sincronizan mediante Netlify Functions existentes. Como antes, el despliegue se debe comprobar en la cuenta real.
