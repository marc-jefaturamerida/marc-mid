## V2.3.5 — Indicadores ligados a filtros y exclusión de incidencias (página 8)

- Logros por porcentaje: cifra grande = alcance real; cifra pequeña = calidad individual después de requerido, mínimo y máximo. PDF, PNG y CSV contienen ambos valores en columnas distintas.
- Los indicadores de cantidades y porcentajes se calculan EXCLUSIVAMENTE con registros que cumplen búsqueda, filtros avanzados, módulo, semana y filtro de supervisor. No se toma una fuente diferente de la tabla.
- Paginación solo afecta a la representación: se suman **todas las filas filtradas**, aunque haya varias páginas, igual que las exportaciones.
- Folios con incidencia pueden aparecer en la tabla, pero se **excluyen de TODOS los indicadores de desempeño**; el número de incidencias excluidas se informa de manera separada, sin contabilizarse como logro.
- Casillas Incidencia/APP recalculan al instante sin consultas remotas de filtros. No cambia la fórmula de comisiones, la DB ni el login.

# Dashboard Mérida V2.3 — Proyecto completo para Netlify

**Novedad:** octava página «Logros semanales». Permite seleccionar semana y módulo, consultar logros en porcentajes (Registros, Cumplimiento, Dental, Plan Cero, Primera compra, Calidad compuesta y Alcance global), cantidades reales, y los registros detallados con búsqueda y filtros avanzados inicialmente contraídos. La tabla conserva las mismas columnas y casillas de incidencia/APP de la calculadora. PDF, PNG y CSV incluyen los indicadores y todos los registros filtrados.

La página utiliza los porcentajes requeridos, mínimos, máximos y ponderaciones de Ajustes 10. La meta de registros debe configurarse por módulo; de lo contrario el porcentaje aparece como «—». Calidad compuesta es la media ponderada de cinco factores (incluida APP); Alcance global evalúa esa calidad respecto al porcentaje requerido de Calidad.

Cambiar semana, módulo, buscar o filtrar no llama a PostgreSQL. Las ocho páginas son accesibles sin login con XLS temporales; el historial XLS y los ajustes compartidos siguen protegidos por Netlify Identity.

---

## Cambios de la versión 2.3.3

- Las tres últimas filas semanales utilizan la tipografía de **Cumplimiento**.
- **Ajustes** abre sin autenticación para revisar y probar configuraciones locales. Los XLS guardados, visitas históricas y sincronización con Netlify requieren sesión. Los cambios del invitado no se envían a PostgreSQL y podrían restablecerse al actualizar la página.

## Versión 2.3.3 · Calidad numérica y tablas adaptativas

En la página 5, **Calidad de factores** muestra solamente el porcentaje correspondiente a cada columna, sin repetir el nombre del factor. PDF, PNG y CSV conservan ese criterio. Las tablas semanales ahora se ajustan al ancho disponible: en escritorio amplio aparecen lado a lado y en tableta/teléfono se apilan verticalmente con todas las columnas visibles, sin desplazamiento horizontal. No se modifican las reglas de calidad ni el guardado en Netlify.

# Dashboard y comisiones Mérida · V2.3 Online

Proyecto completo de Netlify. Incluye las ocho páginas, incluida la **Visita de coordinación** adaptada a teléfonos, Netlify Identity, Netlify Database (PostgreSQL), funciones de servidor y exportaciones PDF/PNG.

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


## Versión 2.2.1 · Calidad y supervisores

**Página 3 – Comparativa diaria:** calidad calculada por módulo y por ejecutivo con los cinco factores ponderados, evaluados a su vez contra el porcentaje requerido de Calidad. Se mantiene el comparativo frente al día elegido; el objetivo semanal se prorratea a un día para esta vista.

**Página 4 – Acumulado general:** los dos comparativos incluyen calidad calculada del conjunto de registros visibles. El objetivo semanal corresponde al número de semanas representadas.

**Página 5 – Comparativa semanal:** las dos tablas muestran **Calidad de factores** (nivel respecto a metas para los seis indicadores) y **Alcance global** (calidad operativa de cinco factores evaluada contra el requerido de Calidad). Si defines la meta de ventas en la fila de objetivos de la semana, se usa esa meta para el cálculo global de esa semana.

