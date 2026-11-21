# Manual de usuario · JEFATURA MID MARC V4.1.1

**Guía de uso diario y configuración de la aplicación.** Este documento está dirigido a las personas que consultan, importan y administran resultados. Las opciones visibles pueden variar según los datos cargados y los permisos de la cuenta.

## 1. Inicio de sesión y pantalla principal

Al abrir la aplicación, la página inicial es **Comparativa diaria**. Puedes revisar archivos de prueba sin sesión; cuando accedes con tu correo autorizado, los XLS quedan asociados a tu cuenta y se sincronizan con el historial privado.

1. Selecciona **Ingresar con correo** y accede con tus credenciales de usuario.
2. Espera a que termine la recuperación del historial; mientras esté incompleto no se presentan cálculos parciales como definitivos.
3. Para cambiar de página utiliza el menú superior de categorías: **Análisis y resultados**, **Comisiones** o **Administración**.
4. Utiliza **⚙ Ajustes** para personalizar objetivos, perfiles, exportaciones y visualización.
5. Selecciona **Cerrar sesión** cuando termines de utilizar un equipo compartido.

> **Atención:** la pantalla obligatoria de objetivos aparece cuando faltan metas para semanas detectadas. Completa los pendientes para desbloquear la navegación.

## 2. Importación y administración de XLS

Pulsa **Cargar XLS**, elige uno o varios archivos y confirma la vista previa y la fecha que solicite el importador. Los formatos admitidos incluyen XLS, XLSX y algunos archivos delimitados. Si el archivo no contiene las columnas necesarias, el programa mostrará un error explicativo.

La pantalla **Ajustes → Archivos XLS guardados** permite revisar el catálogo, elegir **Total acumulado** o **Elegir uno o varios archivos**, y recuperar el historial cuando exista una incidencia de lectura. La aplicación evita duplicar archivos ya registrados y no utiliza registros incompletos para emitir resultados.

- **Con sesión:** los XLS se guardan en un historial privado de la cuenta.
- **Sin sesión en modo local:** los XLS se conservan en el navegador cuando el origen local admite almacenamiento persistente.
- **Eliminación de XLS:** revisa cuidadosamente la selección. La opción **Borrar XLS locales** solamente afecta el navegador; eliminar archivos de la cuenta es una acción diferente y puede ser irreversible.

## 3. Objetivos de Jefatura, módulos y ejecutivos

Los objetivos de **Trámites** y **Ventas** se establecen por semana operativa, de **lunes a domingo**. La configuración se encuentra en **Ajustes → Objetivos base** o tocando el nombre del perfil en las vistas que admitan edición.

### Asignación rápida de faltantes

Al iniciar, o después de importar XLS con semanas sin metas, aparece **Asignación rápida de objetivos**. Cada módulo o ejecutivo se muestra **una sola vez**, aunque tenga varias semanas pendientes.

1. Introduce la cantidad de **Trámites** y de **Ventas** para ese perfil.
2. Usa **Repetir en sus semanas** para aplicar los valores a todos sus períodos pendientes.
3. Si deseas utilizar las mismas cantidades para distintos perfiles, rellena los campos de aplicación masiva y pulsa **Aplicar cantidades a todos los pendientes**.
4. Termina con **Guardar todos los objetivos**.

Los valores ya registrados en otras semanas se conservan. Una meta vacía o igual a cero se considera faltante. Los objetivos históricos y las fórmulas de comisiones no se reemplazan automáticamente por una asignación rápida.

### Activar e inactivar perfiles

Desde **Ajustes → Gestión de módulos y ejecutivos** elige el tipo de perfil, escribe su nombre exacto y marca o desmarca **Activo**. También puedes hacerlo desde la ficha de objetivos de ese perfil. Guarda la modificación.

**Para la semana operativa actual:** un módulo o ejecutivo marcado como inactivo no aparece en las tablas, indicadores, filtros ni exportaciones de resultados de esa semana. Sus registros anteriores no se borran: las consultas de semanas históricas respetan la fecha de baja o reactivación que conste en el catálogo.

La inactivación de un **módulo** no cambia automáticamente el estado guardado de sus ejecutivos; cada perfil conserva su propio estado. Aun así, las ventas registradas en un módulo inactivo quedan excluidas de los resultados de la semana actual.

