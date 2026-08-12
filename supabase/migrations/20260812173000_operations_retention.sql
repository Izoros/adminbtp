-- Phase 30 - Retention automatique des donnees d'exploitation

ALTER TABLE public.operations_alerts
    ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;

UPDATE public.operations_alerts
SET retention_until = occurred_at + INTERVAL '365 days'
WHERE retention_until IS NULL;

ALTER TABLE public.operations_alerts
    ALTER COLUMN retention_until SET DEFAULT (NOW() + INTERVAL '365 days'),
    ALTER COLUMN retention_until SET NOT NULL;

ALTER TABLE public.operations_alerts
    DROP CONSTRAINT IF EXISTS operations_alerts_retention_after_occurred;
ALTER TABLE public.operations_alerts
    ADD CONSTRAINT operations_alerts_retention_after_occurred
    CHECK (retention_until > occurred_at);

CREATE INDEX IF NOT EXISTS operations_alerts_retention_idx
    ON public.operations_alerts (retention_until);

CREATE OR REPLACE FUNCTION public.purge_expired_operations_data(
    target_now TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_whatsapp_commands INTEGER := 0;
    deleted_operations_alerts INTEGER := 0;
BEGIN
    DELETE FROM public.whatsapp_command_requests
    WHERE retention_until <= target_now;
    GET DIAGNOSTICS deleted_whatsapp_commands = ROW_COUNT;

    DELETE FROM public.operations_alerts
    WHERE retention_until <= target_now;
    GET DIAGNOSTICS deleted_operations_alerts = ROW_COUNT;

    RETURN jsonb_build_object(
        'deleted_whatsapp_commands', deleted_whatsapp_commands,
        'deleted_operations_alerts', deleted_operations_alerts,
        'purged_at', target_now
    );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_operations_data(TIMESTAMPTZ)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_operations_data(TIMESTAMPTZ)
    TO service_role;

COMMENT ON FUNCTION public.purge_expired_operations_data(TIMESTAMPTZ) IS
    'Supprime les commandes WhatsApp et alertes arrivees a leur date de retention.';