**Ajustes:** dos apartados nuevos, Calidad y objetivos (metas, umbrales, pesos y valores por módulo) y Supervisores por módulo (elegibles entre los ejecutivos cargados). Ambos se sincronizan en Netlify con la sesión autenticada. Las casillas para incluir supervisores en páginas 3–5 funcionan de forma local y se pueden ajustar independientemente en cada página.

**Búsqueda de folios:** el filtro general en páginas 1 y 7 siempre está visible. La página 7 conserva el orden cronológico descendente en pantalla y exportaciones.

No se modifican comisiones, Netlify Identity, las funciones de servidor ni el esquema de PostgreSQL. Los filtros siguen funcionando localmente sin consumir escrituras de ajustes.

## Corrección V2.2.1

En V2.2, el navegador intentaba sincronizar objetivos y supervisores, pero la Function `settings` rechazaba esas dos claves; el guardado quedaba pendiente. V2.2.1 corrige la lista de claves aceptadas en servidor. Publica **también** `netlify/functions/settings.js`, no solo `src/legacy-app.js`.

Los factores de calidad operativa de módulos y ejecutivos utilizan los mínimos y máximos que configures; de forma predeterminada los mínimos son 0%, sin corte general al 60%. La escala de comisiones y penalizaciones permanece intacta. Si hay cambios pendientes desde V2.2, tras el despliegue pulsa **Sincronizar** y comprueba que el estado deje de indicar cambios pendientes.


## V2.2.3 · Porcentajes requeridos y navegación pública
- Los seis rubros configurables son Cumplimiento, Plan Cero, Plan Dental, Activación APP, Primera compra y Calidad. Para cada uno: porcentaje requerido, mínimo de calidad y máximo opcional; por módulo prevalece la configuración específica.
- La calidad individual = (alcance real / porcentaje requerido) × 100; si queda por debajo del mínimo, vale 0; por encima del máximo se topa. En blanco el máximo = sin tope.
- Los primeros cinco factores componen la calidad mediante pesos normalizados. El sexto rubro, Calidad, aplica su porcentaje requerido y sus límites al compuesto, sin añadir una dependencia circular.
- Las ocho páginas se pueden abrir sin sesión, con XLS temporales. El historial, la configuración y las visitas de PostgreSQL siguen protegidos por Netlify Identity. Sin sesión no es posible guardar cambios remotos ni acceder a datos de otra cuenta.
- El acumulado, las comparativas semanales y la visita utilizan los XLS temporales de esta sesión cuando no se ha iniciado sesión. La visita puede exportarse a PDF/PNG, pero guardarla en la nube requiere iniciar sesión.
- Sin cambios en el esquema PostgreSQL ni en el cálculo de comisiones.


## Versión 2.3.3 · Objetivos semanales mixtos (página 8)

Los objetivos de **Registros y Ventas** son cantidades enteras. **Plan Cero, Plan Dental, APP y Primera compra** se capturan como **porcentajes requeridos (0–100%)**, con decimales permitidos. Sus bases:
- Plan Cero = planes cero de ventas regulares / ventas regulares con código.
- Plan Dental = planes dentales / ventas con código.
- APP = activaciones / ventas con código.
- Primera compra = ventas que tienen P0 o Dental (una vez por venta) / ventas con código.

La calidad individual divide el alcance porcentual real entre el requerido, respetando mínimos y máximos de Ajustes. Para Cumplimiento se usa ventas / objetivo en cantidad. Se mantienen las ponderaciones para Calidad compuesta y el objetivo requerido de Calidad para Alcance global.

**Migración segura:** las antiguas metas en cantidades de Registros y Ventas se conservan; los antiguos números capturados como metas de P0, Dental, APP y Primera compra se dejan vacíos para no confundir cantidades con porcentajes. Vuelve a capturar porcentajes y pulsa **Guardar objetivos**. Al escribir los objetivos no se llama a Netlify; solo se sincronizan al guardar con sesión. No se requieren tablas ni Functions nuevas.


## V2.3.5: búsqueda junto a los folios y compatibilidad de importación

En la página 8, la búsqueda general y la casilla de inclusión de supervisores se encuentran dentro del apartado **Registros de la semana**, justo debajo de su encabezado. La búsqueda sigue afectando todos los indicadores y la tabla sin consultar PostgreSQL.

