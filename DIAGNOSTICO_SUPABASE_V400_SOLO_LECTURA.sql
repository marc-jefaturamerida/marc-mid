-- CONSULTA DE SOLO LECTURA: no modifica filas, buckets ni secretos.
SELECT
  (SELECT count(*) FROM public.marc_xls_archives) AS archivos_v4,
  (SELECT count(*) FROM public.marc_xls_archives WHERE state='ready') AS listos_para_calculos,
  (SELECT count(*) FROM public.marc_xls_archives WHERE state='pending') AS cargas_pendientes,
  (SELECT count(*) FROM public.dashboard_reports) AS archivos_antiguos_conservados;

SELECT id,file_name,row_count,state,added_at,created_at
FROM public.marc_xls_archives ORDER BY created_at DESC LIMIT 20;

SELECT id,name,public,file_size_limit,allowed_mime_types
FROM storage.buckets WHERE id='marc-xls-private';
