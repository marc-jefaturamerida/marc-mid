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
