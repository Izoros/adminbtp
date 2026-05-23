-- Phase 4 - Base documentaire pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM (
            'draft',
            'generated',
            'validated',
            'archived'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT,
    body_template TEXT NOT NULL,
    letterhead_name TEXT,
    logo_url TEXT,
    stamp_label TEXT,
    signature_label TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    subject TEXT,
    body_rendered TEXT NOT NULL,
    status document_status NOT NULL DEFAULT 'draft',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.document_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_templates_select_org_members" ON public.document_templates;
CREATE POLICY "document_templates_select_org_members"
ON public.document_templates
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = document_templates.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "document_templates_manage_org_managers" ON public.document_templates;
CREATE POLICY "document_templates_manage_org_managers"
ON public.document_templates
FOR ALL
TO authenticated
USING (public.is_org_manager(organization_id))
WITH CHECK (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "documents_select_org_members" ON public.documents;
CREATE POLICY "documents_select_org_members"
ON public.documents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = documents.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "documents_insert_org_members" ON public.documents;
CREATE POLICY "documents_insert_org_members"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = documents.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "documents_update_org_members" ON public.documents;
CREATE POLICY "documents_update_org_members"
ON public.documents
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = documents.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = documents.organization_id
          AND om.user_id = auth.uid()
    )
);
