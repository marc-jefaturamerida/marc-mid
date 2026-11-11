# Dashboard y comisiones Mérida · V2.0.2 Online

Proyecto completo de Netlify. Incluye las cinco páginas anteriores, la nueva **Visita de coordinación** adaptada a teléfonos, Netlify Identity, Netlify Database (PostgreSQL), funciones de servidor y exportaciones PDF/PNG.

Lee **[INICIAR_AQUI.md](INICIAR_AQUI.md)** para publicar y configurar.

## Sexta página

La visita utiliza los archivos XLS de la cuenta. Se capturan cinco secciones, siguiendo los textos y fórmulas de `Visitas del coordinador.xlsx`. El usuario puede modificar los 12 criterios iniciales, añadir y quitar criterios, definir pesos individuales, modificar los puntos de cada sección, títulos, etiquetas, comentarios, umbral de calidad, encabezado y firma. Las fotos son las originales de la plantilla y pueden sustituirse por cuenta.

Las visitas se almacenan en `dashboard_visits` cuando se pulsa **Guardar visita**. Se pueden abrir y borrar desde la lista de visitas guardadas. La consulta del historial ocurre al abrir la página por primera vez o al pulsar **Actualizar historial**, no en cada filtro. Todos los datos se separan por identificador verificado de usuario.

## Publicación

- Build: `npm run build`
- Publish: `dist`
- Sin base directory si subes el contenido del ZIP a la raíz.
- Comprueba tres tablas: `dashboard_reports`, `dashboard_settings`, `dashboard_visits`.
- La carpeta `public/assets/` se copia automáticamente a `/assets/` en Netlify mediante Vite.
- Para confirmar las reglas del apartado III, revisa el detalle en `INICIAR_AQUI.md`.

**Aviso:** el cálculo de comisiones es una estimación. Una marca de «registro correcto» basada en campos XLS completos no acredita por sí sola el cumplimiento del proceso administrativo.


### Ajuste de impresión 2.0.1
Los cinco apartados muestran un cuadro fijo **Comentarios** a la derecha en PDF y PNG, incluso cuando el campo está vacío. Se conserva una hoja carta vertical con reducción proporcional del contenido cuando hay observaciones extensas. No cambia la base de datos ni la puntuación.

## Versión 2.0.2 · Detalle de comisiones

La Calculadora individual ahora incluye en Base y Simulación un desglose de cada concepto: total pagado, cantidad y tarifa unitaria vigente del escalón. Se incluye en PDF, PNG y CSV. La actualización es visual y no cambia la base de datos ni las reglas de cálculo.
