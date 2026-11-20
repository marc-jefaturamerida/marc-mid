# Actualización V3.0.4 — Objetivos activos, captura rápida y comparativo por fechas

Esta actualización conserva el manual de las versiones anteriores; las funciones nuevas se describen aquí.

## 1. Definir perfil activo o inactivo desde sus objetivos

1. Abre el perfil de un módulo o de un ejecutivo desde **Objetivos base**, o toca su nombre donde se ofrezca configurar objetivos.
2. Ajusta los indicadores y la fecha de vigencia semanal como antes.
3. **Junto a «Guardar objetivos y vigencia»** marca o desmarca **«Perfil activo»** y guarda.
4. La baja usa la fecha del dispositivo de la operación: las filas con fecha anterior a la baja permanecen en el histórico; las de la baja y posteriores se excluyen de métricas, comparativos y sus exportaciones. Al reactivar, los nuevos registros vuelven a participar desde la fecha de reactivación. No se eliminan ni reescriben los XLS originales.
5. El estado de un módulo es independiente del estado de sus ejecutivos. Desactivar un módulo no cambia sus casillas de estado. Sin embargo, las filas producidas dentro del módulo inactivo dejan de participar a partir de su fecha de baja; si un ejecutivo trabaja en otro módulo activo, sus filas allí sí participan.
6. El selector no aparece para el perfil agregado **Jefatura**. Las metas se guardan por semana; el estado activo se aplica desde la fecha en que se registra el cambio, no desde la vigencia de objetivos seleccionada.

## 2. Pantalla obligatoria «Asignación rápida de objetivos»

- **Al iniciar:** comprueba la **semana en curso** de los perfiles detectados o creados que todavía están activos.
- **Al cargar nuevos XLS:** revisa las semanas presentes **solo en los archivos aceptados en esa importación**. No rehace automáticamente todas las vigencias del historial antiguo.
- La tabla muestra **Nombre, Tipo (módulo/ejecutivo), Semana, Trámites y Ventas**. Los objetivos ya configurados se muestran en solo lectura; se capturan los faltantes.
- Un objetivo de cantidad **vacío o igual a cero** se considera pendiente. Captura números enteros de **1 a 1,000,000**. No es posible cerrar el aviso sin completar todas las metas faltantes.
- Pulsa **Guardar todos los objetivos**; se guardan por perfil y vigencia, preservando porcentajes y demás metas preexistentes. Un objetivo real de ventas almacenado en el catálogo antiguo sigue siendo válido; no se confunde con el valor predeterminado de la calculadora.
- En sesiones con cuenta se mantiene la sincronización de ajustes mediante las claves y funciones existentes de Netlify; las importaciones sin sesión siguen siendo **temporales** y sus cambios locales no migran automáticamente a otra cuenta.

## 3. Comparativo de ejecutivos por semanas o fechas

En la página **Comparativo de ejecutivos**, selecciona **Tipo de período**:

- **Semana laboral**: elige una semana completa de lunes a domingo, independiente del selector de la calculadora individual.
- **Rango personalizado**: selecciona día inicial y final. La aplicación considera exclusivamente registros dentro del intervalo.
- Cada semana se procesa por separado con **el motor de comisiones vigente sin modificaciones** y con su **meta semanal completa**, aunque se haya elegido una fracción de esa semana. Se aplican el escalón, Plan Cero, incidencias, recuperación y bonos por semana; solo después se suman las comisiones resultantes por ejecutivo.
- **Cumplimiento del intervalo** = suma de ventas válidas / suma de metas semanales incluidas. Una semana del rango que tenga registros de otros ejecutivos también aporta el objetivo semanal completo a un ejecutivo que aparece en el intervalo, aunque no haya vendido esa semana.
- En varios períodos, despliega el **detalle por semanas** dentro de cada fila. La meta total es de solo lectura para evitar editar varias vigencias a la vez; con una sola semana puedes editar la meta semanal en la tabla.
- PDF, PNG y CSV usan el mismo intervalo; el **CSV incluye desgloses por semana** cuando se seleccionan varias. El botón **Ver folios** abre la calculadora individual en la primera semana con registros de esa persona.

## 4. Validaciones y resguardo

- La fórmula `calculate()` y los archivos SQL/Functions de Netlify **no cambiaron**.
- No borrar XLS de PostgreSQL, no limpiar la base de datos, ni cambiar las claves existentes de ajustes.
- Ejecutar `npm run check`, `npm test` y `npm run build` antes de publicar; verificar la sincronización con sesión en un despliegue de prueba. El ZIP incluye los archivos originales completos, no únicamente un parche.

---

# Manual de usuario y administración

**Jefatura Mid Marc**  
**Versión 3.0 | 17 de noviembre de 2026**  
**Aplicación:** GitHub + Netlify Hosting + Netlify Identity + Netlify Database.  
**Alcance:** guía operativa, indicadores, comisiones, configuración, exportaciones y mantenimiento.

> **Importante:** El proyecto es una herramienta de análisis y simulación. Sus cálculos no sustituyen la validación o liquidación oficial de comisiones. Los resultados dependen de los datos importados, las metas vigentes y las incidencias registradas. No muestra ventas inexistentes ni asume que un día sin registros significa cero productividad.

## Novedades principales de Jefatura Mid Marc V3.0 — Netlify

**Esta edición se publica en GitHub + Netlify.** Conserva Netlify Identity, Netlify Database (PostgreSQL), las migraciones existentes, los datos históricos y el motor de comisiones. **No es la edición local con SQLite ni la edición Wi-Fi de Termux.**

### 1. Dashboard de Jefatura como página principal

Al iniciar, la aplicación abre **Dashboard de Jefatura**. La configuración antigua de página principal se migra a este inicio la primera vez que se lee una configuración anterior a V3.0; después, quien lo prefiera puede elegir otra portada desde **Ajustes → Secciones del menú, títulos y páginas**, guardar y sincronizar.

### 2. Semanas de trabajo de lunes a domingo

En Dashboard de Jefatura, selecciona una semana desde **Semana de trabajo (lunes a domingo)**. El control incluye la semana actual y semanas detectadas en los registros históricos. Sustituye los antiguos filtros Hoy / Mes / Rango personalizado de esa página. El filtro de supervisores continúa independiente. Las metas se evalúan según su vigencia histórica.

### 3. Logros semanales obtiene sus metas de perfiles

Se retiró por completo de la pantalla **«Objetivos semanales: cantidades y porcentajes»**. La página ahora consulta exclusivamente los **objetivos de perfiles de módulo o Jefatura vigentes para la semana**, que se editan tocando el nombre del módulo o el botón **Objetivos del módulo / Jefatura**. Los antiguos objetivos manuales de Logros semanales permanecen almacenados como respaldo para recuperación, **pero ya no se utilizan para calcular indicadores**, aunque tengan valores.

Las cantidades sin perfil vigente aparecen **sin meta**. Los porcentajes también requieren objetivo expresamente configurado en un perfil para aparecer como meta; no se convierten en una supuesta meta registrada los porcentajes predeterminados de otras áreas. Al consultar todos los módulos, se usan metas propias de Jefatura o un consolidado de los módulos con metas completas; si falta un valor, aparecerá sin meta. Esto no cambia las fórmulas de comisiones.

### 4. Menú unificado por página

El antiguo botón flotante **Filtros** y el botón flotante **Exportar** se sustituyen por un único botón **☰ Menú**, con tres acciones:

- **Filtros:** muestra los filtros secundarios de la página actual, o indica que no tiene filtros adicionales.
- **Configuración:** abre Ajustes y, cuando corresponde, sitúa el apartado de la página activa.
- **Exportar:** contiene **Descargar PDF**, **Exportar PNG** y **Exportar CSV** según las posibilidades existentes de la página. No todas las páginas admiten CSV.

Los filtros principales (por ejemplo la semana) siguen siendo visibles donde corresponde.

### 5. Descarga de PDF sin elegir manualmente el nombre

Al pulsar **Menú → Exportar → Descargar PDF** o el botón superior **Descargar PDF**, el navegador prepara y descarga un PDF con formato de hojas carta. No se abre deliberadamente la ventana de impresión. El nombre incluye **título de la página**, **módulo/ejecutivo seleccionado cuando exista** y **fecha o semana de trabajo consultada**; si una página no tiene filtro de fechas, usa la fecha del día. Ejemplo: `Logros_semanales_-_Pensiones_-_2026-11-09.pdf`.

**Ubicación:** el navegador descarga el archivo en la ubicación configurada para descargas de ese dispositivo (normalmente **Descargas**). La aplicación no puede forzar el directorio si Chrome u otro navegador tiene activada la pregunta de ubicación, bloquea descargas o aplica permisos especiales. Los PDF se construyen a partir de las vistas y lienzos existentes; algunas páginas se exportan como imagen dentro del PDF, por lo que el texto puede no ser seleccionable. No se envía el PDF a PostgreSQL ni se guarda automáticamente en Netlify.

### 6. Validación y actualización

1. Realiza respaldo de datos y ajustes. No elimines ni recrees tablas PostgreSQL existentes.
2. Reemplaza todos los archivos del repositorio por los de la V3.0.
3. Ejecuta `npm install`, `npm run check`, `npm test` y `npm run build` en tu entorno con Internet.
4. En Netlify mantén build `npm run build`, carpeta `dist`, Identity y Database, y las migraciones ya usadas por V2.7.1.
5. Antes de publicar a todos, prueba: inicio en Jefatura, cambio de semana, metas por vigencia, Logros semanales sin editor duplicado, menú de cada página, descarga PDF con nombre correcto y uso móvil.

**Pruebas realizadas al construir esta entrega:** sintaxis, regresiones de comisiones y lógica, pruebas V3.0 y generación binaria de PDF de varias páginas. **No validado en este entorno:** build completo de Vite y operaciones reales con Netlify Identity/PostgreSQL debido a falta de acceso al registro de npm; tampoco se pudo completar una navegación visual automatizada en Chromium por bloqueo administrativo de conexiones locales.

---

## Funciones incorporadas desde V2.7.1 — Solicitudes de Actualizaciones

