# INVEX V2.6.0 · Guía rápida

Descomprime **todos** los archivos del ZIP en la raíz del repositorio GitHub; conserva las carpetas `src/`, `public/`, `netlify/` y `tests/`. Reemplaza los archivos existentes después de respaldarlos.

```bash
cd ~/marc-mid
unzip -o ~/storage/downloads/INVEX_V260_GESTION_REGISTROS_FILTROS_GITHUB_NETLIFY.zip -d .
node --check src/legacy-app.js
git add -A
git commit -m "INVEX V2.6.0 filtros y edicion de registros"
git push origin HEAD
```

Después de desplegar en Netlify, revisa la nueva barra de folios y el menú flotante **Filtros**. Selecciona un registro, prueba **Editar** y **Restaurar**, y realiza una edición múltiple. Las correcciones son lógicas y se guardan en los ajustes de la cuenta, **no alteran el XLS original**. Las casillas de incidencia deben guardarse con una sesión activa.

Manual completo: `MANUAL_USUARIO_INVEX_V260.md` o `public/MANUAL_INVEX_V260.pdf`; guía técnica de cambios: `CHANGELOG.md`. No requiere nuevas migraciones SQL. La compilación de Netlify y la prueba en navegador publicado están pendientes.
