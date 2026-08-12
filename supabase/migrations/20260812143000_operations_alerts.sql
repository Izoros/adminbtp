-- Phase 28 - Alertes d'exploitation idempotentes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.operations_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint TEXT NOT NULL UNIQUE CHECK (char_length(fingerprint) BETWEEN 1 AND 255),
    alert_kind TEXT NOT NULL
        CHECK (alert_kind IN ('archive_failed', 'archive_stalled', 'archive_overdue')),
    severity TEXT NOT NULL CHECK (severity IN ('medium', 'high')),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
    source_entity_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'dispatching', 'delivered', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_attempt_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS operations_alerts_status_occurred_idx
    ON public.operations_alerts (status, occurred_at DESC);

ALTER TABLE public.operations_alerts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.operations_alerts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.operations_alerts TO service_role;

CREATE OR REPLACE FUNCTION public.claim_operations_alert(
    target_fingerprint TEXT,
    target_alert_kind TEXT,
    target_severity TEXT,
    target_title TEXT,
    target_source_entity_id UUID,
    target_occurred_at TIMESTAMPTZ
)
RETURNS SETOF public.operations_alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    claimed public.operations_alerts%ROWTYPE;
BEGIN
    INSERT INTO public.operations_alerts (
        fingerprint,
        alert_kind,
        severity,
        title,
        source_entity_id,
        occurred_at,
        status,
        attempts,
        last_attempt_at
    )
    VALUES (
        target_fingerprint,
        target_alert_kind,
        target_severity,
        target_title,
        target_source_entity_id,
        target_occurred_at,
        'dispatching',
        1,
        NOW()
    )
    ON CONFLICT (fingerprint) DO NOTHING
    RETURNING * INTO claimed;

    IF FOUND THEN
        RETURN NEXT claimed;
        RETURN;
    END IF;

    UPDATE public.operations_alerts
    SET
        status = 'dispatching',
        attempts = attempts + 1,
        last_attempt_at = NOW(),
        updated_at = NOW(),
        last_error = NULL
    WHERE fingerprint = target_fingerprint
      AND status IN ('pending', 'failed', 'dispatching')
      AND (last_attempt_at IS NULL OR last_attempt_at < NOW() - INTERVAL '10 minutes')
    RETURNING * INTO claimed;

    IF FOUND THEN
        RETURN NEXT claimed;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_operations_alert(TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_operations_alert(TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ)
    TO service_role;

COMMENT ON TABLE public.operations_alerts IS
    'Outbox des alertes d exploitation, sans metadonnee sensible d archive.';
COMMENT ON FUNCTION public.claim_operations_alert(TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ) IS
    'Reserve atomiquement une alerte nouvelle ou en echec en evitant les envois concurrents.';