**Ruta:** Administración → Actualizaciones. Esta página y sus solicitudes son privadas por cuenta de Netlify Identity y se guardan en una tabla separada en PostgreSQL, incluso si se deja de cargar el XLS de origen. La migración nueva `20261116190000_jefatura_v271_record_updates.sql` debe estar aplicada.

1. **Crear una solicitud.** En cualquier tabla de registros, toca un registro para abrir su ficha y usa **Solicitar actualización**. Selecciona uno o varios de los encabezados originales del archivo; puedes escribir comentarios. Al guardar se crea el folio de solicitud con fecha y hora automáticas y estado **Pendiente de actualizar**. No modifica la venta al solicitarla.
2. **Una pendiente por registro.** Si ese registro ya tiene una solicitud pendiente, al volver a usar el botón se agregan los nuevos campos y comentarios a la misma solicitud. No se cambia su fecha original de creación. Se conservan todos los campos previamente seleccionados.
3. **Consultar y filtrar.** La página muestra folio, módulo, ejecutivo, campos solicitados, fecha de creación y estado. Filtra desde la parte superior por folio, módulo, ejecutivo, estado, rango de fecha de creación y búsqueda general. El filtro **Papelera** permite recuperar solicitudes eliminadas.
4. **Ver detalles.** Toca la fila o el botón **Ver detalle** para conocer los campos solicitados, la fecha y el historial de comentarios.
5. **Editar.** **Editar** permite modificar la selección de campos, agregar un comentario y guardar. Los comentarios anteriores permanecen; no se borran. Si no está cargado el XLS, siguen disponibles los nombres de columnas capturados al crear la solicitud.
6. **Ya se actualizó.** Esta acción abre un formulario para escribir los valores definitivos de **todos los campos solicitados**. La aplicación primero guarda las correcciones del registro mediante el sistema de cambios no destructivos de XLS y espera a que se sincronicen; solo después marca la solicitud como **Actualizada**. Si el XLS que contiene el registro no está cargado, hay que importarlo antes de resolver. Los nombres de módulo y ejecutivo se eligen del catálogo activo cuando se cambian; un valor histórico puede conservarse sin modificarlo.
7. **Eliminar y restaurar.** **Eliminar** manda la solicitud a la papelera recuperable; **Restaurar** la devuelve. PostgreSQL impide restaurar una pendiente si ya existe otra pendiente para el mismo registro. No se borra el XLS ni el historial de comentarios.
8. **Recordatorios emergentes.** Los **lunes, martes y miércoles**, cada vez que se abre la aplicación y hay solicitudes pendientes, aparece una ventana emergente con el número pendiente y un acceso a la página Actualizaciones. También puede cerrarse con **Entendido**. Funciona dentro de la aplicación con sesión abierta, no como notificación del sistema Android.
9. **Campo calculado del registro.** El detalle del registro y las tablas manuales muestran **Pendiente de actualizar: Sí/No**. Este estado se deriva de las solicitudes que la cuenta tiene pendientes y no altera tarifas, incidencias ni las fórmulas de comisiones.
10. **Precaución al resolver.** Si las correcciones ya se sincronizaron pero falla la operación de cierre de la solicitud, ésta permanece pendiente hasta repetir su resolución. No se inventan actualizaciones en XLS originales. Comprueba el folio y los valores en el historial antes de volver a resolver.

**Requisito técnico:** este apartado necesita Netlify Identity, Database y la nueva migración; en modo invitado no puede crear solicitudes ni acceder a sus datos. La migración es aditiva y no elimina registros, ventas, comisiones, XLS ni incidencias.

---

## 0. Novedades vigentes de Jefatura Mid Marc V2.7

**Origen histórico:** Jefatura Mid Marc · V2.7. Se conservan las reglas y fórmulas de comisiones de V2.6.1 sin recalcular pagos históricos al actualizar.

1. **Catálogo por cuenta:** los módulos y ejecutivos conservan un identificador estable, alias de nombres, estado activo/inactivo e historial de cambios; la meta semanal del catálogo puede tener vigencias desde los lunes. Los objetivos base con fecha de vigencia tienen prioridad en los análisis; los objetivos de comisión siguen siendo editables y nunca se mezclan con tarifas. El catálogo se mantiene en `dashboard_settings` de PostgreSQL bajo la misma clave reconocida de V2.6.1.
2. **Diseño móvil:** navegación, tablas de resultados, configuración y tarjetas rediseñadas para pantallas pequeñas. Los botones existentes no desaparecen.
3. **Importación con vista previa:** antes de elegir el nombre del archivo se muestra el número de filas, muestras de registros y alertas de folios duplicados, fechas ausentes, códigos ausentes y columnas opcionales. Es un diagnóstico: no elimina automáticamente filas ni cambia reglas de pagos.
4. **Papelera de incidencias:** el botón Eliminar ahora lleva la incidencia a la papelera conservando comentarios y datos. Se puede recuperar desde Ajustes → Seguridad → Ver papelera. Una incidencia recuperada queda inactiva hasta reactivarla manualmente. Requiere ejecutar/confirmar la migración SQL V2.7.
5. **Auditoría:** ajustes e incidencias registran eventos de modificación por cuenta. Ver Ajustes → Seguridad → Consultar movimientos. Los valores completos de ajuste no se incluyen en el registro de auditoría.
6. **Sincronización segura:** las escrituras de ajustes verifican la revisión del servidor. Ante un cambio desde otro dispositivo, la app retiene los cambios pendientes y aparece «Resolver conflicto de ajustes». Antes de descartar el pendiente, exporta un respaldo JSON desde Ajustes. Nunca elijas descartar sin confirmar que no perderás información.
7. **Simulaciones adicionales:** Calculadora individual → Simulación → Comparar 3 simulaciones. Simulación actual, simulación 2 y simulación 3 usan el mismo cálculo, aplicando las cantidades adicionales que captures; no cambian los folios importados ni el escenario base.
8. **Dashboard de Jefatura:** alertas ordenadas por gravedad y resumen de atención prioritaria, con los mismos umbrales configurables. Las tarjetas compactas y sus fuentes desplegables permanecen.
9. **Ajustes:** buscador y filtro temático por Personal y módulos, Metas y comisiones, Reportes y análisis, Apariencia y navegación, Recordatorios y sistema. Esto organiza la interfaz, sin quitar controles ni cambiar sus acciones.
10. **Mantenimiento:** nuevas funcionalidades aisladas en módulos de interfaz/importación, comprobaciones automatizadas y un CHANGELOG vigente.

### Requisitos antes de publicar

- Mantener la base PostgreSQL y los archivos XLS originales. **No borrar tablas ni migrar destructivamente** datos previos.
- Aplicar o comprobar la migración `netlify/database/migrations/20261116080000_jefatura_v27_audit_trash.sql` antes de utilizar auditoría o eliminar incidencias.
- Hacer respaldo de configuraciones antes de reemplazar el repositorio. Publicar la raíz completa; el build de Netlify es `npm run build` y la carpeta publicada es `dist`.
- Verificar con una cuenta real la sincronización entre dos dispositivos, importar XLS, recuperar una incidencia, abrir el manual y comprobar las calculadoras en celular.
- **Validación local realizada:** sintaxis y pruebas automatizadas. **Sin validar:** build final de Vite y conexión real de Netlify Identity/PostgreSQL en este entorno debido a fallo al instalar dependencias.

### Notas sobre versiones anteriores del manual

Las secciones históricas a continuación explican el origen de las funciones desde V2.5. En caso de discrepancia, **esta sección 0 prevalece**: Eliminar incidencias ya no significa borrarlas definitivamente; la migración V2.7 sí es obligatoria para auditoría y papelera; y la marca visible vigente es «Jefatura Mid Marc».

---

## 1. Primer ingreso y funcionamiento básico

1. Abre la página publicada en Netlify e inicia sesión con correo y contraseña de Netlify Identity. Si no tienes cuenta, debe existir una invitación previa.
2. El navegador intenta conservar el acceso **hasta siete días desde el ingreso original**, siempre que Netlify mantenga vigente el token de renovación. Cerrar sesión finaliza inmediatamente el acceso; borrar datos del navegador o entrar desde otro dispositivo puede exigir otro ingreso.
3. Con sesión, los archivos históricos y las preferencias se guardan por cuenta. Sin sesión, la importación es temporal y no se comparte entre dispositivos.
4. Comprueba el estado de sincronización y utiliza **Sincronizar** si necesitas consultar cambios realizados en otro dispositivo.
5. En una cuenta nueva, la pantalla principal predeterminada es **Dashboard de Jefatura**. Puedes cambiarla desde Ajustes → Orden de páginas.

## 2. Menú principal

El proyecto agrupa sus pantallas en cuatro categorías con botones desplegables:

| Categoría | Páginas habituales |
|---|---|
| Análisis y resultados | Dashboard de Jefatura, Comparativa diaria, Histórico individual, Histórico por módulo, Comparativo de ejecutivos, Logros semanales, Acumulado general y Comparativa semanal |
| Comisiones | Calculadora individual y Calculadora supervisor |
| Administración | Registros manuales, Gestión de incidencias, Recordatorios y Visitas de coordinación |
| Configuración | Panel de Ajustes, organización de páginas y objetivos |

La barra de páginas puede desplazarse horizontalmente. En Ajustes puedes cambiar el orden, la categoría de una página y la página principal, sin modificar los datos.

## 3. Carga y conservación de registros

- Selecciona **Cargar XLS** y el archivo original. Se aceptan formatos admitidos por el importador: XLS, XLSX, CSV, TSV y archivos XLS-HTML compatibles.
- El sistema solicitará una **fecha identificadora por archivo**. La fecha elegida (`AAAA-MM-DD`) será el nombre visible, **pero no modificará las fechas internas de los registros**.
- Puedes importar varios archivos y asignarles fechas independientes. La base histórica se conserva mientras los archivos permanezcan guardados.
- Si eliminas un archivo, puede cambiar el resultado de los históricos y promedios. Las incidencias guardadas en la base separada por folio no se eliminan automáticamente.
- El contenido importado debe incluir campos como Módulo, Ejecutivo y Fecha. Los encabezados se normalizan mediante alias admitidos.
- Verifica si un archivo ya fue cargado antes de importarlo nuevamente; la fecha de nombre no es suficiente para decidir si dos archivos contienen exactamente los mismos registros.