## 4. Análisis y resultados

### Comparativa diaria

Compara los resultados de dos fechas y observa cambios en registros, ventas totales, regulares, garantizadas, Plan Cero y Plan Dental. Confirma las fechas elegidas antes de copiar o exportar.

### Análisis del día

Permite analizar lo logrado en **todos los lunes**, **todos los martes** u otro día de la semana dentro de un rango. Se encuentra en **Análisis y resultados → Análisis del día**.

**Primer apartado: filtros.** Establece Desde/Hasta, uno o varios módulos, uno o varios ejecutivos, el día de lunes a domingo y el objetivo conjunto de ventas para ese día. Si eliges módulos y ejecutivos a la vez, se aplican ambos filtros (solo ejecutivos de los módulos elegidos).

**Segundo apartado: módulos.** Muestra las ventas totales comisionables, garantizadas, regulares, Plan Dental y Plan Cero por módulo.

**Tercer apartado: ejecutivos.** Presenta los mismos indicadores por colaborador.

Cada indicador incluye **acumulado**, **promedio por ocurrencia del día elegido** y **porcentaje**. El denominador del Plan Cero son solamente las **ventas regulares comisionables**; para los demás porcentajes se usan las ventas totales comisionables. Los días seleccionados sin ventas también cuentan en el promedio.

**Ejemplo:** si los cuatro lunes de un rango se obtienen 4, 2, 0 y 6 ventas, el acumulado es **12** y el promedio es **3 ventas por lunes**. Si la meta conjunta es 5 ventas por lunes, el alcance promedio equivale a **60%**.

### Comparativo de ejecutivos y comparativas semanales

En **Comparativo de ejecutivos** selecciona una semana operativa o un rango personalizado. Las comisiones se calculan para cada semana por separado y después se suman. Un rango parcial no prorratea el objetivo semanal. **Comparativa semanal** compara dos semanas operativas en módulos y objetivos.

### Otras páginas de resultados

- **Dashboard de Jefatura:** cumplimiento consolidado, calidad, proyecciones, alertas y acciones de seguimiento.
- **Acumulado general:** totales por módulo y ejecutivo dentro del período consultado.
- **Histórico individual:** seguimiento diario, semanal o mensual de un colaborador.
- **Histórico por módulo:** análisis operativo del módulo, tendencias, objetivos y promedios.
- **Logros semanales:** revisión por semana, módulo, indicadores y folios.

## 5. Comisiones

**Calculadora individual** permite introducir o importar las ventas, Plan Dental, Plan Cero, activaciones y otros datos, y comparar base y simulación. **Calculadora supervisor** muestra los resultados del módulo, indicadores de calidad y componentes configurados de remuneración.

Las comisiones utilizan el motor de cálculo del proyecto. Los registros cancelados, incompletos, rechazados o con incidencia activa pueden quedar excluidos del pago según las reglas vigentes. Antes de utilizar un resultado para seguimiento formal, revisa objetivos, incidencias, fechas y el archivo seleccionado.

En **Ajustes → Tarifas de comisiones** y **Porcentajes requeridos y límites de calidad** puedes consultar y modificar parámetros habilitados. Realiza cambios solo cuando tengas autorización, ya que afectarán las simulaciones posteriores.

## 6. Administración y control

- **Registros manuales:** consulta los folios y combina filtros por fechas, módulo, ejecutivo, estatus y otros campos.
- **Gestión de incidencias:** registra, consulta y actualiza incidencias; los folios con incidencias activas pueden excluirse de comisiones.
- **Actualizaciones:** solicita correcciones a campos del registro y consulta el estado de las solicitudes.
- **Recordatorios:** revisa avisos y tareas pendientes.
- **Visitas de coordinación:** captura y consulta las visitas y sus evidencias disponibles.

Cuando existan operaciones que afectan un folio, comprueba que la sincronización haya terminado antes de cerrar la sesión.

## 7. Ajustes de la aplicación

Abre **⚙ Ajustes**. Arriba encontrarás **Buscar ajustes**, justo junto a **Guardar ajustes y cerrar**. Escribe el nombre de una función; la búsqueda filtra los botones del menú sin borrar ni modificar las configuraciones. Selecciona el resultado para abrir su apartado. Borra el término para volver a mostrar todas las secciones.

