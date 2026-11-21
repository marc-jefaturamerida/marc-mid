# INSTALACIÓN COMPLETA V3.0.4.4

**Destino:** `marc-jefaturamerida/marc-mid` (rama `main`), GitHub Pages + Supabase.

## Antes de sustituir el repositorio

- Conserva una copia del repositorio actual en tu equipo (`git clone` o **Code → Download ZIP**).
- **No borres el proyecto Supabase, ni sus tablas, ni los XLS guardados.** La sustitución afecta únicamente al código de GitHub.
- **No borres la carpeta `.git`** de tu repositorio local. Usa un solo commit para quitar y reponer el código, evitando un sitio intermedio sin archivos.
- No publiques contraseñas, `DASHBOARD_DATABASE_URL`, claves de servicio, tokens o `.env` privados.

## Sustitución total con Git (una sola confirmación)

En una copia local **ya clonada** del repositorio, desde su carpeta raíz:

```bash
git status --short
# Verifica primero que no tienes cambios propios sin guardar.
git rm -r -- .
# Extrae el contenido del ZIP EN ESTA CARPETA, sin una carpeta envolvente.
# Asegúrate de incluir los archivos ocultos como .github.
git add -A
git commit -m "Jefatura MID MARC V3.0.4.4: historial XLS y deduplicacion"
git push origin main
```

También puedes utilizar GitHub Desktop: abre el repositorio local, elimina sus archivos salvo `.git`, extrae el contenido del ZIP en la raíz y pulsa **Commit to main → Push origin**. No subas únicamente el ZIP como archivo.

## Publicación y comprobaciones

1. GitHub → Actions: espera a que la publicación de Pages termine correctamente. Se ejecutan `npm run check`, `npm test` y `npm run build`.
2. Supabase → Project Settings → Integrations → GitHub: comprueba `main`, el directorio `.` y **Deploy to production**; `supabase/config.toml` ya incluye `[remotes.production]` para `feysztaielfexueulqkn`. La nueva `dashboard-api` DEBE publicarse; cambiar únicamente Pages no arregla el historial.
3. Supabase → Edge Functions → `dashboard-api`: comprueba que la nueva versión está desplegada y consulta los Logs si hay error. No necesitas repetir migraciones de SQL.
4. Abre `https://marc-jefaturamerida.github.io/marc-mid/`, recarga con Ctrl+Shift+R e inicia sesión.
5. Ve a Ajustes → Archivos XLS guardados → **Reintentar historial**. Si un XLS antiguo está incompleto no se habilitarán sus cálculos; eso no impedirá que el servidor guarde un archivo nuevo tras verificar la clave única de PostgreSQL.
6. Carga un XLS realmente distinto, guarda y recarga. Si el historial anterior sigue pendiente, aparecerá como guardado pendiente de lectura. Un XLS ya existente responderá 409 y no se duplicará.

## Si vuelve a fallar

- Un `200` en `/files?offset=0&limit=8` **no** garantiza que todas las filas se hayan leído.
- En los Logs de `dashboard-api`, el endpoint actualizado ofrece `GET /files?meta=1`, `GET /files?part=info&id=...` y `GET /files?part=rows&id=...&offset=...&limit=...`.
- Si ves «API anterior, sin lectura XLS por bloques», falta publicar la **Edge Function nueva**.
- Si el error indica `409`, el XLS ya estaba guardado en la cuenta. Reintenta la recuperación, no borres datos. Un `422` en `/files?part=info` señala un XLS previo mal estructurado y el servidor lo conserva intacto.
- No compartas contraseñas ni tokens al reportar errores.

## Consulta segura para diagnosticar archivos previos

En Supabase SQL Editor, puedes ejecutar esta consulta **de solo lectura**. También se incluye el archivo `DIAGNOSTICO_XLS_SOLO_LECTURA.sql` en la raíz del ZIP:

```sql
SELECT COUNT(*) AS total,
 COUNT(*) FILTER (WHERE jsonb_typeof(headers) <> 'array') AS encabezados_no_array,
 COUNT(*) FILTER (WHERE jsonb_typeof(rows) <> 'array') AS filas_no_array
FROM public.dashboard_reports;
```

No devuelve filas de clientes ni modifica registros. Comprueba que la Edge Function `dashboard-api` se haya desplegado en su nueva versión: de otro modo el bloqueo antiguo puede continuar.

## Estado de validación

Pruebas Node locales superadas. No se verifica aquí una sesión real en tu proyecto Supabase, y la compilación final la confirmará GitHub Actions.
