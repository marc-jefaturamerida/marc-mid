# Manual de usuario · JEFATURA MID MARC V4.1.0

## 1. Inicio y Supabase

La página principal sigue siendo **Comparativa diaria**. Al iniciar sesión, Supabase Auth autoriza el acceso y la aplicación descarga el historial completo desde el bucket privado `marc-xls-private` y su catálogo `marc_xls_archives`. **No borres ni recrees las tablas o el bucket** para esta actualización.

La nueva página **Análisis del día** se encuentra en **Análisis y resultados**, después de Comparativa diaria. Todas las demás funciones y las reglas de comisiones se conservan.

## 2. Asignación obligatoria de objetivos faltantes

Al abrir la aplicación, y al cargar XLS que detecten semanas sin objetivo de trámites o ventas, aparece la pantalla **Asignación rápida de objetivos**. Ahora cada módulo o ejecutivo figura una sola vez (agrupado por tipo y nombre), con el número y las fechas de sus semanas pendientes.

1. Escribe **Trámites** y **Ventas** en la fila de cada perfil. El valor se usará en **todas las semanas pendientes de ese perfil**, incluso si hay varias semanas detectadas.
2. El botón **Repetir en sus semanas** confirma la asignación del perfil. El botón **Aplicar cantidades a todos los pendientes** permite poner una misma meta global en las celdas pendientes de los distintos perfiles.
3. Pulsa **Guardar todos los objetivos**. Se conservarán las metas anteriores: **nunca se sobrescriben objetivos ya definidos**.
4. Los objetivos en cero también se consideran faltantes. La ventana es obligatoria hasta completar la asignación.

Los valores se aplican a las semanas pendientes y no sustituyen las reglas de comisiones.

## 3. Página «Análisis del día»

### Sección 1 · Filtros

- **Desde y hasta:** período inclusivo para el análisis.
- **Día:** lunes, martes, miércoles, jueves, viernes, sábado o domingo.
- **Módulos:** selección múltiple mediante casillas; sin selección se usan todos.
- **Ejecutivos:** selección múltiple; si seleccionas también módulos, solo se consideran los ejecutivos que estén dentro de los módulos seleccionados (intersección).
- **Objetivo de ventas conjunto:** una sola meta para todos los perfiles elegidos, para **cada ocurrencia** del día de la semana seleccionado.

### Promedio y porcentajes

Se cuentan **todas las ocurrencias del día seleccionado dentro del rango**, incluso los días sin ventas. Por ejemplo, cuatro lunes con 5, 2, 0 y 9 ventas suman 16 y dan un promedio de 4 ventas por lunes. El cumplimiento del objetivo diario se calcula `promedio de ventas / objetivo diario × 100`.

**Solo ventas comisionables:** tarjetas con código, clasificadas como regulares o garantizadas y que no estén Canceladas/Incompletas/Rechazadas ni tengan incidencia activa. Se conserva la misma función `payable()` del motor de comisiones existente.

| Indicador | Acumulado | Promedio por día | Porcentaje mostrado |
| --- | --- | --- | --- |
| Ventas totales | Ventas comisionables | Ventas / número de ocurrencias | 100% cuando hay ventas |
| Garantizadas | Garantizadas comisionables | Garantizadas / ocurrencias | Garantizadas / ventas totales |
| Regulares | Regulares comisionables | Regulares / ocurrencias | Regulares / ventas totales |
| Plan Dental | Dental sobre ventas comisionables | Dental / ocurrencias | Dental / ventas totales |
| Plan Cero | Plan Cero sobre regulares comisionables | Plan Cero / ocurrencias | Plan Cero / regulares |

### Sección 2 · Módulos

Tabla acumulada para los módulos filtrados. Presenta total, promedio por día y porcentaje por indicador.

### Sección 3 · Ejecutivos

Tabla acumulada para los ejecutivos filtrados, con los mismos indicadores y reglas.

### Menú flotante y exportaciones

En **Menú → Exportar** encontrarás PDF, PNG y **Copiar resumen del día**. También hay botones directos al final del análisis. PDF y PNG se dibujan desde **el mismo lienzo** en **una sola página carta vertical (816 × 1056 píxeles de referencia)**. El PDF es carta de 612 × 792 puntos, orientación vertical.

En **Menú → Configuración** se puede editar el título y nota al pie del informe y elegir qué tablas y fechas aparecerán. Los filtros y estas preferencias se conservan en el navegador.

Cuando se seleccionan demasiados perfiles para una sola hoja legible, la exportación pide reducir los filtros; **no crea una segunda página ni omite filas silenciosamente**.

## 4. Uso local (sin sesión en Supabase)

Al ejecutar mediante `npm run dev`, los archivos XLS importados se guardan automáticamente en **IndexedDB** cuando la dirección sea `localhost`, `127.0.0.1` o `file:`. Se recuperan al recargar o reiniciar el servidor, siempre que vuelvas al **mismo origen y puerto** (por ejemplo, `http://localhost:5173`).

Objetivos, perfiles, filtros, tarifas y preferencias existentes se guardan en `localStorage`. Los filtros del XLS usan también `localStorage` en modo local (en vez de almacenamiento de sesión).

Puedes borrar exclusivamente los XLS locales mediante **Borrar XLS locales (solo este navegador)** en Ajustes; nunca afecta el bucket ni las tablas de Supabase. Borrar los datos del sitio del navegador o cambiar de puerto/origen puede hacer que la información local no esté disponible: conviene mantener respaldos de los XLS originales.

**No se guardan contraseñas, claves privadas ni tokens en IndexedDB de XLS.** El historial local es independiente del historial autorizado de Supabase.

## 5. Instalación GitHub Pages + Supabase

1. Actualiza el repositorio `marc-jefaturamerida/marc-mid` en un solo commit con **todo el contenido del ZIP**, incluyendo `.github` y `supabase`. Conserva `.git` si lo haces en una copia local mediante GitHub Desktop.
2. Comprueba que GitHub Actions termine `npm run check`, `npm test`, `npm run build` y la publicación.
3. Conserva las variables públicas de GitHub: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `APP_BASE=/marc-mid/`.
4. No ejecutes de nuevo las migraciones SQL de V4; esta actualización no incorpora migraciones nuevas.
5. Inicia sesión, verifica el historial de Supabase, abre Análisis del día, selecciona fechas y filtros, y prueba un PDF y un PNG.

Si Supabase aún no ha recuperado **todo el historial**, el nuevo análisis no muestra sumas parciales. No se modifican fórmulas de comisiones, bucket ni políticas RLS.

## 6. Validaciones y límites

`npm run check` y `npm test` incluyen nuevas pruebas de rango inclusivo, semanas con cero ventas, filtros por módulo y ejecutivo, Plan Cero, promedios, metas agrupadas y exportación a una sola hoja. La publicación real debe validarse desde GitHub Actions y la cuenta Supabase existente.
