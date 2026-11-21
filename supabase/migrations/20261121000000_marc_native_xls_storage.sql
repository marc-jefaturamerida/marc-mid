-- MARC V4 — INSTALACIÓN ADITIVA. NO BORRA NI CAMBIA dashboard_reports.
-- Contenido XLS: Supabase Storage privado. Catálogo: PostgreSQL con RLS.
BEGIN;
CREATE TABLE IF NOT EXISTS public.marc_xls_archives (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL CHECK (id ~ '^xls_[a-zA-Z0-9_-]{5,90}$'),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0 CHECK(file_size >= 0),
  fingerprint TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
  storage_path TEXT NOT NULL,
  row_count INTEGER NOT NULL CHECK(row_count BETWEEN 1 AND 50000),
  added_at BIGINT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','ready')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,id),
  UNIQUE(owner_id,fingerprint),
  UNIQUE(owner_id,storage_path),
  CONSTRAINT archive_path_matches_owner CHECK(split_part(storage_path,'/',1)=owner_id::text)
);
CREATE INDEX IF NOT EXISTS marc_xls_owner_time_idx
 ON public.marc_xls_archives(owner_id,added_at,id);
ALTER TABLE public.marc_xls_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.marc_xls_archives FROM PUBLIC,anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.marc_xls_archives TO authenticated;
DROP POLICY IF EXISTS marc_xls_select_self ON public.marc_xls_archives;
DROP POLICY IF EXISTS marc_xls_insert_self ON public.marc_xls_archives;
DROP POLICY IF EXISTS marc_xls_update_self ON public.marc_xls_archives;
DROP POLICY IF EXISTS marc_xls_delete_self ON public.marc_xls_archives;
CREATE POLICY marc_xls_select_self ON public.marc_xls_archives FOR SELECT TO authenticated
 USING(owner_id=(select auth.uid()));
CREATE POLICY marc_xls_insert_self ON public.marc_xls_archives FOR INSERT TO authenticated
 WITH CHECK(owner_id=(select auth.uid()));
CREATE POLICY marc_xls_update_self ON public.marc_xls_archives FOR UPDATE TO authenticated
 USING(owner_id=(select auth.uid())) WITH CHECK(owner_id=(select auth.uid()));
CREATE POLICY marc_xls_delete_self ON public.marc_xls_archives FOR DELETE TO authenticated
 USING(owner_id=(select auth.uid()));

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('marc-xls-private','marc-xls-private',false,52428800,ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;
UPDATE storage.buckets SET public=false WHERE id='marc-xls-private';
DROP POLICY IF EXISTS marc_xls_objects_select_self ON storage.objects;
DROP POLICY IF EXISTS marc_xls_objects_insert_self ON storage.objects;
DROP POLICY IF EXISTS marc_xls_objects_delete_self ON storage.objects;
CREATE POLICY marc_xls_objects_select_self ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='marc-xls-private' AND (storage.foldername(name))[1]=(select auth.uid())::text);
CREATE POLICY marc_xls_objects_insert_self ON storage.objects FOR INSERT TO authenticated
 WITH CHECK(bucket_id='marc-xls-private' AND (storage.foldername(name))[1]=(select auth.uid())::text);
CREATE POLICY marc_xls_objects_delete_self ON storage.objects FOR DELETE TO authenticated
 USING(bucket_id='marc-xls-private' AND (storage.foldername(name))[1]=(select auth.uid())::text);
COMMIT;
