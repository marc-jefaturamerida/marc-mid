# Manual de usuario y administración

**INVEX · Dashboard y comisiones Mérida**  
**Versión 2.6.0 | Noviembre de 2026**  
**Aplicación:** GitHub + Netlify Hosting + Netlify Identity + Netlify Database.  
**Alcance:** guía operativa, indicadores, comisiones, configuración, exportaciones y mantenimiento.

> **Importante:** El proyecto es una herramienta de análisis y simulación. Sus cálculos no sustituyen la validación o liquidación oficial de comisiones. Los resultados dependen de los datos importados, las metas vigentes y las incidencias registradas. No muestra ventas inexistentes ni asume que un día sin registros significa cero productividad.

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
| Administración | Registros manuales, Gestión de incidencias y Visitas de coordinación |
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

Es la pantalla de supervisión global. Puedes consultar **Hoy**, **Semana actual**, **Mes actual** o un intervalo personalizado de hasta 367 días. La opción de incluir supervisores cambia el conjunto de ventas analizado, pero no reescribe sus registros.

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

Las metas específicas de Jefatura son exclusivas de sus análisis. **No alteran los objetivos, pagos ni tarifas de la Calculadora de supervisor o de colaboradores.** El tablero muestra la fuente del objetivo en la tabla de objetivos y en los recuadros de proyección.

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

La publicación de Netlify utiliza `npm run build` y directorio de salida `dist`. No basta con reemplazar solamente `index.html`; también debes publicar los archivos de `src`, `public` y `netlify` cuando corresponda. Esta versión reutiliza la clave de configuración del Dashboard de Jefatura, por lo que no requiere una nueva tabla SQL para sus objetivos.

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

La clave sincronizable nueva es `wmSamsBaseGoalsV258`. El navegador conserva una copia local y Netlify guarda su valor en la tabla de ajustes existente (`dashboard_settings`, con `owner_id` por cuenta). No depende de `dashboard_reports`; al borrar archivos siguen apareciendo los perfiles guardados y sus vigencias. **No se requiere migración SQL.**

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
