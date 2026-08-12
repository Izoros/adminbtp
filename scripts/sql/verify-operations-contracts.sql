\set ON_ERROR_STOP on

BEGIN;

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'phase-validation@example.invalid',
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
);

UPDATE public.user_profiles
SET internal_role = 'platform_admin'
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

INSERT INTO public.whatsapp_command_requests (
  id, provider_message_id, business_phone_number_id, sender_fingerprint,
  command_text, command_kind, received_at, retention_until
)
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'wamid.phase-validation',
  'phone-test',
  repeat('a', 64),
  'Validation transactionnelle',
  'development_request',
  '1999-01-01T00:00:00Z',
  '2000-01-01T00:00:00Z'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  true
);

DO $$
DECLARE
  reviewed_status TEXT;
BEGIN
  SELECT status
  INTO reviewed_status
  FROM public.review_whatsapp_command(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'approve'
  );

  IF reviewed_status <> 'approved' THEN
    RAISE EXCEPTION 'La revue WhatsApp transactionnelle a echoue.';
  END IF;
END;
$$;
RESET ROLE;

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.whatsapp_command_events
    WHERE command_request_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ) <> 1 THEN
    RAISE EXCEPTION 'Le journal de revue WhatsApp est incomplet.';
  END IF;
END;
$$;

INSERT INTO public.operations_alerts (
  id, fingerprint, alert_kind, severity, title, occurred_at, retention_until
)
VALUES (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'archive_overdue:phase-validation',
  'archive_overdue',
  'medium',
  'Alerte de validation transactionnelle',
  '1999-01-01T00:00:00Z',
  '2000-01-01T00:00:00Z'
);

SET LOCAL ROLE service_role;
SELECT public.purge_expired_operations_data('2001-01-01T00:00:00Z');
RESET ROLE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.whatsapp_command_requests
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ) THEN
    RAISE EXCEPTION 'La commande WhatsApp expiree existe encore.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.whatsapp_command_events
    WHERE command_request_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ) THEN
    RAISE EXCEPTION 'Le journal WhatsApp expire existe encore.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.operations_alerts
    WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ) THEN
    RAISE EXCEPTION 'L alerte expiree existe encore.';
  END IF;
END;
$$;

ROLLBACK;

SELECT 'Contrats operations Supabase valides' AS result;
