-- Supabase V3.0.4.2: ejecutar UNA VEZ en proyecto nuevo desde SQL Editor.

-- Tablas privadas; solo accesibles mediante Edge Functions autenticadas.

BEGIN;

-- Original: 20261111010000_create_dashboard_tables.sql
-- Esquema de Dashboard y comisiones Mérida 1.8.
-- La identidad del usuario se valida en la Function y NUNCA llega como parámetro de cliente.
CREATE TABLE IF NOT EXISTS dashboard_reports (
  owner_id TEXT NOT NULL,
  id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  fingerprint TEXT NOT NULL,
  headers JSONB NOT NULL,
  rows JSONB NOT NULL,
  added_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  UNIQUE (owner_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS dashboard_reports_owner_time_idx
 ON dashboard_reports (owner_id, added_at DESC);

CREATE TABLE IF NOT EXISTS dashboard_settings (
  owner_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, setting_key)
);
CREATE INDEX IF NOT EXISTS dashboard_settings_owner_updated_idx
 ON dashboard_settings (owner_id, updated_at DESC);


-- Original: 20261111061500_ensure_dashboard_tables.sql
-- Esquema de Dashboard y comisiones Mérida 1.8.
-- La identidad del usuario se valida en la Function y NUNCA llega como parámetro de cliente.
CREATE TABLE IF NOT EXISTS dashboard_reports (
  owner_id TEXT NOT NULL,
  id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  fingerprint TEXT NOT NULL,
  headers JSONB NOT NULL,
  rows JSONB NOT NULL,
  added_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  UNIQUE (owner_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS dashboard_reports_owner_time_idx
 ON dashboard_reports (owner_id, added_at DESC);

CREATE TABLE IF NOT EXISTS dashboard_settings (
  owner_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, setting_key)
);
CREATE INDEX IF NOT EXISTS dashboard_settings_owner_updated_idx
 ON dashboard_settings (owner_id, updated_at DESC);


-- Original: 20261111190000_create_dashboard_visits.sql
-- Visitas de coordinación, cada acuse solo visible para la cuenta que lo guardó.
CREATE TABLE IF NOT EXISTS dashboard_visits (
 owner_id TEXT NOT NULL,
 id TEXT NOT NULL,
 visited_at DATE NOT NULL,
 module_name TEXT NOT NULL,
 supervisor_name TEXT NOT NULL,
 content JSONB NOT NULL,
 total_score NUMERIC(8,2) NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,id)
);
CREATE INDEX IF NOT EXISTS dashboard_visits_owner_date_idx ON dashboard_visits(owner_id,visited_at DESC,created_at DESC);


-- Original: 20261113180000_create_incidents.sql
-- V2.5.0: incidencias independientes del historial XLS y aisladas por cuenta Identity.
CREATE TABLE IF NOT EXISTS dashboard_incidents (
  owner_id TEXT NOT NULL,
  folio_key TEXT NOT NULL,
  folio TEXT NOT NULL,
  module TEXT NOT NULL DEFAULT '',
  executive TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  PRIMARY KEY(owner_id,folio_key),
  CONSTRAINT dashboard_incidents_comments_array CHECK(jsonb_typeof(comments)='array')
);
CREATE INDEX IF NOT EXISTS dashboard_incidents_owner_updated_idx
ON dashboard_incidents(owner_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS dashboard_incidents_owner_active_idx
ON dashboard_incidents(owner_id,active,resolved);


-- Original: 20261116080000_jefatura_v27_audit_trash.sql
-- Jefatura Mid Marc V2.7. Soft-delete and audit trail: no changes to existing sales, commission or report tables.
ALTER TABLE dashboard_incidents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS dashboard_incidents_owner_trash_idx ON dashboard_incidents(owner_id,deleted_at DESC);
CREATE TABLE IF NOT EXISTS dashboard_audit_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, owner_id TEXT NOT NULL, actor_id TEXT NOT NULL,
 entity_type TEXT NOT NULL, entity_key TEXT NOT NULL, operation TEXT NOT NULL,
 details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dashboard_audit_owner_time_idx ON dashboard_audit_events(owner_id,created_at DESC);


-- Original: 20261116190000_jefatura_v271_record_updates.sql
-- V2.7.1: solicitudes separadas de XLS y de comisiones, aisladas por cuenta Identity.
CREATE TABLE IF NOT EXISTS dashboard_update_requests (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner_id TEXT NOT NULL,
 record_key TEXT NOT NULL,
 folio TEXT NOT NULL DEFAULT '',
 module TEXT NOT NULL DEFAULT '',
 executive TEXT NOT NULL DEFAULT '',
 record_date TEXT NOT NULL DEFAULT '',
 available_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
 requested_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
 comments JSONB NOT NULL DEFAULT '[]'::jsonb,
 applied_values JSONB NOT NULL DEFAULT '{}'::jsonb,
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
 revision BIGINT NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 resolved_at TIMESTAMPTZ,
 deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_updates_one_pending_idx
 ON dashboard_update_requests(owner_id,record_key)
 WHERE status='pending' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS dashboard_updates_owner_filter_idx
 ON dashboard_update_requests(owner_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS dashboard_updates_owner_trash_idx
 ON dashboard_update_requests(owner_id,deleted_at);


-- No exponer los historiales a clientes directos vía PostgREST.
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY['dashboard_reports','dashboard_settings','dashboard_visits','dashboard_incidents','dashboard_audit_events','dashboard_update_requests']) LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
 END LOOP;
END $$;
COMMIT;
