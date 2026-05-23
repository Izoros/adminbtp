-- Phase 9 - Mapping Odoo pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'odoo_binding_type') THEN
        CREATE TYPE odoo_binding_type AS ENUM (
            'customer',
            'invoice',
            'subscription',
            'consulting_service'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.odoo_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    binding_type odoo_binding_type NOT NULL,
    adminbtp_entity_id TEXT NOT NULL,
    odoo_model TEXT NOT NULL,
    odoo_record_id TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'linked',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, binding_type, adminbtp_entity_id)
);

GRANT SELECT, INSERT, UPDATE ON public.odoo_mappings TO authenticated;

ALTER TABLE public.odoo_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "odoo_mappings_select_org_members" ON public.odoo_mappings;
CREATE POLICY "odoo_mappings_select_org_members"
ON public.odoo_mappings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = odoo_mappings.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "odoo_mappings_manage_org_members" ON public.odoo_mappings;
CREATE POLICY "odoo_mappings_manage_org_members"
ON public.odoo_mappings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = odoo_mappings.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = odoo_mappings.organization_id
          AND om.user_id = auth.uid()
    )
);
