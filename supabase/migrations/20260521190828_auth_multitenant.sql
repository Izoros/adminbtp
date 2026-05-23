-- Phase 1 - Authentification et multi-tenant pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'internal_role') THEN
        CREATE TYPE internal_role AS ENUM (
            'platform_admin',
            'operations_manager',
            'support_agent',
            'expert_consultant',
            'member'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
        CREATE TYPE organization_role AS ENUM (
            'org_owner',
            'org_admin',
            'org_member',
            'org_viewer'
        );
    END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    internal_role internal_role NOT NULL DEFAULT 'member',
    default_organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    legal_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role organization_role NOT NULL DEFAULT 'org_member',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_profiles_default_organization_id_fkey'
    ) THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT user_profiles_default_organization_id_fkey
            FOREIGN KEY (default_organization_id)
            REFERENCES public.organizations(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_org_manager(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = target_org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('org_owner', 'org_admin')
    );
$$;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_self" ON public.user_profiles;
CREATE POLICY "user_profiles_select_self"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
CREATE POLICY "user_profiles_update_self"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "organizations_select_members_only" ON public.organizations;
CREATE POLICY "organizations_select_members_only"
ON public.organizations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = organizations.id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "organizations_insert_creator_only" ON public.organizations;
CREATE POLICY "organizations_insert_creator_only"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "organizations_update_org_managers" ON public.organizations;
CREATE POLICY "organizations_update_org_managers"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.is_org_manager(id))
WITH CHECK (public.is_org_manager(id));

DROP POLICY IF EXISTS "organization_members_select_self_or_managers" ON public.organization_members;
CREATE POLICY "organization_members_select_self_or_managers"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_org_manager(organization_id)
);

DROP POLICY IF EXISTS "organization_members_insert_org_managers" ON public.organization_members;
CREATE POLICY "organization_members_insert_org_managers"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "organization_members_update_org_managers" ON public.organization_members;
CREATE POLICY "organization_members_update_org_managers"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (public.is_org_manager(organization_id))
WITH CHECK (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "organization_members_delete_org_managers" ON public.organization_members;
CREATE POLICY "organization_members_delete_org_managers"
ON public.organization_members
FOR DELETE
TO authenticated
USING (public.is_org_manager(organization_id));

COMMENT ON FUNCTION private.handle_new_user() IS
'Cree automatiquement le profil public a partir de auth.users.';

COMMENT ON FUNCTION public.is_org_manager(UUID) IS
'Retourne vrai si l utilisateur courant est owner ou admin de l organisation cible.';
