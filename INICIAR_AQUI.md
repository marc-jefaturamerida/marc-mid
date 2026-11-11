# INICIAR AQUÍ — Dashboard y comisiones Mérida v1.9.2

Esta carpeta reúne **todos los archivos necesarios** para crear un repositorio nuevo y publicarlo con **otra cuenta de Netlify**. No es necesario combinarla con archivos de versiones anteriores.

## 1. Crear el repositorio en GitHub

1. Descomprime el ZIP.
2. Crea un repositorio nuevo, preferentemente **privado**.
3. Sube **el contenido de esta carpeta** a la raíz del repositorio (no el ZIP y no una carpeta contenedora adicional). Deben quedar `index.html`, `package.json` y `netlify.toml` en la raíz, junto con las carpetas `src/` y `netlify/`.
4. Comprueba que GitHub haya incluido todos los archivos dentro de `src/`, `netlify/functions/`, `netlify/lib/` y `netlify/database/migrations/`. Una carpeta vacía no se sube por sí sola.

## 2. Crear el sitio en la otra cuenta de Netlify

1. Accede a la **cuenta nueva de Netlify** y selecciona **Add new project → Import an existing project**.
2. Conecta el nuevo repositorio, usando la rama `main`.
3. Configuración de publicación: **Build command:** `npm run build`, **Publish directory:** `dist`, **Base directory:** vacío (raíz del repositorio).
4. Publica y revisa que Deploys indique `Published`. En `Data & storage → Database`, comprueba la creación de la base PostgreSQL y la aplicación de las migraciones SQL. El código de las tablas está en `netlify/database/migrations/`.
5. En `Cloud compute → Functions`, comprueba que estén publicadas **files**, **settings**, **sync** y **health**.
6. En `Data & storage → Identity`, habilita Identity, configura el registro **Invite only**, invita tu correo y completa el alta.
7. Abre la URL nueva y prueba el inicio de sesión, la carga de un XLS, la modificación de un ajuste y la sincronización desde otro dispositivo.

## 3. Qué cambia al usar otra cuenta

- **La base de datos nueva empieza vacía.** Los XLS y ajustes de tu cuenta anterior de Netlify **no se transfieren automáticamente**. Tendrás que volver a importar los XLS y configurar las preferencias, salvo que realices una migración de datos separada.
- **Los usuarios de Identity también son nuevos**: hay que volver a invitar y activar el correo.
- Nunca publiques XLS con datos de clientes dentro del repositorio.
- No borres la base de datos anterior hasta comprobar que recuperaste lo necesario.
- La versión 1.9.2 evita el sondeo continuo de PostgreSQL y realiza los cálculos y exportaciones en cada navegador. El consumo de créditos sigue dependiendo del uso real.

## Comprobación de estructura

```text
index.html
package.json
netlify.toml
.gitignore
README.md
CHANGELOG.md
INICIAR_AQUI.md
src/
  cloud-boot.js
  legacy-app.js
netlify/
  functions/
    files.js
    health.js
    settings.js
    sync.js
  lib/
    _shared.js
  database/
    migrations/
      20261111010000_create_dashboard_tables.sql
      20261111061500_ensure_dashboard_tables.sql
```

Para detalles de funcionamiento y ahorro de créditos consulta `README.md` y `CHANGELOG.md`.

## Ahorro adicional v1.9.2

Filtrar, buscar, cambiar fecha o cambiar el estado visible de los folios no manda datos a PostgreSQL. Los filtros de folios se guardan sólo en la pestaña actual (sessionStorage). Las columnas visibles sí se sincronizan.

## Actualización V1.9.2

Para actualizar un proyecto que ya funciona, basta cambiar `src/legacy-app.js` e `index.html` (el resto de archivos del ZIP queda compatible).
Para un repositorio nuevo, sube **todo el contenido** de esta carpeta con la estructura de subcarpetas.
El cambio evita sincronización al elegir ejecutivo/semana; no requiere reinicializar Netlify Database ni Identity.
