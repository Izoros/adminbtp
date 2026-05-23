-- Phase 3 - Phases chantier configurables pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phase_profile') THEN
        CREATE TYPE phase_profile AS ENUM (
            'moe',
            'moa',
            'tce',
            'trade_contractor'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phase_status') THEN
        CREATE TYPE phase_status AS ENUM (
            'not_started',
            'in_progress',
            'blocked',
            'ready_for_review',
            'completed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
        CREATE TYPE alert_severity AS ENUM (
            'low',
            'medium',
            'high'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.project_phase_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile phase_profile NOT NULL,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_phase_templates_sequence_check
        CHECK (sequence_number > 0)
);

CREATE TABLE IF NOT EXISTS public.project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.project_phase_templates(id) ON DELETE RESTRICT,
    profile phase_profile NOT NULL,
    status phase_status NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.phase_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    sequence_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT phase_checklist_items_sequence_check
        CHECK (sequence_number > 0)
);

CREATE TABLE IF NOT EXISTS public.phase_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
    severity alert_severity NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.can_complete_phase(target_phase_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.phase_checklist_items pci
        WHERE pci.phase_id = target_phase_id
          AND pci.is_required = TRUE
          AND pci.is_completed = FALSE
    );
$$;

GRANT SELECT, INSERT, UPDATE ON public.project_phase_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.project_phases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.phase_checklist_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.phase_alerts TO authenticated;

ALTER TABLE public.project_phase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_phase_templates_select_authenticated" ON public.project_phase_templates;
CREATE POLICY "project_phase_templates_select_authenticated"
ON public.project_phase_templates
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "project_phase_templates_manage_platform_admins" ON public.project_phase_templates;
CREATE POLICY "project_phase_templates_manage_platform_admins"
ON public.project_phase_templates
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.internal_role = 'platform_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.internal_role = 'platform_admin'
    )
);

DROP POLICY IF EXISTS "project_phases_select_project_members" ON public.project_phases;
CREATE POLICY "project_phases_select_project_members"
ON public.project_phases
FOR SELECT
TO authenticated
USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "project_phases_manage_project_managers" ON public.project_phases;
CREATE POLICY "project_phases_manage_project_managers"
ON public.project_phases
FOR ALL
TO authenticated
USING (public.can_manage_project(project_id))
WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "phase_checklist_items_select_project_members" ON public.phase_checklist_items;
CREATE POLICY "phase_checklist_items_select_project_members"
ON public.phase_checklist_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.project_phases pp
        WHERE pp.id = phase_checklist_items.phase_id
          AND public.can_access_project(pp.project_id)
    )
);

DROP POLICY IF EXISTS "phase_checklist_items_manage_project_managers" ON public.phase_checklist_items;
CREATE POLICY "phase_checklist_items_manage_project_managers"
ON public.phase_checklist_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.project_phases pp
        WHERE pp.id = phase_checklist_items.phase_id
          AND public.can_manage_project(pp.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.project_phases pp
        WHERE pp.id = phase_checklist_items.phase_id
          AND public.can_manage_project(pp.project_id)
    )
);

DROP POLICY IF EXISTS "phase_alerts_select_project_members" ON public.phase_alerts;
CREATE POLICY "phase_alerts_select_project_members"
ON public.phase_alerts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.project_phases pp
        WHERE pp.id = phase_alerts.phase_id
          AND public.can_access_project(pp.project_id)
    )
);

DROP POLICY IF EXISTS "phase_alerts_manage_project_managers" ON public.phase_alerts;
CREATE POLICY "phase_alerts_manage_project_managers"
ON public.phase_alerts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.project_phases pp
        WHERE pp.id = phase_alerts.phase_id
          AND public.can_manage_project(pp.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.project_phases pp
        WHERE pp.id = phase_alerts.phase_id
          AND public.can_manage_project(pp.project_id)
    )
);

COMMENT ON FUNCTION public.can_complete_phase(UUID) IS
'Retourne vrai si tous les points obligatoires de la checklist sont completes.';
