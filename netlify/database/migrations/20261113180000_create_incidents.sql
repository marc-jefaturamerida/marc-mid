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
