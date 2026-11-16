-- Jefatura Mid Marc V2.7. Soft-delete and audit trail: no changes to existing sales, commission or report tables.
ALTER TABLE dashboard_incidents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS dashboard_incidents_owner_trash_idx ON dashboard_incidents(owner_id,deleted_at DESC);
CREATE TABLE IF NOT EXISTS dashboard_audit_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, owner_id TEXT NOT NULL, actor_id TEXT NOT NULL,
 entity_type TEXT NOT NULL, entity_key TEXT NOT NULL, operation TEXT NOT NULL,
 details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dashboard_audit_owner_time_idx ON dashboard_audit_events(owner_id,created_at DESC);
