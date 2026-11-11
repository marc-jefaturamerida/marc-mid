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