**Precaución:** los reportes PDF y PNG muestran el texto **“registros manuales”**, aunque internamente el formato de entrada sea XLS u otro compatible.

## 4. Definiciones básicas de venta

| Concepto | Definición para los análisis |
|---|---|
| Registro | Solicitud incluida en el conjunto de datos del período |
| Venta válida | Registro que cumple los criterios de pago del motor de cálculo: código de tarjeta, estado pagable y sin incidencia que lo excluya |
| Venta regular | Venta válida no garantizada |
| Venta garantizada | Venta válida marcada como garantizada |
| Programa Cero | Plan Cero de una venta regular válida (se excluyen garantizadas del denominador) |
| Primera compra | Venta válida con Programa Cero **o** Plan Dental, contada una sola vez aunque tenga ambos |
| APP | Activación reconocida en el registro, teniendo en cuenta las marcas y ajustes aplicables |
| Conversión | Ventas válidas ÷ registros × 100 |

No compares la conversión de módulos si sus archivos o períodos no están igualmente actualizados.

## 5. Dashboard de Jefatura

Es la **pantalla principal** desde V3.0. Se consulta mediante un selector de **semanas completas de trabajo (lunes a domingo)**, igual que Logros semanales. Cambiar de semana actualiza los indicadores y la fecha del nombre del PDF descargado. La opción de incluir supervisores cambia el conjunto de ventas analizado, pero no reescribe sus registros.

Los indicadores superiores muestran registros, ventas válidas, cumplimiento, Calidad Total, Alcance Global, Programa Cero, APP, conversión e incidencias abiertas. La vista incluye comparativo de módulos, objetivos y su procedencia, productividad individual, calidad, tendencia, proyección, alertas y compromisos.

### Contraer y expandir el tablero

Cada apartado tiene un botón **Contraer / Expandir**. Los botones **Expandir todas** y **Contraer todas** controlan toda la página. La preferencia se conserva en los ajustes de tu cuenta. Contraer una sección **no elimina su información** ni altera su resultado o exportación.

### Procedencia de objetivos

En la **V2.5.8**, la prioridad de los análisis por módulo y semana es:

1. **Objetivos base (nuevo):** perfil del módulo, con el último objetivo vigente desde un lunes anterior o igual al de consulta. El perfil tiene prioridad sobre ajustes históricos anteriores.
2. **Metas anteriores del Dashboard de Jefatura:** excepciones semanales y metas de módulo de V2.5.7, como respaldo cuando no hay objetivo base aplicable.
3. **Metas históricas existentes:** Logros semanales, Calidad del módulo, Calculadora de supervisor y, finalmente, suma de metas individuales identificadas, únicamente como respaldo del análisis cuando esté habilitado. La información antigua no se migra destructivamente.
4. **Sin objetivo:** si no existe valor verificable, aparece “—”; no se fabrican porcentajes. Un cero explícito significa meta no positiva para el cálculo de porcentajes.

**Para el consolidado de Jefatura:** se usa primero su meta manual vigente en Objetivos base. Si no existe, se suman las metas vigentes de todos los módulos conocidos. Si falta alguna, el consolidado no se calcula parcialmente. La fuente se muestra en el tablero.

**Excepciones manuales de históricos:** los objetivos explícitos que hayas editado para un día, semana o mes siguen teniendo prioridad sobre el cálculo automático del período.

Las metas específicas de Jefatura son exclusivas de sus análisis. **No alteran los objetivos, pagos ni tarifas de la Calculadora de supervisor o de colaboradores.** El tablero muestra la fuente del objetivo en las tarjetas plegables de cada módulo y en los recuadros de proyección.

**Aclaración:** como respaldo, una suma automática de metas individuales puede ser incompleta si no todos los ejecutivos figuran en los registros de la semana. Para medición administrativa, es preferible establecer una meta propia de Jefatura para cada módulo.

### Objetivos por período

Los objetivos se registran en unidades **semanales**. Cuando eliges un día, mes o intervalo, se prorratean a razón de una séptima parte del objetivo de cada semana por cada día natural abarcado. Un período que toca varias semanas puede mezclar fuentes; el tablero identificará ese caso como procedencia compuesta.

Si falta el objetivo de algún día necesario del período, se muestra **sin objetivo consolidado**. Las ventas reales siguen visibles.

## 6. Fórmulas de proyección

**Proyección lineal (predeterminada):**

`Ventas proyectadas = Ventas válidas acumuladas desde el lunes hasta hoy ÷ días naturales transcurridos desde el lunes × 7`

`Cumplimiento proyectado (%) = Ventas proyectadas ÷ objetivo semanal × 100`

`Ventas diarias necesarias = techo((objetivo semanal − ventas acumuladas hasta hoy) ÷ días naturales restantes)`

**Ejemplo:** si el jueves llevas 12 ventas y el objetivo es 30, se proyectan `12 ÷ 4 × 7 = 21 ventas`, es decir **70%**. Con tres días restantes, faltan 18 ventas: **6 por día**.

**Proyección ponderada:** permite asignar un peso a cada día de lunes a domingo. La fórmula es:

`Ventas proyectadas = Ventas acumuladas hasta hoy × (suma de los siete pesos ÷ suma de pesos desde el lunes hasta hoy)`

Si asignas pesos `[1,1,1,1,1,2,2]`, sábado y domingo pesan el doble. Estos pesos representan una **hipótesis ajustable**, no una estimación automática basada en asistencia. Con todos los pesos en `1`, ambas proyecciones son equivalentes.

La proyección solo se habilita para la **semana actual completa (lunes–domingo)** cuando existe objetivo semanal verificable. No extrapola semanas anteriores ni períodos personalizados. Las ventas con fecha posterior a hoy no se incorporan anticipadamente al cálculo proyectado. No considera jornadas trabajadas ni horarios de cierre: un jueves a medio día sigue contándose como cuarto día.

## 7. Ajustes: Objetivos base, proyecciones de Jefatura y respaldo

La configuración principal está ahora en **Ajustes → Objetivos base**. El apartado anterior **Proyecciones y metas anteriores de Jefatura · respaldo** mantiene la compatibilidad con las metas de V2.5.7 y los controles de proyección. Para las metas de nuevos períodos utiliza preferentemente los perfiles de Objetivos base.

En el apartado anterior, elige el módulo y la semana operativa. Elige el módulo y la semana operativa. Verás una tabla con dos columnas editables de objetivos:

- **Meta base del módulo:** aplicable a todas las semanas que no tengan una excepción.
- **Solo semana elegida:** excepción puntual que tiene prioridad sobre la meta base.

En **Objetivos base V2.5.9**, únicamente **Trámites y Ventas totales** se capturan como cantidades semanales. Regulares, Garantizadas, Dental, Programa Cero, APP, Primera compra y Calidad Total son **porcentajes**. El respaldo anterior solo conserva edición de cantidades para Trámites y Ventas. Una meta de 0 no permite calcular un porcentaje de logro positivo.

Utiliza **Guardar metas del módulo** para conservar esos cambios. Los botones para quitar metas semanales o metas base restauran la fuente de menor prioridad; no borran registros.

En el mismo apartado puedes modificar el modo de proyección, los siete pesos de los días, la política de herencia de objetivos, la alerta de calidad, el umbral de logro y si quieres recibir alertas por otros objetivos operativos. Pulsa **Guardar proyección y alertas**.

### Otros parámetros de control

En **Ajustes → Dashboard de Jefatura** puedes cambiar el período inicial, la participación de supervisores, el umbral de conversión, el mínimo de cumplimiento proyectado que genera alerta, los días de antigüedad de datos, la cantidad de colaboradores del ranking, el contenido de PDF/PNG y los colores de presentación.

Los porcentajes requeridos para **calidades individuales** se administran en **Ajustes → Porcentajes requeridos y límites de calidad**. Cambiarlos puede afectar otros análisis. Las metas operativas de Jefatura distinguen cantidades y porcentajes; Objetivos base determina las tasas requeridas para análisis, sin modificar los ajustes de comisiones.

## 8. Cómo calcular la calidad

Los cuatro factores que participan son **Cumplimiento, Primera Compra, Programa Cero y Activaciones APP**.

`Cumplimiento real = ventas válidas ÷ objetivo de ventas × 100`

`Primera Compra real = ventas con P0 o Dental ÷ ventas válidas × 100`

`P0 real = planes cero de regulares ÷ ventas regulares × 100`

`APP real = activaciones ÷ ventas válidas × 100`

Cada calidad individual = `alcance real ÷ porcentaje requerido × 100`. El mínimo predeterminado es **60% sobre la calidad calculada**; un valor inferior se convierte en 0. Cumplimiento y P0 no están topados al 100%; Primera Compra y APP sí lo están.

`Calidad Total = min(100, (Cumplimiento + Primera Compra + P0 + APP) ÷ 4)`

`Alcance Global = (Cumplimiento + Primera Compra + P0 + APP + Calidad Total) ÷ 5`

El Alcance Global **no tiene tope de 100%**. Si falta un objetivo indispensable, el tablero evita fabricar una calidad consolidada. Los resultados usan las reglas activas configuradas en la cuenta.

## 9. Históricos individual y por módulo

- **Histórico individual:** selecciona un colaborador, con opción de filtrar por módulo, fechas y vista diaria/semanal/mensual. Conserva su trayectoria entre módulos si no aplicas el filtro.
- **Histórico por módulo:** consolida a todos los colaboradores del módulo elegido, con opción de incluir o excluir supervisores.
- Ambos muestran registros, ventas, regulares, garantizadas, P0, Dental, APP, Calidad Total y Alcance Global.
- Los promedios utilizan **solo períodos con registros disponibles**. Por ejemplo, para domingos se divide entre domingos con datos, no entre todos los domingos del calendario.
- Calidad Total y Alcance Global se **recalculan** desde cantidades y objetivos acumulados, no se promedian porcentajes ya calculados.
- Los objetivos de día y mes se pueden editar directamente en esas pantallas; sus preferencias son independientes de las metas del Dashboard de Jefatura.
- Exportación en PDF carta o PNG, con filtros y columnas según los ajustes de cada histórico.

