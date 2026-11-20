-- Solo lectura: no modifica archivos ni esquema.
-- Ejecutar manualmente en Supabase SQL Editor SOLO si aún faltan filas.
SELECT COUNT(*) AS total_archivos,
       COUNT(*) FILTER (WHERE jsonb_typeof(headers) <> 'array') AS encabezados_no_array,
       COUNT(*) FILTER (WHERE jsonb_typeof(rows) <> 'array') AS filas_no_array,
       COUNT(*) FILTER (WHERE jsonb_typeof(headers)='array' AND jsonb_array_length(headers)=0) AS encabezados_vacios,
       COUNT(*) FILTER (WHERE jsonb_typeof(rows)='array' AND jsonb_array_length(rows)=0) AS filas_vacias
FROM public.dashboard_reports;
