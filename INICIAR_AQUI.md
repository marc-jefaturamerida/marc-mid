# Actualización V3.0.4

Esta entrega actualiza el ZIP V3.0.3 con estados activos junto a objetivos, asignación rápida obligatoria y período por semanas o fechas para el comparativo. **Conserva la carpeta `netlify/` y los datos de PostgreSQL sin reinicializar tablas.** Antes de publicar, ejecuta `npm install`, `npm run check`, `npm test` y `npm run build`, y revisa CHANGELOG y manual.

# Jefatura Mid Marc V3.0 · GitHub + Netlify

**Proyecto base:** V2.7.1 corregida, versión de Netlify (no el servidor Termux/SQLite).

## Publicación

1. Realiza un respaldo de configuraciones e históricos antes de actualizar.
2. Descomprime el ZIP completo en la raíz de tu repositorio GitHub, reemplazando los archivos anteriores.
3. Conserva Netlify Identity y Database PostgreSQL y confirma que están aplicadas las migraciones anteriores:
   - `20261116080000_jefatura_v27_audit_trash.sql`
   - `20261116190000_jefatura_v271_record_updates.sql`
4. Ejecuta donde tengas Internet:

```bash
npm install
npm run check
npm test
npm run build
git add -A
git commit -m "Jefatura Mid Marc V3.0 Netlify"
git push origin HEAD
```

5. Netlify debe usar `npm run build` y publicar la carpeta `dist`. No hay migraciones SQL nuevas en V3.0.
6. Verifica antes de trabajar en producción: principal Dashboard Jefatura, selector semanal lunes-domingo, metas de Logros del perfil, menú flotante unificado, PDF descargado y nombre correcto, sincronización de otra sesión y fórmulas de comisión.

## Descargar PDF

En cada página pulsa **☰ Menú → Exportar → Descargar PDF**. El archivo se descarga con nombre automático construido desde el título de página, módulo o ejecutivo si existe filtro, y la fecha/semana consultada. La carpeta final la decide el navegador del equipo, normalmente Descargas; revisa sus ajustes si pide elegir destino.

## Notas

- No uses archivos de la edición local Wi-Fi ni migres a SQLite: son proyectos diferentes.
- Las metas antiguas capturadas en la sección retirada de Logros semanales quedan respaldadas bajo su clave existente, pero ya no participan en el cálculo de Logros.
- El motor de comisiones permanece sin cambios; revisa el manual `MANUAL_USUARIO_JEFATURA_MID_MARC_V304.md` (con actualización V3.0.4 al inicio).
- Sintaxis y pruebas automatizadas completadas; build completo y funcionamiento real en Netlify pendientes por falta de acceso al registro npm durante esta entrega.


**Menú de configuración:** desde cualquier página, pulsa **Menú → Configuración**. Se abrirá una ventana con opciones relacionadas con esa página; selecciona **Guardar y volver a la página** para cerrar. No se modifica la base de datos ni hace falta migración adicional.


### Mejoras del menú V3.0 (actualización)

Dashboard de Jefatura cuenta con filtros ampliados y porcentajes mínimos individuales de alerta en Menú → Configuración. Incidencias y Actualizaciones tienen botón Copiar reporte en sus detalles. Logros semanales ofrece Menú → Exportar → Copiar folios comisionables. Consulta el apartado 31 del manual para conocer el alcance de cada filtro y los formatos de texto.


### Verificación de actualizaciones al 19 de noviembre de 2026

Después del despliegue, prueba desde la Comparativa diaria los dos botones de copia del menú Exportar, usando una semana con objetivos configurados y ventas comisionables. Comprueba también el guardado de una visita desde el celular. Los registros y las fórmulas de comisión no se migran. Ejecuta `npm run check` y `npm test` en el repositorio antes de publicar.