## 10. Comparativas y Logros semanales

**Comparativa diaria:** muestra hoy frente a ayer o dos fechas elegidas, para módulos y ejecutivos. En su menú flotante Exportar está **Copiar para WhatsApp**: reproduce la fila TOTAL de la tabla de módulos, con siete factores, abreviaturas de ocho caracteres y sus variaciones. Las fechas del título son dinámicas.

**Comparativo de ejecutivos:** permite evaluar diferencias de desempeño y avances semanales por persona.

**Comparativa semanal:** compara semanas operativas lunes-domingo, sus objetivos y variaciones de resultados.

**Logros semanales:** permite fijar metas para una semana y módulo; su exportación administrativa PDF/PNG produce el reporte **Seguimiento administrativo semanal**, con indicadores, dos tablas de folios, áreas de oportunidad, espacios para comentarios y plan manuscrito, y firmas. El PDF se diseña para carta y crea hojas adicionales si existen más folios de los que caben.

**Acumulado general:** consolida resultados de las selecciones históricas de la cuenta.

## 11. Calculadora individual

La Calculadora individual contiene **Escenario base** y **Simulación**; los datos pueden partir de registros importados y admiten ajustes manuales de escenario. Las tarifas se determinan por los escalones de cumplimiento configurados. Se suman las comisiones por ventas y complementos, se añade el bono aplicable y se descuentan los importes de P0, incidencias y recuperaciones cuando corresponda.

El **Bono por dinámica** se configura como monto fijo por venta marcada. Se agrega al **final** del cálculo, fuera de la base de las penalizaciones. Los folios no pagables o excluidos por incidencia no generan dicho bono.

La simulación no implica que el monto será efectivamente pagado. Confirma las tarifas y topes en Ajustes antes de comparar resultados.

## 12. Calculadora supervisor

La fórmula básica del bono del módulo es:

`Bono calculado = Bono base × (Alcance Global ÷ 100) × min(1, Cumplimiento real de ventas ÷ 100)`

Si el cumplimiento llega a 100% o más, no existe otro multiplicador por ventas; el Alcance Global sí puede superar 100%.

Después se aplica el bono **único** por sobrecumplimiento del tramo más alto alcanzado (por defecto: 110%, 115% y 120%, con importes editables) y los descuentos previstos. Las ventas propias del supervisor se calculan con su propio escalón y se agregan al total según las reglas activas. Existe un interruptor para incluir o excluir esas ventas en el cumplimiento del módulo sin alterar la tarifa propia.

El Bono por dinámica de ventas propias también se suma al final cuando corresponda. Los mínimos de calidad, tarifas, bonos y penalizaciones son configurables en **Ajustes → Calculadora de supervisor**.

## 13. Gestión de incidencias

Las incidencias están vinculadas por **folio y cuenta**, en una base independiente de los archivos importados. La página de administración permite buscar y registrar folios, mantener comentarios históricos, señalar **Resuelta/Pendiente**, y activar o desactivar **Incidencia activa**.

- **Resuelta** es un estado de seguimiento administrativo. No elimina necesariamente la exclusión de comisión.
- **Incidencia activa** es la marca que determina si el folio sigue excluido de los cálculos pagables.
- Un folio que reaparece en un archivo nuevo recupera su marca cuando coincide la identificación normalizada del folio.
- Para comprobar una migración desde versiones anteriores, conserva los archivos originales hasta asegurarte de que cada incidencia relevante está registrada con su folio.

## 14. Visitas de coordinación y compromisos

La página Visitas de coordinación integra información de registros y exporta acuses de supervisión. El Dashboard de Jefatura incorpora un control separado de compromisos: módulo, responsable, fecha límite, estado y notas. Esos compromisos se guardan por cuenta en Ajustes; **no se comparten automáticamente entre cuentas**.

Los indicadores operativos no deben usarse como sustituto de evidencia, asistencia, auditoría de personal o evaluación disciplinaria sin comprobar la fuente de cada evento.

## 15. Exportación, impresión y privacidad

- El menú flotante de exportación concentra las opciones disponibles según la página: PDF, PNG, CSV donde aplique, o copiar WhatsApp en Comparativa diaria.
- Para PDF desde el navegador, elige **Carta** y revisa orientación y márgenes propios del reporte. Desactiva encabezados y pies añadidos por el navegador cuando el formato lo requiera.
- Las páginas largas pueden distribuirse en varias hojas PNG/PDF. Revisa que los campos no se corten antes de entregar reportes oficiales.
- Las cuentas de Netlify conservan archivos y preferencias de manera separada por usuario. No debes compartir credenciales ni publicar archivos de clientes en repositorios públicos.
- El almacenamiento del navegador no debe tratarse como copia de seguridad de los datos de la nube.

## 16. Publicación y mantenimiento técnico

El ZIP contiene `index.html`, `src/`, `public/`, `netlify/`, `package.json`, `README.md` y los archivos de pruebas. Para actualizar un proyecto existente:

```bash
cd ~/marc-mid
# Descomprime el ZIP completo en esta carpeta y reemplaza los archivos existentes.
npm run check
npm test
git add -A
git commit -m "INVEX V2.5.7 objetivos y manual"
git push origin HEAD
```

La publicación de Netlify utiliza `npm run build` y directorio de salida `dist`. No basta con reemplazar solamente `index.html`; también debes publicar los archivos de `src`, `public` y `netlify` cuando corresponda. Los objetivos reutilizan las claves existentes. V2.7 sí necesita la migración SQL adicional para la auditoría y la papelera de incidencias.

Antes de retirar una versión anterior, confirma en la web publicada que puedes iniciar sesión, cargar un archivo de prueba, comprobar objetivos, abrir incidencias, exportar PDF y PNG y sincronizar un ajuste desde otro dispositivo.

## 17. Problemas frecuentes

| Situación | Verificación recomendada |
|---|---|
| Me pide iniciar sesión otra vez | Confirma los siete días, cookies habilitadas y estado de Netlify Identity; la duración real también depende del servidor |
| La calidad o cumplimiento aparecen «—» | Falta una meta necesaria, no hay denominador válido o está incompleta la información de la semana |
| Proyección no disponible | La vista no está en la semana actual o falta objetivo semanal completo |
| Un objetivo que edité no se refleja | Guarda el botón correspondiente, comprueba módulo y semana, y verifica la sincronización |
| El PDF muestra datos distintos a los esperados | Revisa filtros, período, inclusión de supervisores, incidencias y objetivos de origen |
| No veo un archivo histórico | Comprueba sesión, selección de archivos guardados y sincronización de la cuenta |
| Una incidencia reaparece en un archivo nuevo | Se conserva por folio; revisa su estado Activa/Resuelta en Gestión de incidencias |
| Los botones de navegación cambiaron | Revisa Ajustes → Orden de páginas y página principal |
| El despliegue Netlify falla | Revisa el log del build, las dependencias, Netlify Functions y las migraciones existentes |

## 18. Checklist semanal recomendado para Jefatura

1. **Lunes:** actualizar archivos de registros manuales de todos los módulos, revisar fechas y sincronización.
2. Confirmar objetivos semanales oficiales en **Ajustes → Objetivos base**, seleccionando cada perfil.
3. Revisar el Dashboard por módulo y verificar **fuente del objetivo**, conversión, calidad y proyección.
4. Identificar alertas que requieren revisión, distinguir datos desactualizados de resultados realmente bajos.
5. Registrar compromisos con responsable, fecha y observaciones de seguimiento.
6. Revisar incidencias activas y resueltas, corroborar cambios por folio.
7. Exportar reportes y comprobar su legibilidad antes de compartirlos.
8. Cerrar la semana contrastando las ventas reales con la proyección y ajustar pesos o metas únicamente con evidencia.

---

*Documento de consulta operativo para INVEX V2.5.7. La versión publicada en Netlify es la referencia de las configuraciones realmente vigentes en la cuenta.*


---

## 19. V2.5.8 — Objetivos base: guía operativa (ajustada en V2.5.9)

### Objetivo y alcance

Esta versión incluye un **almacén de metas separado de los archivos de registros**. Se utiliza exclusivamente en **Dashboard de Jefatura, Histórico individual, Histórico por módulo, Comparativa diaria, Acumulado general, Comparativa semanal y Logros semanales** cuando necesitan un objetivo. Los reportes exportados usan los mismos cálculos de la página.

**Nunca** sustituye los objetivos que intervienen en pagos de las calculadoras de colaboradores o supervisores. Se conservan sus configuraciones de comisiones, tarifas, bonos por sobrecumplimiento y dinámicas.

### Abrir, crear y modificar perfiles

1. Entra a **Ajustes → Objetivos base**.
2. Aparecen tres grupos: **Jefatura**, **Módulos** y **Ejecutivos**. Los nombres se detectan de los registros disponibles y de los perfiles previamente guardados; no existe un límite fijo de tres módulos.
3. Toca un nombre para abrir su perfil en una ventana. Puedes crear un módulo o ejecutivo manualmente, incluso antes de que tenga registros o después de haber eliminado los archivos que lo contenían.
4. Elige **Vigente desde el lunes**. El día elegido se normaliza al lunes de esa semana.
5. Captura **Trámites y Ventas totales como cantidades enteras**. Captura **Regulares, Garantizadas, Dental, Programa Cero, APP, Primera compra y Calidad Total en porcentajes de 0 a 100**. Los porcentajes predeterminados aparecen en pantalla; los campos vacíos de Jefatura permiten heredar el valor calculado de módulos. No se suman porcentajes.
6. Pulsa **Guardar objetivos y vigencia**. Se conserva el historial anterior. Si vuelves a guardar sobre el mismo lunes, reemplazas la versión correspondiente a ese lunes, sin modificar las otras vigencias.
7. Cuando hay sesión, el proyecto sincroniza este almacén de metas por cuenta, a través de los Ajustes de Netlify Database. Espera que indique que la sincronización concluyó antes de cerrar la página.

