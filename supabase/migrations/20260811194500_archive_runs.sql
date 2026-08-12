-- Phase 24 - Traçabilite et verification des archives longue duree

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.archive_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'succeeded', 'failed')),
    storage_mode TEXT NOT NULL
        CHECK (storage_mode IN ('local', 'sftp')),
    verification_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'failed')),
    generated_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sha256 TEXT CHECK (sha256 IS NULL OR length(sha256) = 64),
    byte_length BIGINT CHECK (byte_length IS NULL OR byte_length >= 0),
    archive_version INTEGER NOT NULL DEFAULT 1 CHECK (archive_version > 0),
    retention_years INTEGER NOT NULL DEFAULT 25 CHECK (retention_years > 0),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS archive_runs_generated_at_idx
    ON public.archive_runs (generated_at DESC);

CREATE INDEX IF NOT EXISTS archive_runs_status_idx
    ON public.archive_runs (status, generated_at DESC);

ALTER TABLE public.archive_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.archive_runs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.archive_runs TO service_role;

COMMENT ON TABLE public.archive_runs IS
    'Journal serveur des generations, stockages et verifications des archives longue duree.';
