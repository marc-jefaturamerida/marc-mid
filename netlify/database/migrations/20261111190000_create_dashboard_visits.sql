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