### Metas de Jefatura: suma o sustitución manual

- Si Jefatura no define una meta propia, **las cantidades se suman** entre módulos; **los porcentajes se consolidan ponderándolos por las metas de ventas de los módulos** (si todos tienen igual porcentaje, ese mismo se conserva).
- En el editor de Jefatura, un campo vacío significa **usar el consolidado automático o el objetivo vigente anterior**. El texto de ejemplo del campo ayuda a identificar el valor heredado; no se fija el resultado automáticamente cuando guardas otro indicador.
- Si escribes un valor en una métrica, ese objetivo manual de Jefatura sustituye únicamente el consolidado de esa métrica desde la fecha elegida, respetando unidades y porcentajes.
- Si falta una meta de cantidad, o si los porcentajes son distintos y faltan pesos de ventas para consolidarlos, el objetivo automático aparece como incompleto; no se omite silenciosamente ese módulo. Puedes configurar la meta pendiente o definir un objetivo explícito de Jefatura.
- Los perfiles que ya guardaste continúan siendo módulos conocidos aunque hayas eliminado sus registros. Revisa las metas de módulos inactivos cuando necesites que el consolidado represente únicamente la operación activa; una meta manual de Jefatura es la forma de ajustar el total sin borrar el historial.

### Vigencia y períodos

El sistema utiliza objetivos con vigencia histórica **desde el lunes seleccionado**. Para resolver un objetivo consulta la última versión anterior o igual a la semana de análisis. Las metas que no se vuelven a especificar heredan la última versión vigente de ese indicador.

- **Día:** objetivo semanal de la semana que contiene ese día ÷ 7.
- **Semana:** objetivo semanal vigente para ese lunes.
- **Mes, para cantidades:** suma de 1/7 del objetivo semanal de cada día natural del mes, permitiendo cambios de vigencia. **Para porcentajes**, se aplica el promedio temporal de las tasas vigentes, sin sumarlas ni dividirlas entre siete.
- **Jefatura o módulo:** la calidad se recalcula con ventas y objetivos acumulados; no se promedian sus porcentajes.
- **Histórico individual:** si cambias de módulo, el objetivo de tu perfil individual sigue asociado a tu nombre normalizado. Si se editaron manualmente objetivos por período en la página histórica, esos valores prevalecen para dicho período.

### Acceso rápido desde los análisis

El nombre del módulo o colaborador es un acceso al editor de objetivos en tablas del Dashboard de Jefatura, Comparativa diaria, Acumulado general y Comparativa semanal. Histórico individual e Histórico por módulo tienen botones de **Objetivos** junto al selector. Logros semanales incluye un acceso al módulo seleccionado o a Jefatura cuando consultas todos los módulos.

### Persistencia sin archivos

La clave sincronizable nueva es `wmSamsBaseGoalsV258`. El navegador conserva una copia local y Netlify guarda su valor en la tabla de ajustes existente (`dashboard_settings`, con `owner_id` por cuenta). No depende de `dashboard_reports`; al borrar archivos siguen apareciendo los perfiles guardados y sus vigencias. **Para objetivos no se requiere migración SQL; la auditoría y la papelera V2.7 sí necesitan su migración.**

En modo sin sesión, la persistencia queda en el navegador local y no se comparte automáticamente con otros dispositivos. Para evitar pérdida de ajustes, inicia sesión y verifica que la sincronización haya concluido.

### Ejemplo de vigencias

Pensiones: objetivo Ventas **25** desde el lunes **02/11/2026**; Ventas **35** desde el lunes **16/11/2026**. El análisis del 9 al 15 de noviembre usa 25. El del 16 al 22 usa 35; ninguno cambia retroactivamente. Otros indicadores no modificados (como Registros) mantienen su propia vigencia anterior.

## 20. V2.5.8 — Optimización de rendimiento

- **Caché de datos combinados:** `combinedArchiveData()` reutiliza resultados normalizados cuando se trabaja con las mismas referencias de archivos; se invalidan al sustituirlos, eliminarlos o cambiar la selección de reportes.
- **Renderizado por página activa:** cuando cambia la selección del historial, solo se vuelven a pintar las tablas/gráficas de la página visible; las restantes se actualizan cuando se abren. Se mantienen sus selectores y configuraciones.
- **Dashboard consolidado:** la agrupación de registros por módulo y el hallazgo de la fecha más reciente se hacen en una sola pasada, en lugar de filtrar todos los registros repetidamente por módulo.
- **Objetivos de Jefatura:** se reutilizan cálculos por combinación semana-módulo-indicador dentro de cada consulta; el listado de módulos también se memoriza mientras no cambien las fuentes.
- Estas mejoras reducen operaciones redundantes, pero no constituyen una medición garantizada de tiempos. Deben validarse en navegador con el historial real del usuario.

## 21. V2.5.8 — Guía técnica para futuras ediciones

| Componente | Archivo o clave | Propósito |
|---|---|---|
| Motor de perfiles/fechas | `src/base-goals.js` | Validación, normalización de nombres, upsert, vigencia histórica, consolidado de Jefatura |
| UI y conexión a históricos | `src/legacy-app.js` | Listas dinámicas, editor modal, caché, selección de objetivos antes de respaldos existentes |
| Dashboard | `src/leadership-dashboard.js` | Consolidación, proyección, fuentes, calidad y alertas |
| Permiso de ajustes remotos | `netlify/functions/settings.js` | Incluir `wmSamsBaseGoalsV258` en `ALLOWED` |
| Sincronización por cuenta | `src/cloud-boot.js` | Incluir `wmSamsBaseGoalsV258` en `KEYS`; hidratación y escritura diferida |
| Pruebas nuevas | `tests/validate-v258.mjs` | Vigencias, suma incompleta, objetivos propios, normalización y compatibilidad |
| Manual PDF público | `public/MANUAL_INVEX_V258.pdf` | Disponible desde el botón Manual del proyecto |

Estructura de almacenamiento: `{version:1, profiles:{"module|NOMBRE_NORMALIZADO":{type:"module",name:"Nombre",versions:[{from:"AAAA-MM-DD",goals:{sales:25,...}}]},"executive|...":{...},"headquarters|JEFATURA":{...}}}`. Las fechas `from` son lunes ISO. Los ocho nombres de indicador son `sales`, `records`, `regular`, `guaranteed`, `dental`, `p0`, `apps`, `purchase`.

**Reglas de mantenimiento:**

- No cambiar la lógica de comisiones al trabajar sobre Objetivos base.
- Para añadir un indicador, actualizar `BASE_METRICS`, el editor HTML, las funciones que consumen metas y las pruebas; versionar la estructura si cambia el significado de los datos.
- Conservar la semántica de objetivo sin dato (`null`) diferente de meta explícita 0. No presentar porcentajes basados en metas incompletas.
- Evitar recalcular todos los históricos en cada clic. Usar los datos normalizados disponibles y actualizar solo la pantalla visible.
- Conservar los demás ajustes antiguos como respaldo; no borrar ni migrar destructivamente datos históricos de metas sin autorización.
- Ejecutar `npm run check && npm test` y compilar en Netlify. Verificar posteriormente el editor en móvil, la cuenta autenticada, la persistencia entre dispositivos y los reportes PDF/PNG.

### Pruebas de aceptación al publicar

1. Crea un módulo nuevo que aún no exista en archivos, guarda metas y comprueba que permanezca tras cerrar/abrir sesión.
2. Crea un objetivo con vigencia antigua y otro futuro; compara un histórico previo y otro posterior a la nueva fecha.
3. Registra metas de cuatro o más módulos, verifica su suma y un objetivo manual de Jefatura.
4. Elimina temporalmente un archivo de pruebas (nunca el único original) y comprueba que el perfil y sus objetivos siguen visibles.
5. Comprueba que tocar nombres y botones de Objetivos abra el perfil correcto desde los análisis.
6. Confirma que las calculadoras de comisiones conservan sus metas y resultados anteriores.
7. Prueba la velocidad al cambiar de categorías con un historial extenso. Verifica que PDF/PNG no omitan objetivos ni sobrepongan textos.

**Nota de verificación:** se probaron el motor de metas y los tests anteriores; la compilación de producción, los eventos completos del navegador y la sincronización real entre dispositivos se deben confirmar en el despliegue de Netlify.


## 22. V2.5.9 — Objetivos base en cantidades y porcentajes

**Esta sección sustituye cualquier indicación anterior del manual que tratara los ocho objetivos como cantidades.** El almacenamiento `wmSamsBaseGoalsV258` conserva su nombre técnico para mantener la sincronización. El nuevo esquema es `version: 2`.

| Indicador | Unidad en el perfil | Meta inicial | Alcance real / denominador |
|---|---|---|---|
| Trámites | Cantidad semanal | Sin meta (capturar) | Trámites ÷ objetivo de trámites |
| Ventas totales | Cantidad semanal | Sin meta (capturar) | Ventas válidas ÷ objetivo de ventas |
| Ventas regulares | Porcentaje | 100% | Regulares ÷ ventas válidas |
| Ventas garantizadas | Porcentaje | 100% | Garantizadas ÷ ventas válidas |
| Plan Dental | Porcentaje | 90% | Ventas con Dental ÷ ventas válidas |
| Programa Cero | Porcentaje | 30% | Planes Cero en regulares ÷ ventas regulares |
| Activaciones APP | Porcentaje | 90% | Activaciones válidas ÷ ventas válidas |
| Primera compra | Porcentaje | 90% | Ventas con Dental o P0 ÷ ventas válidas (sin duplicados) |
| Calidad Total | Porcentaje | 90% | Calidad Total calculada por el motor de cuatro factores |

**Aclaración sobre Regulares y Garantizadas:** los dos objetivos predeterminados son 100% de las ventas válidas por separado, según la configuración solicitada. Como son categorías excluyentes, **no pueden cumplirse ambos simultáneamente** cuando existan ventas de ambos tipos. Puedes editar esos porcentajes en cada perfil para ajustarlos a tu criterio operativo.

