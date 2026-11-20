# Corrección focalizada — Importación XLS con Supabase (V3.0.4.2)

## Síntoma
La solicitud `GET /functions/v1/dashboard-api/files?offset=0&limit=8` responde HTTP 200, pero el cliente considera el historial incompleto y no permite importar el primer XLS con sesión iniciada.

Un HTTP 200 confirma la respuesta del servidor, no que el navegador haya podido procesar todas las filas. La causa exacta del rechazo del historial debe verse en Ajustes → Archivos XLS guardados, bajo «Historial XLS incompleto».

## Corrección
- El importador mantiene el intento de recuperar íntegramente el historial, sin modificar datos.
- Si falla, consulta `GET /functions/v1/dashboard-api/files?meta=1`, una ruta YA EXISTENTE en `dashboard-api` que devuelve únicamente identificadores y firmas de archivos de la cuenta autenticada.
- **Si el servidor confirma 0 archivos previos**: puede guardarse el primer XLS y comenzar el historial de esa cuenta sin marcar como vacío un historial desconocido.
- **Si existen archivos previos que no se pueden descargar**: no se permite guardar ni presentar acumulados parciales. Se muestra el número de archivos afectados y la causa original para diagnosticarlo.
- Si el catálogo de metadatos falla, NO se realiza ningún POST.
- La base de datos conserva la restricción única `(owner_id, fingerprint)` para proteger duplicados.

No se modificaron las funciones Edge, el esquema SQL, las fórmulas de comisiones ni los registros existentes. No se necesita volver a desplegar `dashboard-api` para este parche.

## Instalar en GitHub (sin Termux)
Desde la rama `main` del repositorio `marc-jefaturamerida/marc-mid` reemplazar exactamente estos archivos:

1. `src/legacy-app.js`
2. `src/supabase-boot.js`
3. `tests/validate-v3042.mjs`

Guardar `Commit changes` y comprobar en Actions que pasen `npm run check`, `npm test`, `npm run build` y la publicación de GitHub Pages. Recargar la web con Ctrl + Shift + R.

**No** subir el ZIP comprimido a la raíz, no alterar los secretos de Supabase, no ejecutar migraciones, no borrar tablas ni archivos.

## Prueba
1. Iniciar sesión.
2. Elegir un XLS y aceptar la vista previa.
3. Si la cuenta no tiene XLS previos, comprobar que aparezca `Guardado en Supabase`.
4. Recargar y comprobar persistencia del XLS.
5. Si el mensaje dice que existen N XLS no legibles, abrir Ajustes → Archivos XLS guardados y copiar solamente la causa técnica (sin datos de clientes ni credenciales).

## Validación local
- `npm run check`: OK
- `npm test`: OK
- Pruebas nuevas: historial vacío remoto, duplicado remoto, historial no legible con registros previos y error en catálogo: OK.

La prueba real del servidor de la persona usuaria requiere publicar el parche; no se ha realizado desde este entorno.
