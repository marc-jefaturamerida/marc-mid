# Dashboard y comisiones Mérida — V1.9.2 Online (modo ahorro)

Esta versión actualiza el proyecto V1.8 de Netlify con **menos consultas y escrituras**, conservando los cinco apartados, los datos de PostgreSQL y el ingreso por correo mediante Netlify Identity.

## Actualizar un sitio existente

1. Descomprime el ZIP y abre su carpeta: verás `index.html`, `package.json`, `netlify.toml`, `src/` y `netlify/`.
2. En el repositorio vinculado a Netlify (`marc-jefaturamerida/Dasboard`), **reemplaza los archivos existentes conservando las rutas exactas**. Sube todos los archivos de `src/`, `netlify/functions/`, `netlify/lib/` y `netlify/database/migrations/`; no subas únicamente el HTML ni crees una carpeta `dashboard_merida_netlify_1_9` dentro del repositorio.
3. Mantén la rama `main` y confirma los cambios con **Commit changes**. Netlify volverá a desplegar automáticamente.
4. Comprueba que el despliegue esté **Published** y que en **Cloud compute → Functions** figuren `settings`, `files`, `sync` y `health`.
5. Abre `https://dashboard-merida.netlify.app/.netlify/functions/health`. Debe responder con un JSON que contenga `"ok": true`.
6. Inicia sesión, pulsa **↻ Sincronizar** una vez y verifica que los XLS y ajustes antiguos siguen visibles.

**No elimines la base de datos, ni sus tablas, ni los XLS guardados.** Los scripts de migración incluidos usan `CREATE TABLE IF NOT EXISTS` y no borran información. Se incluyen la migración base y la migración correctiva de V1.8 para repositorios que la omitieron.

## ¿Qué ahorra créditos?

| Antes (V1.8) | Ahora (V1.9.2) |
| --- | --- |
| Verificación automática cada 60 segundos, incluso si no hay cambios | No existe intervalo de consultas a PostgreSQL |
| Al volver a la ventana se consultaban ajustes y metadatos de XLS en dos peticiones | Única consulta `GET /api/sync` solo si hubo una ausencia de **10 minutos o más** |
| Cada preferencia modificada se guardaba en una operación individual | Varias claves se guardan en una sola petición `PUT /api/settings` y una sola sentencia SQL |
| Guardado a los 0.8 segundos de la última edición | Guardado por lotes **3 segundos** después de la última edición |
| Historial XLS recuperado de uno en uno | Hasta **8 XLS pequeños por petición**, con límite de tamaño para evitar errores en Functions |
| Los cambios que todavía no se enviaban se mantenían solo en memoria | Cola local pendiente por cuenta, conservada ante cierres y cortes de conexión |

El botón **↻ Sincronizar** guarda cualquier cambio pendiente y recarga la página para obtener la información más reciente. Mientras la página permanezca abierta y activa no se harán consultas periódicas. Al regresar después de una pausa superior a diez minutos se realiza una comprobación; si no hubo cambios remotos, no se recargan todos los archivos. Los cambios hechos desde otro dispositivo pueden requerir **↻ Sincronizar** para aparecer inmediatamente.

El indicador junto al botón de inicio de sesión distingue **En la nube**, **Guardando**, **Pendiente de guardar** y **Sin conexión**. Un cambio no se considera sincronizado hasta que la Function confirme su escritura.

## Cambios compatibles

- Se preservan las cinco páginas y las reglas de comisiones, incluidas las incidencias y exclusiones.
- Se conserva el almacenamiento de los XLS originales convertidos a filas JSONB en `dashboard_reports`.
- Se conservan las preferencias de la V1.8 y sus claves históricas en `dashboard_settings`.
- Se permite sincronizar la clave de configuración visual de tablas `wmSamsTablaVisualV18`, que antes estaba ausente de la lista permitida del servidor.
- Se eliminó la explicación fija que habías pedido retirar del reporte de *Comparativa diaria*, sin alterar sus datos.
- La nota explicativa configurable por página de los reportes sigue disponible en Ajustes.
- Los XLS sin sesión siguen siendo temporales.
- PDF, PNG, CSV y los cálculos continúan ejecutándose en el navegador, sin funciones de servidor adicionales.

## Archivos del proyecto

```
index.html
package.json
netlify.toml
src/
  cloud-boot.js                 Sesión, cola de cambios, sincronización económica
  legacy-app.js                 Dashboard de cinco páginas y reportes
netlify/
  lib/_shared.js               Verificación de sesión y acceso a PostgreSQL
  functions/settings.js        Lectura / escritura agrupada de ajustes
  functions/files.js           Historial XLS paginado, importación y borrado
  functions/sync.js            Comprobación de cambios tras inactividad larga
  functions/health.js          Diagnóstico de publicación de Functions
  database/migrations/
    20261111010000_create_dashboard_tables.sql
    20261111061500_ensure_dashboard_tables.sql
```

## Verificaciones después del despliegue

1. Abre la página con tu cuenta y consulta una comparativa.
2. Cambia al menos dos ajustes en menos de 3 segundos; observa **Guardando en la nube…** y, al terminar, **En la nube**.
3. Pulsa **↻ Sincronizar** y comprueba que los ajustes continúan.
4. Abre el Dashboard en otro dispositivo, inicia sesión con la misma cuenta y verifica la configuración.
5. En Netlify Database observa si la base puede dormir durante un periodo sin uso. La reducción real de créditos depende de tu frecuencia de uso, volumen de XLS, otros servicios, plan y configuración de cómputo.

## Importante sobre fallos de conexión

Los cambios pendientes se guardan localmente **por cuenta de Identity**. Si la red falla, el indicador muestra que no están confirmados; la aplicación hace como máximo dos reintentos automáticos espaciados, y vuelve a intentar cuando recupera la conexión o cuando pulsas **↻ Sincronizar**. No cierres sesión descartando ajustes pendientes si necesitas conservarlos.

La cola local de preferencias se almacena en el navegador y no equivale a un respaldo remoto. No borres los datos del navegador mientras existan cambios pendientes. Las operaciones de alta o borrado de XLS requieren respuesta exitosa del servidor; no se ponen en cola.

Las consultas pueden reactivarse ocasionalmente al retornar después de una inactividad prolongada. Esta es una aplicación con actualización bajo demanda, **no sincronización en tiempo real entre ventanas abiertas**.

## Compilación

Netlify debe utilizar **Build command:** `npm run build`, **Publish directory:** `dist`, **Functions directory:** `netlify/functions`. `netlify.toml` ya contiene la configuración. Las dependencias se instalan con `npm install` en Netlify. Verifica la sintaxis con `npm run check`.

## Nota de mantenimiento V1.9.2

Los filtros de búsqueda de la tabla de folios y “Mostrar folios sin código” son locales a la pestaña del navegador; no utilizan Netlify Functions ni la base de datos. La selección de columnas visibles sigue sincronizada entre dispositivos.

## Corrección V1.9.2 — seleccionar no equivale a editar

Cambiar ejecutivo o semana en la calculadora **solo recalcula en el navegador**.
El estado calculado ya no se guarda mediante `wmSamsComisionesV1` por esa navegación.
Los filtros de fechas, módulo, búsqueda de folios y comparativas también son locales.
Modificar una meta/recuperación, tarifa, columna visible o marca de folio sí es una edición real y se sincroniza.
La etiqueta «Pendiente de guardar» debe permanecer igual al elegir semana o ejecutivo, salvo que hubiera una edición previa todavía pendiente.
