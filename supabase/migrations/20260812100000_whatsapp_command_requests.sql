-- Phase 27 - Passerelle WhatsApp securisee et file de commandes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.whatsapp_command_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_message_id TEXT NOT NULL UNIQUE,
    business_phone_number_id TEXT NOT NULL,
    sender_fingerprint TEXT NOT NULL CHECK (length(sender_fingerprint) = 64),
    command_text TEXT NOT NULL
        CHECK (char_length(command_text) BETWEEN 1 AND 2000),
    command_kind TEXT NOT NULL DEFAULT 'development_request'
        CHECK (command_kind IN ('help', 'status_check', 'archive_status', 'development_request')),
    status TEXT NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    provider_sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    response_summary TEXT,
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (retention_until > received_at)
);

CREATE INDEX IF NOT EXISTS whatsapp_command_requests_status_received_idx
    ON public.whatsapp_command_requests (status, received_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_command_requests_retention_idx
    ON public.whatsapp_command_requests (retention_until);

ALTER TABLE public.whatsapp_command_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.whatsapp_command_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_command_requests TO service_role;

COMMENT ON TABLE public.whatsapp_command_requests IS
    'Demandes WhatsApp authentifiees, en attente de validation humaine et sans execution automatique.';
COMMENT ON COLUMN public.whatsapp_command_requests.sender_fingerprint IS
    'Empreinte HMAC SHA-256; le numero de telephone brut n est jamais persiste.';
