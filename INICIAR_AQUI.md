## Novedad V2.5.5 — Fecha al cargar y textos de exportación

Al seleccionar archivos XLS/XLSX/CSV/TSV aparecerá un calendario **por archivo**. La fecha elegida (AAAA-MM-DD) será su nombre visible, sin modificar las fechas de los registros. Cancelar la ventana omite solamente el archivo actual. Es posible cargar archivos diferentes con la misma fecha; se distinguen internamente por identificador y huella del contenido. Los archivos antiguos mantienen el nombre anterior. En el PDF/PNG los textos de referencias al formato XLS/XLSX se muestran como «registros manuales». No se alteró el lector de archivos ni las fórmulas.

## Publicación V2.5.5 — Histórico por módulo

1. Este ZIP incluye **todo el proyecto V2.5.3** más la nueva página. Sustituye el contenido del repositorio completo (no solo `index.html`).
2. En Termux, dentro de `~/marc-mid`, descomprime el ZIP en la raíz, confirma los archivos y ejecuta:
   ```bash
   git add -A
   git commit -m "INVEX V2.5.5 historico por modulo"
   git push origin HEAD
   ```
3. Netlify debe compilar con `npm run build`, directorio `dist`. No se requieren migraciones adicionales, ni volver a cargar los XLS.
4. Abre **Análisis y resultados → Histórico por módulo**; selecciona módulo y revisa fechas, promedios y objetivo automático. Si no hay objetivo guardado, edítalo en la tabla.
5. Para ajustar el reporte, entra a **Ajustes → Histórico por módulo**. Los cambios se sincronizan por cuenta; son independientes de Histórico individual.
6. Usa **Exportar → Imprimir/PDF** (Carta) o **Exportar PNG**. Si hay muchos períodos se crean las hojas necesarias, sin omitir filas.
7. Verifica los números de un módulo con varios colaboradores y de otro con ventas de supervisor, y prueba PDF/PNG en el navegador publicado.

**Nota:** se conservaron las 11 páginas anteriores y se añadió una duodécima, sin cambios a comisiones, incidencias ni reportes administrativos.

---

## Publicación V2.5.3 · Histórico individual y grupos de navegación

1. **Trabaja sobre la V2.5.2:** este ZIP ya incluye todas sus páginas, exportaciones e incidencias.
2. Descomprime el ZIP en la raíz de tu repositorio GitHub, donde están `index.html`, `package.json`, `src/`, `public/`, `netlify/` y `tests/`.
3. En Termux: `cd ~/marc-mid && git add -A && git commit -m "INVEX V2.5.3 historico individual" && git push origin HEAD`.
4. Revisa el despliegue de Netlify. Build `npm run build`, directorio de salida `dist`. La actualización no añade migración SQL.
5. Entra con tu correo, selecciona **Análisis y resultados → Histórico individual**, un ejecutivo y la vista día/semana/mes. Si cambió de módulo, el filtro «Todos los módulos» incluye todo el historial disponible.
6. Abre **Ajustes → Histórico individual** para editar las métricas, visualización, objetivos y exportación. En **Ajustes → Orden de páginas** personaliza categorías y página de inicio.
7. Desde el menú flotante, exporta PDF/PNG; el PDF debe imprimirse en **Carta**. Contrasta objetivos y promedios con los XLS de tu cuenta. Los períodos sin registros no se promedian.

**Importante:** eliminar un XLS elimina sus datos del análisis histórico (sin snapshot adicional), pero **no elimina** incidencias guardadas por folio en su tabla permanente. Conserva las copias originales de los XLS para respaldo. Esta entrega no cambia cálculos de pago.

---

## Publicar V2.5.2 — Exportación administrativa desde Logros semanales

La base es **V2.5.0**; NO se utilizó el código de exportación de supervisor de V2.5.1. El nuevo reporte PDF/PNG pertenece exclusivamente a **Logros semanales**. Incluye 15 botones de Ajustes y la plantilla administrativa personalizable (Ajustes → 15).

