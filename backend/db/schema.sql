-- Maruthi Catalyst — database schema
-- Run this once against your Supabase/PostgreSQL database (see backend README
-- for how). Safe to re-run: every statement is guarded with IF NOT EXISTS.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gives us gen_random_uuid()

CREATE TABLE IF NOT EXISTS submission_status (
  value TEXT PRIMARY KEY
);

INSERT INTO submission_status (value) VALUES
  ('NEW'), ('UNDER_REVIEW'), ('SHORTLISTED'), ('ACCEPTED'), ('REJECTED'), ('CONTACTED')
ON CONFLICT DO NOTHING;

-- Per-year counter used to generate human-readable IDs like MC-2026-00001.
-- Incrementing this row (not a full table scan/COUNT) keeps ID generation
-- correct even when two submissions arrive at the same instant.
CREATE TABLE IF NOT EXISTS submission_counters (
  year INTEGER PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS startup_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL UNIQUE,          -- e.g. MC-2026-00001
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  startup_industry TEXT NOT NULL,
  idea_title TEXT NOT NULL,
  idea_description TEXT NOT NULL,
  resources_required TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' REFERENCES submission_status(value),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON startup_submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON startup_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON startup_submissions (email);

-- Keep updated_at accurate on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON startup_submissions;
CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON startup_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Administrators who can access the dashboard. Created via the
-- `npm run create-admin` script — never insert a plaintext password here.
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