**Cálculo de progreso del indicador porcentual:** `% logro = (alcance real % ÷ meta %)*100`. Las tasas no se suman como cantidades y una base sin ventas válidas se muestra como `—`. Programa Cero utiliza únicamente ventas regulares como denominador.

**Vigencias y migración:** al detectar perfiles antiguos de V2.5.8 (esquema 1), conserva las cantidades históricas de Trámites y Ventas. No convierte automáticamente las viejas cantidades de Dental, P0 y otras métricas en porcentajes; esas metas pasan a los porcentajes predeterminados hasta que se definan tasas nuevas. Las versiones históricas de ventas y trámites siguen vigentes. No se modifican las comisiones.

**Jefatura:** sin valor manual propio, las cantidades se suman entre módulos. Las tasas diferentes se promedian ponderadas por objetivos de ventas de cada módulo; si no se puede ponderar correctamente, el sistema indica que faltan metas.

**Históricos y Dashboard:** usan las tasas vigentes del período. Las metas de conteo se prorratean entre días; las tasas porcentuales se promedian entre días del rango, nunca se prorratean. La calidad de los análisis puede cambiar al editar las tasas operativas; las liquidaciones de comisiones permanecen aisladas.

**Diseño del Resumen general:** nueve tarjetas en una cuadrícula de cinco columnas, ocupando solo dos filas. En pantallas angostas, las columnas pueden desplazarse horizontalmente para conservar dos filas y facilitar la lectura.


## 23. V2.6.0 — Filtros, registros y acciones múltiples

**Esta sección describe las funciones nuevas y prevalece sobre indicaciones anteriores de ubicación de filtros.** La V2.6.0 parte de la V2.5.9 y conserva intactas las fórmulas de comisiones y las metas históricas.

### 23.1 Filtros primarios y secundarios

- Los filtros principales de **fecha, semana, módulo y ejecutivo** permanecen a la vista en sus páginas.
- Los controles secundarios (incluir supervisores, ordenamiento, opciones de validación, búsqueda específica, día de la semana y condiciones de la tabla) se consultan en el botón flotante **Filtros**.
- El menú muestra solo los controles aplicables a la página abierta. Los filtros trabajan con los mismos elementos que antes y continúan modificando los resultados y exportaciones de esa consulta.
- En Calculadora individual, las opciones de columnas y filtros de tabla se organizan entre **Filtros** y **Ajustes → Tabla de folios**. La configuración de columnas visibles permanece en Ajustes.
- El botón flotante **Exportar** conserva PDF, PNG, CSV según la página; en Comparativa diaria agrega **Copiar para WhatsApp**.
- No confundir los filtros visuales con las metas o con la marca de incidencia: estas últimas sí pueden afectar los cálculos.

### 23.2 Secciones plegables

Los apartados que ya tenían controles de plegado conservan su funcionamiento. En comparativos, históricos, registros, incidencias y visitas se añadieron controles de **Mostrar / ocultar** para las secciones relevantes. Contraer una sección no elimina datos, no cambia filtros ni modifica reportes.

### 23.3 Buscar un folio desde la barra superior

A la derecha de **Cargar XLS** aparece el buscador de folios. Introduce al menos dos caracteres. La búsqueda consulta los registros de los archivos disponibles en la cuenta; muestra coincidencias y permite abrir la ficha correspondiente. También puede ofrecer restaurar registros ocultados anteriormente. El buscador no requiere que cambies de página.

### 23.4 Ficha de registro — tocar cualquier fila de ventas

Al tocar una fila de ventas en Registros manuales, Calculadora individual, Logros semanales o los folios de Supervisor, se abre una ficha con:

1. **Editar:** modifica fecha, folio, módulo, ejecutivo, código, estado, Garantizada, Plan Dental y Programa Cero. Los campos se validan y se almacenan como correcciones, no como cambios directos sobre el archivo importado.
2. **Copiar datos visibles:** copia al portapapeles los campos mostrados en esa tabla. Desde la búsqueda global copia los campos básicos disponibles en la ficha.
3. **Eliminar:** oculta el registro de consultas, métricas y exportaciones. **No lo borra del XLS original**. La ficha incluye **Registros eliminados → Restaurar**.
4. **Crear / ir a Gestión de incidencia:** abre la página de incidencias con el folio y los datos disponibles o su historial existente. Guardar la incidencia permanente requiere sesión iniciada.

Las casillas de APP, incidencia y Bono por dinámica siguen funcionando independientemente de la ficha; tocar directamente una casilla no abre la ventana de acciones.

### 23.5 Edición múltiple

En las tablas con casillas de selección, marca los registros deseados. Aparecerá una barra inferior con **Editar seleccionados**. Selecciona un campo y el valor que deseas aplicar a todos los marcados. Es posible modificar estado, tipo de venta, Dental, P0, módulo, ejecutivo, código, APP y Bono por dinámica. El límite de seguridad es de **500 registros por operación**.

La edición múltiple realiza **un cambio de campo por operación**. Si deseas cambiar dos campos, vuelve a seleccionar los registros y repite el proceso. El registro de incidencia, con comentarios y resolución, sigue gestionándose individualmente en la base independiente de incidencias.

### 23.6 Conservación y sincronización de correcciones

- Al trabajar con sesión, las correcciones se conservan por cuenta mediante Netlify Database, usando la clave de Ajustes `wmSamsRecordEditsV260` y el mecanismo de sincronización ya existente.
- Los archivos fuente siguen almacenados sin modificaciones; las correcciones se aplican a los registros normalizados al generar indicadores, comparativos, cálculos y reportes.
- Cuando el registro tiene folio, la corrección se identifica a partir de ese folio, por lo que puede volver a aplicarse si sustituyes un archivo y el folio continúa siendo el mismo. **Los folios deben ser únicos**: registros duplicados con el mismo folio comparten corrección.
- Sin folio, la identificación utiliza una huella de los datos de origen y puede dejar de coincidir si se cambia sustancialmente el archivo.
- **La eliminación es reversible**, incluso después de volver a cargar un archivo que contenga el mismo folio.
- Sin sesión, las modificaciones son únicamente locales y podrían perderse; no garantices su conservación entre dispositivos.
- **No** es una función de escritura de vuelta a los archivos XLS ni sustituye la fuente de datos de Netlify. Para compartir un archivo ya corregido fuera de la aplicación es necesario exportar el reporte correspondiente.

### 23.7 Comparativa diaria — WhatsApp

El reporte copiado mantiene seis factores en un bloque monoespaciado con exactamente **dos espacios entre nombre, cantidad y variación**. Después de cerrar ese bloque, queda un renglón en blanco y el resultado de **Calidad** aparece fuera del monoespaciado. Este es un ejemplo ilustrativo del mensaje completo para pegar en WhatsApp:

~~~text
*Reporte general de hoy versus ayer.*

```
Regist.  20  (+2)
Ventas  15  (+3)
Regul.  10  (-3)
Garant.  2  (+2)
P. Cero  4  (0)
Dental  8  (+1)
```

Calidad  76.04%  (-28.45 pp)
~~~

**El reporte real se calcula con las fechas y datos de la tabla Por módulo.** Los números anteriores son ilustrativos.

### 23.8 Dashboard de Jefatura — tabla de objetivos

El apartado **Objetivos operativos y su origen** tiene seis columnas: **Módulo, Indicador, Objetivo, Alcance logrado, % cumplimiento y Origen del objetivo**. El encabezado no modifica las fuentes ni las fórmulas de las metas.

### 23.9 Cambios de interfaz adicionales

El botón **Ajustes** fue retirado de la barra superior junto a **Manual del proyecto**. Los ajustes siguen accesibles desde la categoría **Configuración** y desde accesos contextuales existentes. El menú de exportación continúa independiente del de filtros.

### 23.10 Información técnica para futuras modificaciones

| Componente | Archivo / clave | Observaciones |
|---|---|---|
| Ficha, edición, selección y buscador | `src/legacy-app.js` | `initRecordManagement`, `openRecordAction`, `saveRecordChange`, `recordEditKey`, `refreshAfterRecordChange` |
| Funciones puras de correcciones | `src/record-overrides.js` | `cleanRecordEdits`, `overlayRecord`, `validateRecordFields`; mapa de campos admitidos |
| Menú de filtros | `src/legacy-app.js` | `FILTER_MOVES`, `initFloatingFilters`; mueve controles originales, NO crea filtros paralelos |
| Secciones plegables | `src/legacy-app.js` | `initGlobalCollapses`; respetar los `details` existentes |
| Interfaz de controles y ventanas | `index.html` | `floatingFilters`, `globalFolioSearch`, `recordActionOverlay`, `bulkRecordBar` |
| WhatsApp | `src/daily-whatsapp-report.js` | El séptimo factor, Calidad, está fuera del bloque monoespaciado |
| Sincronización del editor | `src/cloud-boot.js` | `KEYS` incluye `wmSamsRecordEditsV260` |
| Validación del servidor | `netlify/functions/settings.js` | `ALLOWED` incluye la misma clave |
| Pruebas | `tests/validate-v260.mjs` | Cobertura de correcciones, borrado reversible, sintaxis y formato WhatsApp |

**Advertencias de ingeniería:**

- No mutar directamente `report.rows` importadas. Las correcciones se aplican después de combinar y deduplicar, mediante `overlayRecord`. Vaciar `combinedArchiveCache` al guardar.
- El identificador de corrección por folio es deliberadamente independiente del archivo físico. Verificar folios duplicados entre módulos antes de realizar ediciones masivas.
- `wmSamsRecordEditsV260` es una configuración por cuenta, sujeta a límites de tamaño y permisos de Netlify; no almacena versiones completas de cada XLS. Revisar el tamaño si se prevén miles de correcciones.
- La eliminación lógica puede revertirse desde la lista de registros eliminados. No se borran archivos ni incidencias permanentes.
- Para nuevos controles de filtros, actualizar `FILTER_MOVES` sin duplicar IDs ni crear manejadores inconsistentes.
- Verificar en navegador móvil el área flotante, la búsqueda, la edición de 1/50/500 filas y los casos sin folio. No se pudo completar una prueba automatizada de Chromium en el entorno de generación.

