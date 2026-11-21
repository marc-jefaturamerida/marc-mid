# MANUAL — JEFATURA MID MARC V4.0.0

## Acceso y sección inicial

Abre la aplicación publicada en GitHub Pages e inicia sesión con tu cuenta de Supabase Auth. La sección inicial es **Comparativa diaria**. El menú permite cambiar entre calculadoras, comparativos, acumulados, registros, informes, incidencias, visitas, seguimiento, logros y ajustes según los permisos de usuario.

## Objetivos obligatorios

Si falta un objetivo semanal de trámites o ventas para un módulo o ejecutivo activo, completa los valores en la tabla de captura rápida y guarda. El botón de llenado masivo aplica una misma cantidad a los campos pendientes editables; no sobrescribe objetivos previos. Los perfiles inactivos mantienen su historial anterior a la fecha de baja.

## Cargar un XLS

Con sesión, pulsa **Cargar XLS**, selecciona el archivo, revisa la vista previa y la fecha y confirma. V4 lo guarda en **Supabase Storage privado**, marca la ficha `ready` en PostgreSQL y lo incorpora al historial calculable solo cuando el archivo está completo.

La primera vez, el archivo anterior de V3.0.4.4 no se transfiere automáticamente: permanece guardado en la tabla vieja `dashboard_reports`. Para utilizarlo en V4, vuelve a cargar el XLS original de tu equipo. No borres el registro antiguo.

Sin sesión puedes importar temporalmente para visualizar, pero no se conserva al cerrar o recargar la página.

## Archivos duplicados e interrumpidos

- **XLS duplicado:** se identifica por la firma del archivo dentro de tu propia cuenta; no se guarda una segunda copia.
- **Carga interrumpida:** si la ficha queda `pending`, vuelve a importar el mismo XLS; el sistema reanuda y valida el contenido.
- **Integridad:** cada descarga se verifica con SHA-256 y la cantidad exacta de filas. Un archivo corrupto no participa en las sumatorias.

## Comparativos y comisiones

Las fórmulas del motor de cálculo siguen siendo las de V3.0.4.4. La selección de semana laboral o rango personalizado mantiene las comisiones semanales individuales; el período comparado suma semanas calculadas por separado. Los objetivos de semanas parciales siguen siendo semanales completos. Los XLS incluidos deben estar íntegros para presentar totales.

## Sincronización y otras secciones

La configuración, objetivos, incidencias, visitas, auditoría y solicitudes continúan utilizando la Edge Function `dashboard-api` de Supabase. La nueva ruta de archivos XLS no depende de esa Edge Function. No compartas contraseñas ni cadenas privadas de PostgreSQL.

## Instalación y diagnóstico

Lee `INICIAR_AQUI.md` para instalar la migración aditiva y publicar GitHub Pages. Ejecuta `DIAGNOSTICO_SUPABASE_V400_SOLO_LECTURA.sql` si necesitas identificar archivos confirmados o cargas pendientes. No ejecutes migraciones repetidas ni utilices el restablecimiento general para reparar problemas de Storage.
