-- Phase 5 - Signatures et validations pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signature_request_status') THEN
        CREATE TYPE signature_request_status AS ENUM (
            'draft',
            'pending_internal_validation',
            'pending_signature',
            'approved',
            'rejected',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_type') THEN
        CREATE TYPE audit_action_type AS ENUM (
            'created',
            'submitted',
            'approved',
            'rejected',
            'signature_requested',
            'whatsapp_prepared'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.signature_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_role TEXT NOT NULL,
    signature_style TEXT NOT NULL DEFAULT 'typed',
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    signature_profile_id UUID REFERENCES public.signature_profiles(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status signature_request_status NOT NULL DEFAULT 'draft',
    validation_notes TEXT,
    whatsapp_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action_type audit_action_type NOT NULL,
    actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.signature_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.signature_requests TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

ALTER TABLE public.signature_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signature_profiles_select_org_members" ON public.signature_profiles;
CREATE POLICY "signature_profiles_select_org_members"
ON public.signature_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = signature_profiles.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "signature_profiles_manage_org_managers" ON public.signature_profiles;
CREATE POLICY "signature_profiles_manage_org_managers"
ON public.signature_profiles
FOR ALL
TO authenticated
USING (public.is_org_manager(organization_id))
WITH CHECK (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "signature_requests_select_org_members" ON public.signature_requests;
CREATE POLICY "signature_requests_select_org_members"
ON public.signature_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = signature_requests.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "signature_requests_insert_org_members" ON public.signature_requests;
CREATE POLICY "signature_requests_insert_org_members"
ON public.signature_requests
FOR INSERT
TO authenticated
WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = signature_requests.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "signature_requests_update_org_members" ON public.signature_requests;
CREATE POLICY "signature_requests_update_org_members"
ON public.signature_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = signature_requests.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = signature_requests.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "audit_logs_select_org_members" ON public.audit_logs;
CREATE POLICY "audit_logs_select_org_members"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = audit_logs.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "audit_logs_insert_org_members" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_org_members"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = audit_logs.organization_id
          AND om.user_id = auth.uid()
    )
);
