# Dashboard y comisiones Mérida · V2.2 Online

Proyecto completo de Netlify. Incluye las seis páginas anteriores, la **Visita de coordinación** adaptada a teléfonos, Netlify Identity, Netlify Database (PostgreSQL), funciones de servidor y exportaciones PDF/PNG.

Lee **[INICIAR_AQUI.md](INICIAR_AQUI.md)** para publicar y configurar.

## Sexta página

La visita utiliza los archivos XLS de la cuenta. Se capturan cinco secciones, siguiendo los textos y fórmulas de `Visitas del coordinador.xlsx`. El usuario puede modificar los 12 criterios iniciales, añadir y quitar criterios, definir pesos individuales, modificar los puntos de cada sección, títulos, etiquetas, comentarios, umbral de calidad, encabezado y firma. Las fotos son las originales de la plantilla y pueden sustituirse por cuenta.

Las visitas se almacenan en `dashboard_visits` cuando se pulsa **Guardar visita**. Se pueden abrir y borrar desde la lista de visitas guardadas. La consulta del historial ocurre al abrir la página por primera vez o al pulsar **Actualizar historial**, no en cada filtro. Todos los datos se separan por identificador verificado de usuario.

## Publicación

- Build: `npm run build`
- Publish: `dist`
- Sin base directory si subes el contenido del ZIP a la raíz.
- Comprueba tres tablas: `dashboard_reports`, `dashboard_settings`, `dashboard_visits`.
- La carpeta `public/assets/` se copia automáticamente a `/assets/` en Netlify mediante Vite.
- Para confirmar las reglas del apartado III, revisa el detalle en `INICIAR_AQUI.md`.

**Aviso:** el cálculo de comisiones es una estimación. Una marca de «registro correcto» basada en campos XLS completos no acredita por sí sola el cumplimiento del proceso administrativo.


### Ajuste de impresión 2.0.1
Los cinco apartados muestran un cuadro fijo **Comentarios** a la derecha en PDF y PNG, incluso cuando el campo está vacío. Se conserva una hoja carta vertical con reducción proporcional del contenido cuando hay observaciones extensas. No cambia la base de datos ni la puntuación.

## Versión 2.0.2 · Detalle de comisiones

La Calculadora individual ahora incluye en Base y Simulación un desglose de cada concepto: total pagado, cantidad y tarifa unitaria vigente del escalón. Se incluye en PDF, PNG y CSV. La actualización es visual y no cambia la base de datos ni las reglas de cálculo.


## Versión 2.1 · Séptima página: Registros XLS

La pestaña **Registros XLS** permite consultar el conjunto de filas únicas de los archivos XLS activos (todos o los elegidos desde Ajustes → Archivos guardados). Funciona con XLS temporales sin iniciar sesión o con el historial de la cuenta autenticada.

- **Módulo** y **Ejecutivo** permanecen visibles encima de la tabla. La lista de ejecutivos se limita al módulo elegido.
- **Filtros avanzados** plegados al iniciar: búsqueda general, rango de fechas, pago, incidencia, APP, presencia de código, tipo garantizada/regular, P0, Dental y una columna del XLS con **múltiples valores seleccionables**. Los filtros se pueden combinar.
- Comparte las columnas visibles configuradas en **Ajustes → 8. Tabla de folios**; las casillas **Incidencia** y **APP** están fijadas en esta vista para validarlas siempre.
- Muestra 50, 100 o 200 filas por página; los filtros se aplican al conjunto completo, no sólo a la página mostrada.
- PDF, PNG y CSV usan los filtros actuales y exportan **todas** las filas filtradas. En exportaciones PNG demasiado extensas, usa PDF o CSV para evitar los límites de memoria de los navegadores.
- **Economía Netlify:** filtrar, buscar, cambiar módulo/ejecutivo y paginar son operaciones completamente locales; no guardan configuraciones ni consultan PostgreSQL. Solo marcar Incidencia o cambiar APP persiste la validación del folio mediante el mecanismo ya existente.

No se modifica el esquema PostgreSQL ni las Netlify Functions. No es necesario volver a cargar XLS ya guardados. Si una tabla contiene demasiadas columnas para una hoja, el PDF reduce tipografía y conserva el encabezado de columnas al continuar en páginas sucesivas.


## Versión 2.2 · Calidad y supervisores

**Página 3 – Comparativa diaria:** calidad calculada por módulo y por ejecutivo con los cuatro factores configurables. Se mantiene el comparativo frente al día elegido; el objetivo semanal se prorratea a un día para esta vista.

**Página 4 – Acumulado general:** los dos comparativos incluyen calidad calculada del conjunto de registros visibles. El objetivo semanal corresponde al número de semanas representadas.

**Página 5 – Comparativa semanal:** las dos tablas muestran **Calidad de factores** (nivel respecto a metas para los seis indicadores) y **Alcance global** (calidad operativa ponderada en los cuatro factores). Si defines la meta de ventas en la fila de objetivos de la semana, se usa esa meta para el cálculo global de esa semana.

**Ajustes:** dos apartados nuevos, Calidad y objetivos (metas, umbrales, pesos y valores por módulo) y Supervisores por módulo (elegibles entre los ejecutivos cargados). Ambos se sincronizan en Netlify con la sesión autenticada. Las casillas para incluir supervisores en páginas 3–5 funcionan de forma local y se pueden ajustar independientemente en cada página.

**Búsqueda de folios:** el filtro general en páginas 1 y 7 siempre está visible. La página 7 conserva el orden cronológico descendente en pantalla y exportaciones.

No se modifican comisiones, Netlify Identity, las funciones de servidor ni el esquema de PostgreSQL. Los filtros siguen funcionando localmente sin consumir escrituras de ajustes.