1. Descarga y descomprime el ZIP en la **raíz** de tu repositorio, reemplazando `index.html`, `src/`, `netlify/`, etc.
2. Ejecuta `npm run check` y `npm test` si tienes Node.js. Para compilar: `npm install && npm run build`.
3. Sube los cambios con `git add -A && git commit -m "INVEX V2.5.2 reporte Logros semanales" && git push origin HEAD`.
4. Después de un despliegue exitoso, entra a **Logros semanales**, selecciona **semana y módulo**, define o carga tus objetivos semanales, revisa filtros y abre el menú flotante **Exportar → PDF** o **PNG**.
5. El informe se genera en **Carta vertical**, dos tablas dinámicas de folios y un bloque amplio para escribir comentarios/plan de trabajo a mano. Si son más de 50 ventas completadas se reparte en hojas adicionales. Para PDF desactiva los encabezados y pies automáticos del navegador.
6. En **Ajustes → 15** modifica nombres, títulos, etiquetas, líneas, color y elementos visibles; guarda la plantilla. La cuenta sincroniza los ajustes a través de Netlify Identity y Functions.

No se requiere otra migración SQL ni reimportar archivos. La V2.5.2 conserva la tabla de incidencias creada en V2.5.0. **Verifica el resultado PDF/PNG en Netlify**, porque la compilación real y la navegación automatizada no pudieron finalizarse en este entorno.

---

## V2.5.0 · Antes de reemplazar el repositorio

El ZIP incluye una nueva migración de Netlify Database para las incidencias. Debes subir **todos los archivos y carpetas**, incluyendo `netlify/database/migrations/20261113180000_create_incidents.sql` y `netlify/functions/incidents.js`; reemplazar solamente `index.html` no basta.

1. Haz copia de seguridad del repositorio y de los XLS actuales.
2. Descomprime en la raíz del repositorio; conserva las carpetas `src`, `netlify` y `public`.
3. Ejecuta `npm run check && npm test` si tienes Node/npm disponibles.
4. Publica con `git add -A && git commit -m "INVEX V2.5.0 incidencias y navegacion" && git push origin HEAD`.
5. Comprueba el despliegue Netlify: el nuevo SQL de `netlify/database/migrations` se aplica automáticamente justo antes de publicar.
6. Entra con tu cuenta y abre **Gestión de incidencias**. Comprueba que puedas registrar un folio, comentar y volver a encontrarlo tras actualizar o reemplazar el XLS.
7. Ajustes → **14. Orden de páginas y página principal** permite cambiar la pantalla inicial, predeterminada en Comparativa diaria. El nuevo menú flotante concentra exportaciones.

**Precaución de migración:** deja los XLS históricos en el sistema hasta que las incidencias marcadas anteriormente se hayan podido convertir a registros por folio. Si se eliminaron previamente y solo queda la marca ligada al identificador interno antiguo, la migración no puede deducir el folio perdido.

---

## Novedad heredada V2.4.9 · No ingresar la contraseña cada visita

1. Publica el ZIP completo; no es necesaria una migración SQL.
2. Inicia sesión **una vez** en el navegador donde usas el dashboard. Al volver a abrirlo después de unas horas, la sesión debería restaurarse automáticamente con Netlify Identity.
3. La aplicación recuerda el acceso **hasta 7 días desde ese ingreso**, no siete días renovables por visita. Tras ese plazo vuelve a pedir autenticación. Al pulsar **Cerrar sesión**, el acceso termina inmediatamente.
4. Prueba cerrando la pestaña y volviendo a abrirla sin usar incógnito ni eliminar cookies. El navegador debe permitir cookies del sitio. Si la configuración de Netlify Identity da una vigencia menor al token de renovación, podrá pedir login antes; el frontend no modifica ese límite del servidor.
5. Se conservaron los cambios recientes de WhatsApp: sin fecha duplicada y etiquetas de ocho caracteres.

# Dashboard Mérida V2.4.9 — instalación

Esta entrega contiene el proyecto completo: `index.html`, `src/`, `netlify/`, `public/`, `package.json` y documentación. No requiere migraciones SQL adicionales ni reimportar los XLS.

## Publicar en GitHub y Netlify

1. Extrae el ZIP. Sustituye en la **raíz** del repositorio todos los archivos y carpetas del proyecto, **sin** crear una carpeta adicional por encima de `index.html`.
2. Desde Termux, dentro de tu repositorio: `git add -A && git commit -m "INVEX v2.4.9 sesion 7 dias" && git push origin HEAD`.
3. Netlify construye el sitio conectado a GitHub con comando `npm run build` y directorio `dist`. Verifica que el despliegue termine correctamente.
4. Para probar desde un computador con Node instalado: `npm install`, `npm run check`, `npm run dev`. Abre la URL que indique Vite. El despliegue cloud seguirá requiriendo Identity y sus Functions.

## Revisar después de publicar