El botón **Cargar XLS** acepta ahora `.xls` (HTML o binario), `.xlsx`, `.csv` y `.tsv`. Detecta la tabla y la fila de encabezados aun cuando un archivo tenga una portada, y admite sinónimos comunes (`Código de barras`, `Folio de la solicitud`, `Plan Cero`, `Plan Dental`, etc.). Las columnas opcionales ausentes quedan en blanco y se advierte al importarlas; nunca se inventan ventas ni planes. La conversión ocurre dentro del navegador. El formato Excel binario necesita la dependencia oficial **SheetJS 0.20.3** incluida en `package.json` y se descarga durante el build; se evita la versión antigua `xlsx` 0.18.5 del registro npm.

Los archivos existentes en PostgreSQL permanecen inalterados. Al publicar la actualización, Netlify debe instalar la nueva dependencia; comprueba el resultado de `npm run build` en el registro de despliegue. Para libros enormes sigue aplicando el límite de 5 MB por petición a la Function de guardado.


## Versión 2.4.1: Calculadora de supervisor

La novena página permite escoger una semana y un supervisor previamente marcado en **Ajustes → 11**. Un supervisor debe encontrarse entre los nombres de los XLS cargados y debe estar asignado a un módulo.

**Escalón del supervisor:** cuenta únicamente las ventas con código, tipo de venta válido, sin estatus no pagable ni incidencia, realizadas por los ejecutivos del módulo que **no** sean supervisores. Divide esas ventas entre el objetivo semanal del módulo. Ejemplo: meta de 20, ejecutivos hacen 15, supervisor hace 10: el escalón para pagar las 10 ventas propias es el de **75%**, independientemente de las 10 ventas propias.

**Bono del módulo:** cuatro variables (Cumplimiento, Primera compra, Programa Cero y APP) con porcentaje requerido, mínimo, máximo y ponderación. La calidad compuesta de las cuatro se evalúa frente al porcentaje requerido de Calidad total para producir Alcance global. Fórmula base: Bono base × (Cumplimiento del equipo/100) × (Alcance global/100). Los bonos adicionales de los escalones 110%, 115% y 120% se **suman** al alcanzar cada umbral; luego se aplica el descuento por P0 insuficiente del módulo (30% requerido y -15% por defecto, ambos editables).

**Ventas propias:** se pagan Venta, APP, Dental y Plan Cero con las tarifas del escalón anterior. Un folio con incidencia queda excluido completamente antes de calcular las comisiones; con una incidencia no se aplica descuento porcentual adicional, con dos se aplica 10%, con tres 20%, con cuatro o más 30% sobre las comisiones de los folios restantes. También se aplica el descuento por Plan Cero insuficiente en ventas regulares propias. La tabla de escalones y todas las penalizaciones se pueden configurar en Ajustes → 12. No se añade un segundo bono semanal de ejecutivos por las ventas propias del supervisor.

**Metas y cantidades:** Los montos `$x` no se conocen; el bono base y las tres cantidades de bono adicionales comienzan **sin configurar**. Para ponerlo en producción, visita Ajustes → 12 e ingresa los montos reales. Si no defines una meta semanal de módulo en Ajustes → 12, se hereda de Ajustes → 10 y, en último término, de la suma de metas individuales de los ejecutivos no supervisores presentes en la semana.

**Archivos:** la novena página forma parte del `index.html` y `src/legacy-app.js`; el acceso sigue siendo público para pruebas con XLS temporales, pero guardar/importar datos remotos y sincronizar ajustes requiere Netlify Identity. Los XLS históricos y las visitas de coordinación existentes no se alteran. Las exportaciones PDF/PNG/CSV incluyen el desglose y ambas tablas de folios. La búsqueda de folios es visual: no cambia la comisión y no gasta créditos de Netlify.

Esta calculadora es una simulación de los criterios proporcionados, no una confirmación del monto pagable. Los ajustes nuevos se guardan en el mismo almacenamiento de configuraciones por cuenta; no se necesitan migraciones SQL adicionales.


## V2.4.1
Secciones de calculadora de supervisor plegables con opción de impresión individual, tablas contraídas por defecto, tarjetas compactas de tres columnas y penalización P0 propia detallada.
