-- Phase 2 - Chantiers et roles projet pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_role') THEN
        CREATE TYPE project_role AS ENUM (
            'moa',
            'moe',
            'tce',
            'bet',
            'opc',
            'amo',
            'trade_contractor',
            'subcontractor'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'draft',
            'active',
            'on_hold',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'draft',
    owner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    starts_on DATE,
    ends_on DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT projects_date_range_check
        CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.project_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role project_role NOT NULL,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, organization_id, role)
);

CREATE OR REPLACE FUNCTION public.can_access_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.project_organizations po
        JOIN public.organization_members om
          ON om.organization_id = po.organization_id
        WHERE po.project_id = target_project_id
          AND om.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = target_project_id
          AND (
            p.created_by = auth.uid()
            OR public.is_org_manager(p.owner_organization_id)
          )
    );
$$;

GRANT SELECT, INSERT, UPDATE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_organizations TO authenticated;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_members_only" ON public.projects;
CREATE POLICY "projects_select_members_only"
ON public.projects
FOR SELECT
TO authenticated
USING (public.can_access_project(id));

DROP POLICY IF EXISTS "projects_insert_org_managers" ON public.projects;
CREATE POLICY "projects_insert_org_managers"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()
    AND public.is_org_manager(owner_organization_id)
);

DROP POLICY IF EXISTS "projects_update_managers_only" ON public.projects;
CREATE POLICY "projects_update_managers_only"
ON public.projects
FOR UPDATE
TO authenticated
USING (public.can_manage_project(id))
WITH CHECK (public.can_manage_project(id));

DROP POLICY IF EXISTS "project_organizations_select_members_only" ON public.project_organizations;
CREATE POLICY "project_organizations_select_members_only"
ON public.project_organizations
FOR SELECT
TO authenticated
USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "project_organizations_insert_project_managers" ON public.project_organizations;
CREATE POLICY "project_organizations_insert_project_managers"
ON public.project_organizations
FOR INSERT
TO authenticated
WITH CHECK (
    public.can_manage_project(project_id)
    AND public.is_org_manager(organization_id)
);

DROP POLICY IF EXISTS "project_organizations_update_project_managers" ON public.project_organizations;
CREATE POLICY "project_organizations_update_project_managers"
ON public.project_organizations
FOR UPDATE
TO authenticated
USING (public.can_manage_project(project_id))
WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "project_organizations_delete_project_managers" ON public.project_organizations;
CREATE POLICY "project_organizations_delete_project_managers"
ON public.project_organizations
FOR DELETE
TO authenticated
USING (public.can_manage_project(project_id));

COMMENT ON FUNCTION public.can_access_project(UUID) IS
'Retourne vrai si l utilisateur courant appartient a une organisation liee au chantier.';

COMMENT ON FUNCTION public.can_manage_project(UUID) IS
'Retourne vrai si l utilisateur courant peut administrer le chantier.';
