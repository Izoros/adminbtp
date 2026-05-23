-- Phase 6 - Mails et boites generiques pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mailbox_provider') THEN
        CREATE TYPE mailbox_provider AS ENUM (
            'internal',
            'gmail',
            'outlook'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_classification') THEN
        CREATE TYPE email_classification AS ENUM (
            'unclassified',
            'document',
            'payment_followup',
            'task',
            'client_message',
            'validation'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mailboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    address TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    provider mailbox_provider NOT NULL DEFAULT 'internal',
    provider_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID NOT NULL REFERENCES public.mailboxes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    related_task_id TEXT,
    external_message_id TEXT,
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    classification email_classification NOT NULL DEFAULT 'unclassified',
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.mailboxes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.emails TO authenticated;

ALTER TABLE public.mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mailboxes_select_org_members" ON public.mailboxes;
CREATE POLICY "mailboxes_select_org_members"
ON public.mailboxes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = mailboxes.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "mailboxes_manage_org_managers" ON public.mailboxes;
CREATE POLICY "mailboxes_manage_org_managers"
ON public.mailboxes
FOR ALL
TO authenticated
USING (public.is_org_manager(organization_id))
WITH CHECK (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "emails_select_org_members" ON public.emails;
CREATE POLICY "emails_select_org_members"
ON public.emails
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = emails.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "emails_insert_org_members" ON public.emails;
CREATE POLICY "emails_insert_org_members"
ON public.emails
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = emails.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "emails_update_org_members" ON public.emails;
CREATE POLICY "emails_update_org_members"
ON public.emails
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = emails.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = emails.organization_id
          AND om.user_id = auth.uid()
    )
);
