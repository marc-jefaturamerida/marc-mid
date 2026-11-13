# Dashboard Mérida V2.4.8 — instalación

Esta entrega contiene el proyecto completo: `index.html`, `src/`, `netlify/`, `public/`, `package.json` y documentación. No requiere migraciones SQL adicionales ni reimportar los XLS.

## Publicar en GitHub y Netlify

1. Extrae el ZIP. Sustituye en la **raíz** del repositorio todos los archivos y carpetas del proyecto, **sin** crear una carpeta adicional por encima de `index.html`.
2. Desde Termux, dentro de tu repositorio: `git add -A && git commit -m "INVEX v2.4.8 reporte diario whatsapp" && git push origin HEAD`.
3. Netlify construye el sitio conectado a GitHub con comando `npm run build` y directorio `dist`. Verifica que el despliegue termine correctamente.
4. Para probar desde un computador con Node instalado: `npm install`, `npm run check`, `npm run dev`. Abre la URL que indique Vite. El despliegue cloud seguirá requiriendo Identity y sus Functions.

## Revisar después de publicar

1. Confirma que todos los pies de página de la web y exportaciones muestren **Versión 2.4.8**.
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