**Pruebas de aceptación recomendadas en Netlify:** iniciar sesión; cargar registros; buscar un folio; editar Dental; comprobar histórico/comisión correspondiente; editar varios; cerrar sesión/volver; eliminar y restaurar; abrir incidencia; verificar PDF/PNG; comprobar WhatsApp; cambiar filtros y contraer secciones; comprobar persistencia entre dos dispositivos.

---

## 24. Novedades V2.6.1 — Gestión operativa, incidencias y configuraciones

> **La base es la V2.6.0 completa.** Se conservan las fórmulas de comisiones, Calidad Total, Alcance Global, y todos los cálculos de pagos existentes. Estos cambios modifican la administración, presentación y procedencia predeterminada de metas, no las fórmulas.

### 24.1 Catálogo central de módulos y ejecutivos

En **Configuración → Archivos y datos → Gestión de módulos y ejecutivos** elige **Módulos** o **Ejecutivos**. Selecciona **Nuevo** para registrar un nombre, o **Editar** junto a un nombre existente para modificarlo. Cada entrada admite:

- Nombre del módulo o ejecutivo y, para ejecutivos, el módulo asignado.
- Casilla **Activo** (marcada por defecto). Al desmarcarla, la entrada queda inactiva.
- **Objetivo semanal de ventas** opcional, que puede actualizarse sin reescribir el XLS.

Los nombres detectados en los archivos importados aparecen como sugerencias aun cuando todavía no se hayan dado de alta; hasta que se administren en el catálogo se consideran activos. En la ficha de edición de incidencias y registros, las listas para **elegir un nuevo módulo o ejecutivo** muestran elementos activos. Si una ficha antigua conserva una asociación desactivada, se señala como valor histórico; no se borra ni se ofrece como opción nueva.

**Baja prospectiva e histórico preservado:** el catálogo guarda una lista de fechas de cambio de estado por entrada. Los registros con fechas **anteriores al día** de desactivación permanecen en históricos y reportes. Los registros cuya fecha cae en el día de desactivación o posteriormente quedan fuera mientras rija el estado inactivo. Al volver a activar, los nuevos períodos vuelven a participar. Se respeta la fecha interna del registro, no la fecha del archivo. Esta es una regla **por día**, no por hora. Los archivos XLS originales no se alteran.

La lista es administrable sin una nueva migración SQL: se almacena por cuenta como la clave JSON `wmSamsTeamRegistryV261` en la tabla PostgreSQL **dashboard_settings** ya existente (y se mantiene una copia local sincronizable). No se ha creado una tabla relacional adicional de ejecutivos; la persistencia es un catálogo JSON estructurado por cuenta con identificadores estables y vigencias. No desactives entradas para corregir un único registro: edita o restaura el registro individual según corresponda.

### 24.2 Objetivos automáticos en las calculadoras, pero editables

Las calculadoras individuales consultan primero el objetivo explícito correspondiente a la semana o período; cuando no existe, utilizan el **objetivo semanal del ejecutivo** registrado en el catálogo, y finalmente los objetivos base y otros valores preexistentes del sistema. La calculadora del supervisor consulta primero su meta específica; cuando no existe, toma la **meta semanal del módulo** del catálogo, y después recurre a los objetivos base y respaldos existentes.

Una meta precargada es un **valor predeterminado editable**. Las metas específicas ingresadas para una semana se respetan, sin borrarlas ni reemplazarlas. Las metas operativas por módulo no se deben confundir con porcentajes, tarifas, umbrales de calidad o reglas de pago: cada control conserva su finalidad. **Ninguna fórmula ni tabla de comisión fue sustituida.**

### 24.3 Incidencias: tarjetas adaptativas y ficha por folio

La página **Gestión de incidencias** adapta su listado a tarjetas legibles en teléfonos, con los datos del folio y controles de búsqueda. Al tocar una incidencia se abre una **ficha** con sus datos, estatus y seguimiento. Allí encontrarás **Editar** y **Eliminar**.

- **Editar** abre el formulario con los datos de la incidencia; guardar cierra el formulario y actualiza el listado.
- **Eliminar en V2.7** requiere confirmación y mueve la incidencia a la papelera sin borrar comentarios. La incidencia puede restaurarse como inactiva desde Ajustes → Seguridad. La política anterior de borrado definitivo corresponde solo a la versión histórica V2.6.1.
- **Nueva incidencia** abre el formulario; el formulario no ocupa espacio constantemente mientras se consulta el listado.

Antes de enviar una incidencia a la papelera, considera si necesitas mantenerla activa para el cálculo de comisiones. Los registros XLS y su eliminación reversible siguen siendo funciones distintas.

### 24.4 Dashboard de Jefatura: objetivos en tarjetas por módulo

En **Objetivos operativos y su origen**, cada módulo tiene su propia **tarjeta plegable**. En ella se muestran indicador, objetivo, alcance logrado, porcentaje de cumplimiento y fuente. Abre las tarjetas para comparar los objetivos operativos sin desplazarte horizontalmente por una tabla extensa. Se mantienen los cálculos y la lógica de procedencia de objetivos anteriores. La presentación no cambia el universo de ventas ni su calidad.

### 24.5 Configuración 21: organización de secciones y páginas

En **Configuración → Interfaz y navegación → Orden de páginas** puedes **crear secciones**, cambiarles el nombre, reordenarlas, mover las páginas existentes entre secciones, modificar el **título visible** de cada página y elegir la página principal.

Puedes eliminar una sección **vacía** después de mover sus páginas a otra. **Configuración** es una sección fija. Crear una sección organiza enlaces a pantallas que ya existen: **no crea código ni una pantalla funcional nueva**. Pulsa **Guardar** para aplicar los títulos y el orden; el panel de ajustes se cierra al guardarlos. Si no guardas, las modificaciones pendientes no persisten.

El catálogo de opciones de Ajustes está agrupado en cuatro apartados: **Archivos y datos**, **Comisiones y calidad**, **Reportes y análisis**, e **Interfaz y navegación**. Se auditaron los controles con nombres similares y se mantuvieron separados cuando afectan metas, períodos o fórmulas diferentes, para no cambiar inadvertidamente sus efectos.

### 24.6 Nueva página Recordatorios con ventanas emergentes

En el menú **Administración → Recordatorios** pulsa **Crear recordatorio**. Configura título, mensaje, fecha y hora de primera aparición, repetición (**una vez, diariamente, semanalmente, lunes a viernes o mensualmente**), activación/desactivación y minutos de **Posponer** (de 1 a 1,440). Cada recordatorio se puede **editar, activar, desactivar o eliminar**.

Cuando se cumple el horario y la aplicación está abierta, aparece una ventana emergente. **Realizado** registra la confirmación de esa ocurrencia; **Posponer** vuelve a mostrarla al concluir el intervalo, si la aplicación continúa abierta. Las comprobaciones son periódicas y también ocurren al regresar al navegador. Los recordatorios se guardan por cuenta en `wmSamsRemindersV261` y se sincronizan con los ajustes autorizados.

**Limitación importante:** son avisos **dentro de la aplicación**. No son push del sistema, correo, SMS, WhatsApp ni notificaciones garantizadas con la página cerrada. El navegador puede reducir la actividad de pestañas en segundo plano. No los uses como único medio para alertas críticas.

### 24.7 Importar y exportar configuraciones (respaldo ampliado)

En **Configuración → Archivos y datos → Importación / exportación de configuraciones**:

1. Pulsa **Exportar configuraciones** para descargar un archivo JSON con los ajustes reconocidos, incluyendo el catálogo, navegación y recordatorios.
2. Para recuperar datos, inicia sesión, pulsa **Importar configuraciones**, elige el respaldo JSON y **confirma la sustitución** de las categorías incluidas.
3. El sistema guarda esos ajustes, solicita sincronización y recarga la aplicación si finaliza sin cambios pendientes. Los ajustes locales están sujetos a las reglas de sincronización de la cuenta.

El respaldo está limitado a una lista expresa de claves aprobadas; no incluye el contenido de archivos XLS, las incidencias de PostgreSQL, contraseñas ni tokens de inicio de sesión. No sustituye una copia integral de la base de datos. La importación **sobrescribe las categorías presentes** en el JSON; exporta una copia antes de importar otro archivo.

### 24.8 Comportamiento de guardado

Los botones explícitos de **Guardar** de los editores de configuración actualizados cierran el panel tras una operación válida. Esto incluye catálogo, navegación, ajustes del tablero e históricos. Los editores de **incidencias** y **recordatorios** cierran su formulario o ficha correspondiente. En caso de validación fallida o error de persistencia se muestra el problema y se mantiene la vista para corregirlo. Los controles que funcionan mediante cambios inmediatos, filtros o edición en línea **no se cierran automáticamente** al cambiar de valor.

### 24.9 Publicación, compatibilidad y comprobaciones

- Archivos nuevos: `src/team-registry.js`, `src/reminders.js`, `src/settings-transfer.js` y `tests/validate-v261.mjs`.
- Archivos modificados: `index.html`, `src/legacy-app.js`, `src/cloud-boot.js`, `netlify/functions/incidents.js`, `netlify/functions/settings.js`, `package.json`, documentación y manual PDF.
- La sincronización de catálogos, avisos y organización utiliza **dashboard_settings** y sus permisos existentes; el botón Eliminar incidencia utiliza la misma base protegida por identidad del usuario. No se añade migración SQL para el catálogo.
- Ejecuta `npm run check && npm test`, después `npm install && npm run build` en un equipo con las dependencias disponibles. En Netlify verifica especialmente el inicio de sesión, edición/borrado de incidencias, guardado entre dispositivos, inactivos y navegación móvil.
- Si vienes de V2.6.0, publica el conjunto completo de archivos y conserva los XLS y tablas PostgreSQL de tu cuenta. El catálogo nuevo empieza sin entradas administradas y no inventa objetivos: da de alta las metas que necesites.


## 30. V3.0 — Ventana de configuración contextual por página

