# Jefatura Mid Marc V2.7 · Cómo actualizar

1. Haz un respaldo de tu repositorio actual y exporta los ajustes JSON en Ajustes. Conserva las bases PostgreSQL y archivos XLS previos.
2. Descomprime el ZIP **completo** en la raíz del repositorio. Reemplaza `index.html`, `src/`, `public/`, `netlify/`, `tests/` y archivos de configuración. No subas el ZIP como un solo archivo al repositorio.
3. Comprueba que en Netlify Database se ejecutó la migración `netlify/database/migrations/20261116080000_jefatura_v27_audit_trash.sql`: debe existir la columna `deleted_at` en `dashboard_incidents` y la tabla `dashboard_audit_events`. Si no existe, ejecuta la migración con las herramientas correspondientes a tu entorno antes de habilitar el nuevo sistema.
4. Ejecuta en la carpeta de tu repositorio:

```bash
npm install
npm run check
npm test
npm run build
git add -A
git commit -m "Jefatura Mid Marc V2.7 mejoras completas"
git push origin HEAD
```

5. Netlify debe usar `npm run build`, publicar `dist/` y conservar Identity y Database. No cambies los usuarios ni borres tablas.
6. Revisa con una cuenta de prueba: XLS con vista previa, historial, calculadoras, tres simulaciones, módulos activos/inactivos y vigencias, dashboard y alertas, móviles, crear-eliminar-restaurar incidencia, auditoría, recordatorios, exportación de ajustes y dos sesiones abiertas con modificaciones diferentes para comprobar el bloqueo de sobrescrituras.
7. **Ante un conflicto:** exporta primero ajustes JSON; luego puedes usar «Resolver conflicto de ajustes» para descartar solo cambios pendientes y recargar la versión remota. No ignores ese aviso.

El manual vigente es `MANUAL_USUARIO_JEFATURA_MID_MARC_V27.md`; los cambios técnicos están en `CHANGELOG.md`.

**Estado de pruebas en la entrega:** sintaxis y tests pasan. No se pudo completar la instalación de dependencias para ejecutar el build local; se requiere validar build y flujos reales de Netlify antes de usar en producción.