Los apartados están organizados en **Archivos y datos**, **Comisiones y calidad**, **Reportes y análisis**, **Interfaz y navegación**, **Avanzado** y, si corresponde, **Otros ajustes**.

### Opciones principales

| Apartado | Para qué sirve |
|---|---|
| Archivos XLS guardados | Revisar, seleccionar o gestionar las fuentes del historial. |
| Gestión de módulos y ejecutivos | Crear perfiles, asignar módulo, establecer estado activo/inactivo. |
| Objetivos base | Definir metas con vigencia para Jefatura, módulos y ejecutivos. |
| Tarifas y calidad | Ajustar parámetros habilitados de comisiones y porcentajes. |
| Reportes y análisis | Personalizar textos, tablas, indicadores y exportaciones. |
| Apariencia y navegación | Cambiar tema, secciones, posición y página principal. |
| Avanzado | Reportes del portapapeles, restablecimiento, auditoría y recuperación, respaldos. |

### Avanzado: portapapeles

En **Avanzado → Reportes del portapapeles**, cambia los textos y apartados que se copian, según las opciones disponibles para cada reporte. Guarda los ajustes antes de cerrar el panel.

### Avanzado: restablecer proyecto

En **Avanzado → Restablecer proyecto** encontrarás el restablecimiento de ajustes y el restablecimiento completo. **El restablecimiento completo puede eliminar datos permanentemente**. Exporta un respaldo y lee el cuadro de confirmación antes de continuar.

### Avanzado: seguridad, auditoría y recuperación

En **Avanzado → Seguridad · Auditoría y recuperación** puedes consultar movimientos y la papelera de incidencias. La restauración y reactivación no son equivalentes: al restaurar un elemento, comprueba su estado antes de volver a utilizarlo.

## 8. Exportar información

Utiliza el **menú flotante** de la página activa. Según la sección, encontrarás acciones para copiar el reporte al portapapeles, descargar **PDF** o **PNG** y abrir la configuración de esa página.

En **Análisis del día**, el texto resume el día consultado, fechas, cantidad de períodos, total, promedio y tablas elegidas. Su PDF se genera en **una sola hoja carta vertical** y su PNG en **una sola imagen vertical**. Si se seleccionan demasiados perfiles, reduce los filtros para mantener la legibilidad del reporte.

Comprueba la vista previa y los filtros antes de compartir cualquier reporte que contenga información de clientes.

## 9. Guardado de preferencias y respaldo

Con sesión iniciada, los datos del historial autorizado están asociados a tu cuenta. En modo local, el mismo navegador puede conservar XLS, objetivos, filtros, perfiles y otras preferencias. Para recuperar datos locales debes utilizar el mismo navegador y la misma dirección local, sin borrar los datos del sitio.

Para respaldar preferencias, usa **Avanzado → Importar / exportar configuraciones**. Los respaldos de ajustes no sustituyen una copia de tus XLS originales. Cualquier eliminación del almacenamiento local debe ser deliberada.

## 10. Mensajes habituales y recomendaciones

| Mensaje o situación | Qué hacer |
|---|---|
| Se solicitan objetivos faltantes | Completa las cantidades pendientes; puedes usar aplicación masiva. |
| Un perfil inactivo no figura esta semana | Revisa su estado en Gestión de módulos y ejecutivos. |
| Un XLS figura como duplicado | Revisa Archivos XLS guardados antes de volver a importarlo. |
| Historial pendiente de lectura | Usa Reintentar historial. Evita interpretar cálculos parciales. |
| PDF o PNG no cabe en una página | Reduce módulos o ejecutivos seleccionados. |
| No se conserva una captura local | Comprueba que sigues en el mismo navegador y no se borraron sus datos. |
| No puedes copiar al portapapeles | Revisa permisos del navegador y vuelve a intentarlo. |

**Buenas prácticas:** utiliza un rango de fechas claro; revisa el estado de los perfiles; conserva tus XLS originales; verifica incidencias y objetivos antes de compartir cifras; no utilices el restablecimiento completo como medida para resolver un error de visualización.