1. Confirma que todos los pies de página de la web y exportaciones muestren **Versión 2.4.9**.
2. Abre **Ajustes → 10**: mínimo predeterminado **60%** para las calidades individuales. En **Ajustes → 12**, comprueba los cuatro mínimos de 60% y la nueva casilla **Incluir las ventas propias del supervisor en el cumplimiento del módulo**, marcada por defecto.
3. En Ajustes 12, configura el **bono base** del supervisor y revisa los bonos adicionales, 110%/115%/120%, con importes iniciales **$1,000/$1,500/$2,000** y monto más alto **único** (no acumulativo).
4. Guarda la configuración del supervisor para sincronizarla a tu cuenta. Los mínimos antiguos de 0 se migran a 60 al cargar; puedes escribir 0 de nuevo si lo deseas después de guardar esta versión.
5. Prueba un cumplimiento de 80%, 100% y 120%: `Bono base × AG/100 × min(1, Cumplimiento/100)`. No se multiplica por 120% cuando el cumplimiento está sobre 100%.
6. Activa/desactiva la casilla y verifica el total de ventas usado en Cumplimiento; el escalón de venta propia siempre corresponde a las ventas del equipo sin supervisores.

## Fórmulas

- Individual = (alcance real / requerido) × 100; si el resultado queda **por debajo de 60%**, se convierte en cero (mínimo editable).
- Cumplimiento y Programa Cero: **sin tope**. Primera compra y APP: **máximo 100%**. Dental no es un quinto factor.
- Calidad Total = min(100, (Cumplimiento + Primera compra + Programa Cero + APP) / 4).
- Alcance Global = (Cumplimiento + Primera compra + Programa Cero + APP + Calidad Total) / 5; sin tope.
- Bono del supervisor antes de extras y descuentos = Bono base × Alcance Global/100 × min(1, Cumplimiento módulo/100).

La fórmula detallada, la migración y las diferencias entre tasas de cumplimiento se documentan también al inicio de `README.md`.

## Bono por dinámica (novedad V2.4.7)

1. Abre **Ajustes → 13. Bono por dinámica**, introduce un monto fijo en pesos mexicanos por venta válida y guarda. Se cierra automáticamente la ventana de Ajustes después de validar y guardar. También puedes usar el botón superior **Guardar ajustes y cerrar**.
2. Ve a la tabla de registros y marca **Bono adicional** solamente en las ventas que participen en la dinámica. La columna figura también en la página de todos los registros, Logros semanales y las tablas del supervisor.
3. Para los ejecutivos, el monto se suma **después** de todas las penalizaciones y recuperaciones. Para supervisores, se paga únicamente por sus ventas propias válidas marcadas y se suma al final de sus otras comisiones.
4. Los folios cancelados, incompletos, rechazados, sin código o con incidencia no reciben el bono. Una marca guardada en una venta que posteriormente tenga incidencia no genera pago mientras siga excluida.
5. El valor se sincroniza en la nube únicamente con una sesión válida. Revisa el indicador de «En la nube» antes de salir. Los XLS existentes continúan siendo compatibles; no es necesaria ninguna migración de base de datos.

**Verificación rápida:** con un monto de $50 y 2 ventas pagables marcadas, agrega $100 al total neto, después de descuentos. Un folio con incidencia marcado no agrega $50.


## Exportación de supervisor V2.4.7
Selecciona Calculadora de supervisor, semana y supervisor. Usa **Imprimir / PDF** para el diseño A4 vertical o **Exportar PNG** para la imagen de alta resolución. Las secciones se incluyen según sus casillas «Imprimir»; la tabla de folios del equipo comienza desactivada para conservar el formato compacto. Se conservan los cálculos y controles del bono por dinámica introducidos en V2.4.6.

## Nuevo: reporte diario para WhatsApp · V2.4.8

1. Importa o selecciona un XLS con registros.
2. Abre **Comparativa diaria** y verifica las dos fechas y la casilla de incluir supervisores.
3. Toca el botón flotante verde **Copiar para WhatsApp** en la esquina inferior derecha.
4. Pega directamente en WhatsApp el mensaje completo. Conservar las tres comillas invertidas de apertura y cierre permite que los valores se vean como una tabla monoespaciada.
5. Comprueba que los primeros seis valores coincidan con la fila TOTAL de «Por módulo»; Calidad usa el mismo porcentaje de esa fila y calcula diferencia en puntos porcentuales.
