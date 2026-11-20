## Actualización obligatoria para V3.0.4.4

La nueva recuperación de XLS requiere **desplegar `supabase/functions/dashboard-api`**, además de publicar GitHub Pages. Si instalaste la integración oficial de GitHub con Supabase, confirma que el despliegue de producción de la Edge Function se ejecutó correctamente. No hace falta ninguna migración SQL nueva ni borrar XLS existentes.

El protocolo 2 agrega `GET /files?meta=1` con `protocol: 2`, `GET /files?part=info&id=...` y `GET /files?part=rows&id=...&offset=...&limit=...`. Estos endpoints exigen sesión Supabase Auth y nunca exponen la contraseña PostgreSQL al cliente.

Si no está habilitada la publicación automática de Edge Functions, despliega desde tu equipo (no pegues credenciales aquí):

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy dashboard-api --no-verify-jwt
```

La validación del usuario con `auth.getUser(token)` sigue dentro de la función; la autorización de orígenes sigue limitada a `DASHBOARD_ALLOWED_ORIGINS`. No habilites rutas públicas para los XLS.

---

# JEFATURA MID MARC V3.0.4.2 — Supabase + GitHub Pages

> Guía inicial con marcadores. Para concretar las URLs, el repositorio, el traspaso de XLS y los accesos, responder las preguntas del final. **La migración en vivo requiere probarse en el proyecto de Supabase antes de dar de baja Netlify.**

## Arquitectura

- **Frontend:** sitio estático Vite publicado en GitHub Pages (alternativamente Netlify si se conserva el hosting).
- **Identidad:** Supabase Auth por correo y contraseña, sustituyendo Netlify Identity solo en el modo Supabase.
- **Base de datos:** Supabase PostgreSQL, tablas privadas.
- **API:** una Edge Function `dashboard-api`, que expone rutas `files`, `settings`, `sync`, `incidents`, `visits`, `updates`, `audit`, `reset` y `health`. Las operaciones privadas comprueban el JWT con Supabase Auth antes de acceder a la base y filtran por propietario.
- **Modo anterior:** Netlify continúa operativo si se compila sin `VITE_CLOUD_PROVIDER=supabase`. No se cambia la base de datos original.

**Importante:** Supabase no aloja como sitio web esta página HTML. Necesita GitHub Pages, Netlify u otro hosting web. No coloques la contraseña de PostgreSQL ni la clave secreta de Supabase en `.env` `VITE_*`, HTML o GitHub Actions público. Solo la clave **publishable** es pública.

## 1. Crear o seleccionar proyecto en Supabase

1. En https://supabase.com/dashboard selecciona un proyecto existente o crea uno nuevo.
2. Guarda para ti el **Project reference**, la URL `https://<PROJECT_REF>.supabase.co` y la **publishable key** (`sb_publishable_...`, pública). No pegues aquí claves secretas ni contraseñas.
3. En **SQL Editor**, ejecuta en un proyecto NUEVO el archivo `supabase/migrations/20261120050000_dashboard_complete.sql`. Incluye las migraciones originales de Netlify y limita el acceso directo a todas las tablas: RLS habilitada y privilegios `anon/authenticated` revocados. No lo ejecutes sobre un proyecto con tablas del mismo nombre sin revisión.
4. En **Authentication → URL Configuration** configura el **Site URL** y las **Redirect URLs** de tu frontend, por ejemplo `https://<USUARIO>.github.io/<REPO>/` y `https://<USUARIO>.github.io/<REPO>/?reset=1` para recuperar contraseña.
5. En **Authentication → Users** crea o invita a las cuentas autorizadas. Para uso interno, deshabilita registros públicos en los ajustes de Auth si no necesitas auto-registro.

## 2. Conectar la Edge Function a la base

1. En Supabase > **Connect** consigue la cadena PostgreSQL apta para funciones serverless (preferentemente *pooler*, con SSL), con usuario y contraseña. **No la compartas en esta conversación.**
2. En **Edge Functions → Secrets** crea:
   - `DASHBOARD_DATABASE_URL`: cadena PostgreSQL completa, **secreta**, solo en servidor.
   - `DASHBOARD_ALLOWED_ORIGINS`: origen de la web, sin ruta; ejemplo `https://<USUARIO>.github.io` (si utilizas un dominio propio, usa ese dominio). No dejes esta variable vacía en producción.
