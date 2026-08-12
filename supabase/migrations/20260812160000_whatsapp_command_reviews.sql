-- Phase 29 - Revue humaine atomique des commandes WhatsApp

CREATE TABLE IF NOT EXISTS public.whatsapp_command_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_request_id UUID NOT NULL
        REFERENCES public.whatsapp_command_requests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL
        CHECK (event_type IN ('review_approved', 'review_rejected')),
    actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_command_events_request_created_idx
    ON public.whatsapp_command_events (command_request_id, created_at DESC);

ALTER TABLE public.whatsapp_command_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.whatsapp_command_events FROM anon, authenticated;
GRANT SELECT ON TABLE public.whatsapp_command_events TO service_role;

CREATE OR REPLACE FUNCTION public.review_whatsapp_command(
    target_command_id UUID,
    target_decision TEXT
)
RETURNS SETOF public.whatsapp_command_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actor_id UUID := auth.uid();
    current_command public.whatsapp_command_requests%ROWTYPE;
    next_status TEXT;
    next_event_type TEXT;
BEGIN
    IF actor_id IS NULL OR NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'whatsapp_command_review_forbidden';
    END IF;

    IF target_decision = 'approve' THEN
        next_status := 'approved';
        next_event_type := 'review_approved';
    ELSIF target_decision = 'reject' THEN
        next_status := 'rejected';
        next_event_type := 'review_rejected';
    ELSE
        RAISE EXCEPTION 'whatsapp_command_review_invalid_decision';
    END IF;

    SELECT *
    INTO current_command
    FROM public.whatsapp_command_requests
    WHERE id = target_command_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'whatsapp_command_review_not_found';
    END IF;

    IF current_command.status = next_status THEN
        RETURN NEXT current_command;
        RETURN;
    END IF;

    IF current_command.status <> 'pending_review' THEN
        RAISE EXCEPTION 'whatsapp_command_review_invalid_status';
    END IF;

    UPDATE public.whatsapp_command_requests
    SET
        status = next_status,
        reviewed_at = NOW(),
        reviewed_by = actor_id,
        updated_at = NOW()
    WHERE id = target_command_id
    RETURNING * INTO current_command;

    INSERT INTO public.whatsapp_command_events (
        command_request_id,
        event_type,
        actor_user_id,
        details
    )
    VALUES (
        target_command_id,
        next_event_type,
        actor_id,
        jsonb_build_object('previous_status', 'pending_review', 'next_status', next_status)
    );

    RETURN NEXT current_command;
END;
$$;

REVOKE ALL ON FUNCTION public.review_whatsapp_command(UUID, TEXT)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_whatsapp_command(UUID, TEXT)
    TO authenticated, service_role;

COMMENT ON TABLE public.whatsapp_command_events IS
    'Journal immuable des decisions humaines sur les demandes WhatsApp.';
COMMENT ON FUNCTION public.review_whatsapp_command(UUID, TEXT) IS
    'Approuve ou refuse atomiquement une demande sans executer son contenu.';