Desde cualquier página abre **Menú → Configuración**. Ya no saldrás de la pantalla actual ni llegarás automáticamente a Configuraciones generales. Aparece una ventana encima de la consulta, con solo los grupos de ajustes que guardan relación con ella.

- **Dashboard de Jefatura:** panel, alertas, reportes y objetivos base con vigencias.
- **Logros semanales:** plantilla administrativa y objetivos base.
- **Calculadora individual y de supervisor:** tarifas, calidad, bono por dinámica y opciones específicas de cada calculadora.
- **Históricos:** análisis y exportación individual o por módulo.
- **Comparativos, registros e incidencias:** ajustes de calidad, objetivos, filtros de tabla o textos de reportes cuando correspondan.
- **Visitas:** títulos, criterios, ponderaciones, colores e imágenes del acuse.
- **Actualizaciones y Recordatorios:** sus opciones operativas se controlan desde sus fichas y filtros; no se muestran ajustes ajenos.

Al pulsar **Guardar y volver a la página**, los formularios con guardado pendiente se validan y guardan; si hay error, la ventana permanece abierta y muestra el problema. Si se guardó correctamente, se cierra y se mantiene exactamente la página que estabas consultando. También puedes usar un botón Guardar propio de un apartado. Los cambios de algunos controles se almacenan al modificarlos, como ya ocurría antes.

La edición de textos de reportes se limita a la página desde la que abriste la ventana. Para cambiar la organización general, los títulos del menú o los ajustes de otras páginas, utiliza Configuraciones generales. No se crea una base de datos nueva ni cambia el cálculo de comisiones.


## 31. V3.0 — Filtros ampliados, alertas individuales y copia de reportes

### 31.1 Dashboard Jefatura: filtros en menú flotante

Desde **Dashboard de Jefatura → Menú → Filtros** puedes elegir:

- **Módulo:** limita los resultados consolidados y los objetivos al módulo elegido. Para el total filtrado se usa la meta de ese módulo, no la suma completa de Jefatura.
- **Ejecutivo:** limita la tabla **Productividad del equipo** a ese colaborador; los resultados globales y objetivos del módulo NO se modifican para evitar comparar su producción con la meta global de manera incorrecta.
- **Prioridad de alertas:** Alta, Media, Informativa o todas.
- **Categoría de alertas:** Proyección, Conversión, Calidad, Objetivos, Incidencias, Datos o Actualización.
- **Incluir supervisores:** conserva su comportamiento previo. **Restablecer filtros** elimina los filtros de módulo, ejecutivo y alertas (no altera la semana seleccionada).

La semana de trabajo sigue siendo lunes–domingo. Los filtros de prioridad/categoría solo modifican las alertas visibles. El filtro de ejecutivo solo modifica el cuadro de productividad. El módulo sí modifica el consolidado y las metas mostradas. Los filtros no borran ni reescriben registros.

### 31.2 Configuración: porcentajes mínimos de alerta

Abre **Menú → Configuración** en Dashboard Jefatura y expande **Porcentajes mínimos de alerta por categoría**. Especifica el mínimo (%) de cada factor de calidad: Cumplimiento, Primera compra, Programa Cero y Activación APP. Para metas operativas puedes configurar independientemente Trámites, Plan Dental, Programa Cero, APP y Primera compra; activa **Alerta por metas operativas** para que se evalúen esos mínimos. Conversión mínima y cumplimiento proyectado mínimo continúan teniendo controles propios en la misma ventana.

Cada porcentaje admite de 0 a 300 y se considera alerta cuando el valor real es inferior al mínimo guardado. Los umbrales antiguos se toman como valores iniciales al migrar preferencias previas. **Guardar y volver a la página** aplica los cambios y cierra la ventana sin salir de Jefatura. Estos umbrales solo afectan las señales de seguimiento; no modifican las fórmulas de comisiones.

Las alertas por incidencias se activan cuando hay incidencias pendientes, por ausencia de registros cuando el módulo no tiene carga y por actualización cuando han transcurrido los días configurados: esas tres no se basan en un porcentaje.

### 31.3 Copiar reportes desde incidencias y actualizaciones

Abre la ficha de una incidencia o solicitud de actualización y pulsa **Copiar reporte**. El texto contiene los datos de identificación, estado, fechas y comentarios históricos. En solicitudes resueltas agrega los valores aplicados. La aplicación muestra confirmación si el navegador permitió copiar. Pega el texto en WhatsApp, correo o tu medio de seguimiento.

### 31.4 Logros semanales: folios comisionables

Selecciona la semana, el módulo y otros filtros deseados en **Logros semanales**. Abre **Menú → Exportar → Copiar folios comisionables**. Se copian únicamente los registros filtrados que la aplicación clasifica **Comisionable** en su validación de pago (código y tipo de venta válido, sin estatus no pagable ni incidencia excluyente). Si no existe ningún folio comisionable con esos filtros se muestra un aviso, sin copiar un reporte vacío.

Formato de ejemplo:

```text
Paseo Montejo
09/11/2026, 12345678
10/11/2026, 23456789

Aviación
11/11/2026, 34567890
```

Cuando se seleccionan todos los módulos, el reporte agrupa los folios por módulo. Se evitan renglones duplicados que tengan idénticos módulo, fecha y folio. La selección de filtros **No pagable** o **Sin código** normalmente produce un reporte vacío, porque la exportación respeta los filtros actuales. No afecta las comisiones ni actualiza el XLS.


## Actualización de reportes V3.0 (19 de noviembre de 2026)

En **Comparativa diaria → Menú → Exportar** hay ahora dos opciones de copiado:

1. **Copiar para WhatsApp:** incluye el mensaje fijo de cierre, las métricas diarias alineadas en un bloque monoespaciado, Calidad y tres valores acumulados de ventas comisionables (avance semanal %, esperado a la fecha %, diferencia %). El avance esperado se calcula como días transcurridos desde lunes, incluido el día del reporte, entre siete. La diferencia es en puntos porcentuales, aunque se presenta con el signo `%` del formato solicitado. No se añade comentario final.
2. **Copiar avance y objetivo de Jefatura:** muestra Ventas, Plan Dental y Plan Cero con porcentaje de alcance, requerido y diferencia. Ventas usa su meta semanal de cantidad. Dental es penetración de ventas comisionables con Plan Dental sobre todas las ventas comisionables; Plan Cero es penetración de Plan Cero sobre ventas regulares comisionables. En las penetraciones el objetivo porcentual sigue siendo el mismo durante la semana y no se divide entre siete, porque hacerlo alteraría su interpretación.

Las dos opciones respetan la fecha principal seleccionada y los registros disponibles en el histórico de la cuenta; las ventas consideradas para el avance son **solo comisionables** según la validación de pago vigente, no todas las ventas con código. Si faltan objetivos configurados para la semana en el perfil de Jefatura o en todos los perfiles de módulos, los porcentajes sin meta se muestran como `—` o con un aviso. Las copias requieren permisos de portapapeles del navegador.

En **Visitas de coordinación**, el servidor acepta los criterios e incidencias en el formato de objeto que envía el formulario. Se conservan límites de protección y se muestran mensajes específicos cuando se exceden.


### Actualización: cantidades de Ventas en «Copiar avance y objetivo de Jefatura»

En **Comparativa diaria → Menú → Exportar → Copiar avance y objetivo de Jefatura**, la sección Ventas agrega la cantidad de ventas comisionables acumuladas y la cantidad requerida al corte. Ejemplo (meta semanal: 72 ventas; miércoles; acumuladas: 29):

```text
*Avance y objetivo de la jefatura*

Semana: 16/11/2026 al 22/11/2026
Corte: 18/11/2026 · 3 de 7 días

*Ventas*
Alcance: 40.28% (29 ventas)
Requerido hoy: 42.86% (31 requeridas)
Diferencia: -2.58%
```

La cantidad requerida es `redondear hacia arriba(objetivo semanal × días transcurridos / 7)`. Los porcentajes se calculan con los valores exactos antes del redondeo de la cantidad. Si falta la meta semanal, la cantidad requerida no se muestra como un dato inventado. Plan Dental y Plan Cero mantienen el formato de porcentajes vigente.

## Actualización 3.0.3
En Ajustes > Reportes del portapapeles selecciona el reporte. Edita el título, etiquetas, texto inicial/final y marca los indicadores que deseas ver. Usa ↑ para mover un indicador hacia arriba. Guarda el reporte para aplicar el formato y consultar una vista previa ilustrativa; Restaurar plantilla elimina la personalización de ese reporte. El reporte de folios admite encabezado y textos adicionales, conservando las fechas y folios. Los cambios se sincronizan por cuenta con el mecanismo existente; verifica el estado de sincronización antes de cambiar de dispositivo. El respaldo JSON incluye estas preferencias.

En Ajustes > Restablecer sistema, Restablecer ajustes devuelve las preferencias originales sin borrar XLS, visitas, incidencias, solicitudes, objetivos base, equipo ni correcciones de registros. Las excepciones de metas de históricos y comparativa semanal se restauran. Descarga primero un respaldo desde Importar / exportar configuraciones. Restablecimiento completo elimina permanentemente los datos de la cuenta (incluida la papelera y auditoría), no la identidad ni las cuentas de otros usuarios. Requiere sesión activa, confirmación escrita RESTABLECER TODO y sincronización previa. No existe recuperación desde el sistema después de confirmar.

Para los históricos y la comparativa semanal, toca el nombre del elemento para configurar el objetivo base vigente. Puedes introducir una excepción en los campos de objetivo; vaciarla recupera la meta base. Las excepciones se guardan hasta eliminarlas. Si falta una cantidad base, la meta se muestra como Sin objetivo configurado. Los porcentajes predeterminados del catálogo siguen vigentes. Las calculadoras conservan sus controles y fórmulas de comisión. El avance diario indica las metas faltantes. El menú flotante abre Exportar; Filtros y Configuración siguen disponibles.

Despliegue: reemplaza el contenido del repositorio con este paquete, conserva la conexión a Netlify y ejecuta npm run build mediante el despliegue habitual. No requiere migraciones adicionales. GitHub Pages por sí solo no ejecuta las funciones ni la base de datos de esta versión.