3. Las variables de plataforma `SUPABASE_URL` y `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY` se leen dentro de la función para validar identidad. Si tu proyecto no las proporciona, configúralas según el panel actual; la clave publishable es pública, el token personal del usuario no.
4. Desde una consola en la carpeta del proyecto, con Supabase CLI instalado:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy dashboard-api --no-verify-jwt
```

`verify_jwt=false` aquí **no equivale a acceso libre**: `dashboard-api/_shared.js` valida cada `Authorization: Bearer` con `supabase.auth.getUser`, y la Function restringe los orígenes. No retires esa validación. La URL de la API será `https://<PROJECT_REF>.supabase.co/functions/v1/dashboard-api/files` (sin sesión debe responder 401 al proporcionar el origen autorizado).

## 3. Publicar interfaz en GitHub Pages

1. Copia el contenido completo del ZIP a la raíz de tu repositorio, conservando `src/`, `public/`, `supabase/`, `tests/`, `.github/`, `package.json` y `vite.config.js`.
2. Abre GitHub → tu repositorio → **Settings → Pages** → **Build and deployment** y selecciona **GitHub Actions**.
3. En el repositorio, **Settings → Secrets and variables → Actions → Variables** añade:
   - `SUPABASE_URL`: `https://<PROJECT_REF>.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: clave pública `sb_publishable_...`
   - `APP_BASE`: `/marc-mid/` si publicas el repositorio `marc-mid`; o `/<NOMBRE_DEL_REPO>/` si cambias de repo; para un dominio raíz, `/`.
4. En GitHub → Actions, ejecuta `Publicar interfaz en GitHub Pages` o actualiza la rama `main`. El flujo instala dependencias, ejecuta `npm run check` y `npm test`, compila Vite y publica `dist`.
5. Abre `https://<USUARIO>.github.io/<REPO>/` y prueba el acceso. Los XLS subidos sin iniciar sesión siguen siendo temporales. Con sesión, verifica listado, importación, recarga y exportación antes de migrar más datos.

**Para prueba local** (sin publicar la contraseña): copia `.env.example` a `.env`, completa valores *publishable*, luego `npm install`, `npm run dev`. `.env` está ignorado por Git.

## 4. Migración de historiales, cuentas e información anterior

**No existe migración automática en esta versión.** Supabase Auth genera identificadores de usuario nuevos distintos de Netlify Identity; por eso copiar filas con `owner_id` antiguos no basta. La base original en Netlify permanece intacta.

Opciones de transferencia:

- **Reimportación controlada:** iniciar sesión con una nueva cuenta de Supabase y volver a cargar XLS originales. Verificar que tengan los encabezados esperados. Para configuraciones, utilizar la exportación/importación JSON de preferencias del Dashboard.
- **Migración íntegra:** exportar PostgreSQL de Netlify, importar a Supabase y reasignar los `owner_id` al UUID de la cuenta correcta. Exige respaldos, confirmación de correspondencia de propietarios y pruebas de integridad para mantener incidencias, auditoría, solicitudes y visitas. No ejecutar sentencias de cambio de propietarios sin confirmar esas correspondencias.

No borres la base de Netlify mientras no se hayan comprobado los históricos y la identidad de cada propietario en Supabase.

## 5. Dónde revisar problemas

- **Autenticación 401:** Supabase Authentication → Users y URL Configuration; sesión caducada o JWT no válido.
- **CORS 403:** revisa `DASHBOARD_ALLOWED_ORIGINS`; debe ser el origen exacto sin la ruta `/marc-mid/`.
- **Error 500:** Edge Functions → Logs; verifica `DASHBOARD_DATABASE_URL`, SSL/pooler, tablas y permisos SQL.
- **Página sin estilos/scripts:** verifica `APP_BASE` y el nombre del repositorio.
- **No carga XLS:** comprueba la conexión privada, tamaño, carga completa y la respuesta de la función; no borres la tabla.

## 6. Datos para personalizar tu guía final

1. ¿Ya tienes creado un proyecto en Supabase? Comparte solo el **Project reference** o la URL pública (`https://<ref>.supabase.co`).
2. ¿Quieres publicar la página en el mismo repositorio GitHub `marc-jefaturamerida/marc-mid` con GitHub Pages, o prefieres seguir en Netlify y usar únicamente Supabase para los datos?
3. ¿Quieres trasladar **todo** el historial anterior (XLS, preferencias, incidencias, visitas, auditoría) o iniciar Supabase desde cero y volver a cargar XLS?
4. ¿La aplicación tendrá una sola cuenta con acceso o varios correos separados? Para migrar datos de varias cuentas necesitaríamos confirmar correspondencias, sin contraseñas.

**Seguridad:** no compartas aquí contraseñas, conexiones PostgreSQL completas, tokens personales, claves `service_role`, ni claves `sb_secret_`.
