-- Module OPC metier - ordonnancement, pilotage et coordination.
-- Cette migration complete les objets transverses existants sans les dupliquer.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    ALTER TYPE public.phase_profile ADD VALUE IF NOT EXISTS 'opc';

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_member_role') THEN
        CREATE TYPE public.opc_member_role AS ENUM (
            'administrator',
            'collaborator',
            'company_contributor',
            'viewer'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_task_status') THEN
        CREATE TYPE public.opc_task_status AS ENUM (
            'not_started', 'ready', 'in_progress', 'blocked', 'completed', 'cancelled'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_task_priority') THEN
        CREATE TYPE public.opc_task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_progress_mode') THEN
        CREATE TYPE public.opc_progress_mode AS ENUM ('manual', 'quantitative', 'unit');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_dependency_type') THEN
        CREATE TYPE public.opc_dependency_type AS ENUM ('FS', 'SS', 'FF', 'SF');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_prerequisite_status') THEN
        CREATE TYPE public.opc_prerequisite_status AS ENUM ('missing', 'requested', 'available', 'waived');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_action_status') THEN
        CREATE TYPE public.opc_action_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_meeting_status') THEN
        CREATE TYPE public.opc_meeting_status AS ENUM ('draft', 'scheduled', 'held', 'minutes_issued', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_reservation_status') THEN
        CREATE TYPE public.opc_reservation_status AS ENUM ('open', 'corrected', 'verified', 'closed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opc_reception_status') THEN
        CREATE TYPE public.opc_reception_status AS ENUM ('planned', 'in_progress', 'pronounced', 'refused', 'closed');
    END IF;
END $$;

-- Le role interne platform_admin doit pouvoir administrer tous les chantiers,
-- y compris lorsqu'il n'est pas membre d'une organisation du chantier.
CREATE OR REPLACE FUNCTION public.can_access_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.project_organizations project_organization
            JOIN public.organization_members member
              ON member.organization_id = project_organization.organization_id
            WHERE project_organization.project_id = target_project_id
              AND member.user_id = auth.uid()
        );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.projects project
            WHERE project.id = target_project_id
              AND (
                project.created_by = auth.uid()
                OR public.is_org_manager(project.owner_organization_id)
              )
        );
$$;

CREATE TABLE IF NOT EXISTS public.opc_project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role public.opc_member_role NOT NULL DEFAULT 'viewer',
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

CREATE OR REPLACE FUNCTION public.can_access_opc_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.is_platform_admin()
        OR public.can_access_project(target_project_id)
        OR EXISTS (
            SELECT 1
            FROM public.opc_project_members member
            WHERE member.project_id = target_project_id
              AND member.user_id = auth.uid()
        );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_opc_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.is_platform_admin()
        OR public.can_manage_project(target_project_id)
        OR EXISTS (
            SELECT 1
            FROM public.opc_project_members member
            WHERE member.project_id = target_project_id
              AND member.user_id = auth.uid()
              AND member.role IN ('administrator', 'collaborator')
        );
$$;

CREATE OR REPLACE FUNCTION public.can_contribute_opc_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.can_edit_opc_project(target_project_id)
        OR EXISTS (
            SELECT 1
            FROM public.opc_project_members member
            WHERE member.project_id = target_project_id
              AND member.user_id = auth.uid()
              AND member.role = 'company_contributor'
        );
$$;

CREATE OR REPLACE FUNCTION public.opc_member_company(target_project_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT member.organization_id
    FROM public.opc_project_members member
    WHERE member.project_id = target_project_id
      AND member.user_id = auth.uid()
      AND member.role = 'company_contributor'
    LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS public.opc_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    company_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    sequence_number INTEGER NOT NULL DEFAULT 1 CHECK (sequence_number > 0),
    color TEXT NOT NULL DEFAULT '#78716c',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS public.opc_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.opc_zones(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL DEFAULT 'zone' CHECK (zone_type IN ('sector', 'building', 'level', 'zone')),
    sequence_number INTEGER NOT NULL DEFAULT 1 CHECK (sequence_number > 0),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS public.opc_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.opc_tasks(id) ON DELETE SET NULL,
    phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES public.opc_lots(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    planned_start DATE NOT NULL,
    planned_end DATE NOT NULL,
    current_start DATE,
    current_end DATE,
    actual_start DATE,
    actual_end DATE,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 0),
    constraint_start DATE,
    status public.opc_task_status NOT NULL DEFAULT 'not_started',
    priority public.opc_task_priority NOT NULL DEFAULT 'normal',
    progress_mode public.opc_progress_mode NOT NULL DEFAULT 'manual',
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    planned_quantity NUMERIC(14,3) CHECK (planned_quantity IS NULL OR planned_quantity >= 0),
    completed_quantity NUMERIC(14,3) CHECK (completed_quantity IS NULL OR completed_quantity >= 0),
    unit_label TEXT,
    weight NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (weight >= 0),
    is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    is_contractual_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule TEXT,
    external_reference TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT opc_tasks_planned_range CHECK (planned_end >= planned_start),
    CONSTRAINT opc_tasks_current_range CHECK (current_end IS NULL OR current_start IS NULL OR current_end >= current_start),
    CONSTRAINT opc_tasks_actual_range CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start),
    CONSTRAINT opc_tasks_milestone_duration CHECK (NOT is_milestone OR duration_days = 0),
    UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS public.opc_task_zones (
    task_id UUID NOT NULL REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES public.opc_zones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (task_id, zone_id)
);

CREATE OR REPLACE FUNCTION private.guard_opc_task_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.progress_percent >= 100 AND NEW.actual_end IS NULL THEN
        RAISE EXCEPTION 'opc_completed_task_requires_actual_end' USING ERRCODE = '23514';
    END IF;

    IF NEW.status = 'not_started' AND NEW.actual_start IS NOT NULL THEN
        RAISE EXCEPTION 'opc_not_started_task_forbids_actual_start' USING ERRCODE = '23514';
    END IF;

    IF NEW.actual_end IS NOT NULL AND NEW.actual_start IS NULL THEN
        RAISE EXCEPTION 'opc_actual_end_requires_actual_start' USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opc_tasks_consistency_guard ON public.opc_tasks;
CREATE TRIGGER opc_tasks_consistency_guard
BEFORE INSERT OR UPDATE ON public.opc_tasks
FOR EACH ROW EXECUTE FUNCTION private.guard_opc_task_consistency();

CREATE TABLE IF NOT EXISTS public.opc_task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    predecessor_id UUID NOT NULL REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    successor_id UUID NOT NULL REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    dependency_type public.opc_dependency_type NOT NULL DEFAULT 'FS',
    lag_days INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (predecessor_id <> successor_id),
    UNIQUE (predecessor_id, successor_id, dependency_type)
);

CREATE OR REPLACE FUNCTION private.guard_opc_dependency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    predecessor_project UUID;
    successor_project UUID;
BEGIN
    SELECT project_id INTO predecessor_project FROM public.opc_tasks WHERE id = NEW.predecessor_id;
    SELECT project_id INTO successor_project FROM public.opc_tasks WHERE id = NEW.successor_id;

    IF predecessor_project IS NULL
       OR successor_project IS NULL
       OR predecessor_project <> NEW.project_id
       OR successor_project <> NEW.project_id THEN
        RAISE EXCEPTION 'opc_dependency_cross_project' USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
        WITH RECURSIVE reachable(task_id) AS (
            SELECT NEW.successor_id
            UNION
            SELECT dependency.successor_id
            FROM public.opc_task_dependencies dependency
            JOIN reachable ON reachable.task_id = dependency.predecessor_id
            WHERE dependency.id <> NEW.id
        )
        SELECT 1 FROM reachable WHERE task_id = NEW.predecessor_id
    ) THEN
        RAISE EXCEPTION 'opc_dependency_cycle' USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opc_task_dependencies_guard ON public.opc_task_dependencies;
CREATE TRIGGER opc_task_dependencies_guard
BEFORE INSERT OR UPDATE ON public.opc_task_dependencies
FOR EACH ROW EXECUTE FUNCTION private.guard_opc_dependency();

CREATE TABLE IF NOT EXISTS public.opc_task_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('study', 'material', 'access', 'decision', 'safety', 'other')),
    required_on DATE,
    status public.opc_prerequisite_status NOT NULL DEFAULT 'missing',
    responsible_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    evidence_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opc_progress_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    progress_percent NUMERIC(5,2) NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
    completed_quantity NUMERIC(14,3) CHECK (completed_quantity IS NULL OR completed_quantity >= 0),
    measured_on DATE NOT NULL,
    comment TEXT,
    evidence_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, measured_on, recorded_by)
);

CREATE TABLE IF NOT EXISTS public.opc_planning_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    name TEXT NOT NULL,
    description TEXT,
    is_baseline BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    source_version_id UUID REFERENCES public.opc_planning_versions(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.opc_planning_version_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES public.opc_planning_versions(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'dependency')),
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (version_id, entity_type, entity_id)
);

CREATE OR REPLACE FUNCTION private.guard_opc_planning_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RAISE EXCEPTION 'opc_planning_snapshot_immutable' USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS opc_planning_versions_immutable ON public.opc_planning_versions;
CREATE TRIGGER opc_planning_versions_immutable
BEFORE UPDATE OR DELETE ON public.opc_planning_versions
FOR EACH ROW WHEN (OLD.is_locked)
EXECUTE FUNCTION private.guard_opc_planning_snapshot();

DROP TRIGGER IF EXISTS opc_planning_version_items_immutable ON public.opc_planning_version_items;
CREATE TRIGGER opc_planning_version_items_immutable
BEFORE UPDATE OR DELETE ON public.opc_planning_version_items
FOR EACH ROW EXECUTE FUNCTION private.guard_opc_planning_snapshot();

CREATE TABLE IF NOT EXISTS public.opc_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meeting_type TEXT NOT NULL DEFAULT 'site' CHECK (meeting_type IN ('site', 'coordination', 'planning', 'opr', 'reception', 'other')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    location TEXT,
    status public.opc_meeting_status NOT NULL DEFAULT 'draft',
    agenda JSONB NOT NULL DEFAULT '[]'::jsonb,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    minutes_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    previous_meeting_id UUID REFERENCES public.opc_meetings(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opc_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.opc_tasks(id) ON DELETE SET NULL,
    meeting_id UUID REFERENCES public.opc_meetings(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_on DATE NOT NULL,
    status public.opc_action_status NOT NULL DEFAULT 'open',
    priority public.opc_task_priority NOT NULL DEFAULT 'normal',
    assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assignee_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    reminder_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opc_delay_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    cause TEXT NOT NULL,
    cause_category TEXT NOT NULL DEFAULT 'other' CHECK (cause_category IN ('company', 'client', 'design', 'weather', 'supply', 'administrative', 'interface', 'other')),
    delay_days INTEGER NOT NULL CHECK (delay_days > 0),
    occurred_on DATE NOT NULL,
    detected_on DATE NOT NULL DEFAULT CURRENT_DATE,
    responsibility_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    impact_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    corrective_action TEXT,
    evidence_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opc_receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reception_type TEXT NOT NULL CHECK (reception_type IN ('opr', 'pre_reception', 'reception', 'partial_reception', 'gpa')),
    title TEXT NOT NULL,
    planned_on DATE,
    pronounced_on DATE,
    status public.opc_reception_status NOT NULL DEFAULT 'planned',
    zone_id UUID REFERENCES public.opc_zones(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES public.opc_lots(id) ON DELETE SET NULL,
    report_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opc_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reception_id UUID REFERENCES public.opc_receptions(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.opc_tasks(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES public.opc_lots(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES public.opc_zones(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    reference TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'blocking')),
    status public.opc_reservation_status NOT NULL DEFAULT 'open',
    due_on DATE,
    corrected_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, reference)
);

CREATE TABLE IF NOT EXISTS public.opc_gpa_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reception_id UUID REFERENCES public.opc_receptions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    reported_on DATE NOT NULL,
    due_on DATE,
    resolved_on DATE,
    responsible_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opc_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.opc_tasks(id) ON DELETE CASCADE,
    alert_kind TEXT NOT NULL CHECK (alert_kind IN ('delay', 'milestone', 'prerequisite', 'conflict', 'action', 'reservation', 'progress')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (project_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS public.opc_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    before_payload JSONB,
    after_payload JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opc_tasks_project_dates ON public.opc_tasks (project_id, planned_start, planned_end);
CREATE INDEX IF NOT EXISTS idx_opc_tasks_project_company ON public.opc_tasks (project_id, company_id);
CREATE INDEX IF NOT EXISTS idx_opc_dependencies_project ON public.opc_task_dependencies (project_id, predecessor_id, successor_id);
CREATE INDEX IF NOT EXISTS idx_opc_actions_project_due ON public.opc_actions (project_id, status, due_on);
CREATE INDEX IF NOT EXISTS idx_opc_reservations_project_status ON public.opc_reservations (project_id, status, due_on);
CREATE INDEX IF NOT EXISTS idx_opc_change_log_project_date ON public.opc_change_log (project_id, changed_at DESC);

CREATE OR REPLACE FUNCTION private.audit_opc_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    target_project_id UUID;
    target_entity_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_project_id := OLD.project_id;
        target_entity_id := OLD.id;
    ELSE
        target_project_id := NEW.project_id;
        target_entity_id := NEW.id;
    END IF;

    INSERT INTO public.opc_change_log (
        project_id,
        entity_type,
        entity_id,
        action,
        before_payload,
        after_payload,
        changed_by
    ) VALUES (
        target_project_id,
        TG_TABLE_NAME,
        target_entity_id,
        CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'UPDATE' THEN 'updated' ELSE 'deleted' END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
        auth.uid()
    );

    RETURN NULL;
END;
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'opc_lots', 'opc_zones', 'opc_tasks', 'opc_task_dependencies',
        'opc_task_prerequisites', 'opc_meetings', 'opc_actions',
        'opc_delay_events', 'opc_receptions', 'opc_reservations',
        'opc_gpa_events', 'opc_alerts'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', table_name || '_audit', table_name);
        EXECUTE format(
            'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.audit_opc_entity()',
            table_name || '_audit',
            table_name
        );
    END LOOP;
END $$;

-- Un contributeur entreprise ne peut modifier que l'avancement de ses propres taches.
CREATE OR REPLACE FUNCTION private.guard_opc_company_task_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    member_company UUID;
BEGIN
    IF public.can_edit_opc_project(OLD.project_id) THEN
        RETURN NEW;
    END IF;

    member_company := public.opc_member_company(OLD.project_id);
    IF member_company IS NULL OR OLD.company_id IS DISTINCT FROM member_company THEN
        RAISE EXCEPTION 'opc_company_task_access_denied' USING ERRCODE = '42501';
    END IF;

    IF (to_jsonb(NEW) - ARRAY[
        'progress_percent', 'completed_quantity', 'status', 'actual_start',
        'actual_end', 'notes', 'updated_at'
    ]) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY[
        'progress_percent', 'completed_quantity', 'status', 'actual_start',
        'actual_end', 'notes', 'updated_at'
    ]) THEN
        RAISE EXCEPTION 'opc_company_task_fields_forbidden' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opc_tasks_company_update_guard ON public.opc_tasks;
CREATE TRIGGER opc_tasks_company_update_guard
BEFORE UPDATE ON public.opc_tasks
FOR EACH ROW EXECUTE FUNCTION private.guard_opc_company_task_update();

-- RLS : lecture au perimetre projet, ecriture OPC selon le role fin.
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'opc_project_members', 'opc_lots', 'opc_zones', 'opc_tasks',
        'opc_task_dependencies', 'opc_task_prerequisites', 'opc_progress_entries',
        'opc_planning_versions', 'opc_meetings', 'opc_actions', 'opc_delay_events',
        'opc_receptions', 'opc_reservations', 'opc_gpa_events', 'opc_alerts',
        'opc_change_log'
    ]
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_select', table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_access_opc_project(project_id))',
            table_name || '_select',
            table_name
        );
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_manage', table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.can_edit_opc_project(project_id)) WITH CHECK (public.can_edit_opc_project(project_id))',
            table_name || '_manage',
            table_name
        );
    END LOOP;
END $$;

-- Le journal est append-only pour les utilisateurs. Seuls les triggers metier
-- SECURITY DEFINER l'alimentent.
DROP POLICY IF EXISTS opc_change_log_manage ON public.opc_change_log;
REVOKE INSERT, UPDATE, DELETE ON public.opc_change_log FROM authenticated;

ALTER TABLE public.opc_task_zones ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opc_task_zones TO authenticated;
DROP POLICY IF EXISTS opc_task_zones_select ON public.opc_task_zones;
CREATE POLICY opc_task_zones_select ON public.opc_task_zones
FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.opc_tasks task
    WHERE task.id = task_id AND public.can_access_opc_project(task.project_id)
));
DROP POLICY IF EXISTS opc_task_zones_manage ON public.opc_task_zones;
CREATE POLICY opc_task_zones_manage ON public.opc_task_zones
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.opc_tasks task
    WHERE task.id = task_id AND public.can_edit_opc_project(task.project_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.opc_tasks task
    WHERE task.id = task_id AND public.can_edit_opc_project(task.project_id)
));

ALTER TABLE public.opc_planning_version_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.opc_planning_version_items TO authenticated;
DROP POLICY IF EXISTS opc_planning_version_items_select ON public.opc_planning_version_items;
CREATE POLICY opc_planning_version_items_select ON public.opc_planning_version_items
FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.opc_planning_versions version
    WHERE version.id = version_id AND public.can_access_opc_project(version.project_id)
));
DROP POLICY IF EXISTS opc_planning_version_items_insert ON public.opc_planning_version_items;
CREATE POLICY opc_planning_version_items_insert ON public.opc_planning_version_items
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.opc_planning_versions version
    WHERE version.id = version_id AND public.can_edit_opc_project(version.project_id)
));

-- Contributions limitees : avancement de l'entreprise et actions qui lui sont assignees.
DROP POLICY IF EXISTS opc_tasks_company_update ON public.opc_tasks;
CREATE POLICY opc_tasks_company_update ON public.opc_tasks
FOR UPDATE TO authenticated
USING (
    public.can_contribute_opc_project(project_id)
    AND company_id = public.opc_member_company(project_id)
)
WITH CHECK (
    public.can_contribute_opc_project(project_id)
    AND company_id = public.opc_member_company(project_id)
);

DROP POLICY IF EXISTS opc_progress_entries_company_insert ON public.opc_progress_entries;
CREATE POLICY opc_progress_entries_company_insert ON public.opc_progress_entries
FOR INSERT TO authenticated
WITH CHECK (
    recorded_by = auth.uid()
    AND public.can_contribute_opc_project(project_id)
    AND EXISTS (
        SELECT 1 FROM public.opc_tasks task
        WHERE task.id = task_id
          AND task.project_id = project_id
          AND (
            public.can_edit_opc_project(project_id)
            OR task.company_id = public.opc_member_company(project_id)
          )
    )
);

DROP POLICY IF EXISTS opc_actions_company_manage ON public.opc_actions;
CREATE POLICY opc_actions_company_manage ON public.opc_actions
FOR ALL TO authenticated
USING (
    public.can_contribute_opc_project(project_id)
    AND assignee_organization_id = public.opc_member_company(project_id)
)
WITH CHECK (
    public.can_contribute_opc_project(project_id)
    AND assignee_organization_id = public.opc_member_company(project_id)
);

-- Vue de lecture compacte pour l'espace OPC. Aucun jeu de demo n'est injecte en production.
CREATE OR REPLACE FUNCTION public.get_opc_workspace(target_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT public.can_access_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_access_denied' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'project', jsonb_build_object(
            'id', project.id,
            'code', project.code,
            'name', project.name,
            'startsOn', project.starts_on,
            'endsOn', project.ends_on
        ),
        'tasks', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', task.id,
                'projectId', task.project_id,
                'code', task.code,
                'name', task.name,
                'description', task.description,
                'plannedStart', task.planned_start,
                'plannedEnd', task.planned_end,
                'currentStart', task.current_start,
                'currentEnd', task.current_end,
                'actualStart', task.actual_start,
                'actualEnd', task.actual_end,
                'durationDays', task.duration_days,
                'progressMode', task.progress_mode,
                'progressPercent', task.progress_percent,
                'plannedQuantity', task.planned_quantity,
                'completedQuantity', task.completed_quantity,
                'unitLabel', task.unit_label,
                'weight', task.weight,
                'status', task.status,
                'priority', task.priority,
                'lotId', task.lot_id,
                'zoneIds', COALESCE((SELECT jsonb_agg(link.zone_id) FROM public.opc_task_zones link WHERE link.task_id = task.id), '[]'::jsonb),
                'companyId', task.company_id,
                'phaseId', task.phase_id,
                'ownerUserId', task.owner_user_id,
                'isMilestone', task.is_milestone,
                'isContractualMilestone', task.is_contractual_milestone,
                'constraintStart', task.constraint_start,
                'notes', task.notes
            ) ORDER BY task.planned_start, task.code)
            FROM public.opc_tasks task
            WHERE task.project_id = project.id
        ), '[]'::jsonb),
        'dependencies', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', dependency.id,
                'predecessorId', dependency.predecessor_id,
                'successorId', dependency.successor_id,
                'type', dependency.dependency_type,
                'lagDays', dependency.lag_days
            ) ORDER BY dependency.created_at)
            FROM public.opc_task_dependencies dependency
            WHERE dependency.project_id = project.id
        ), '[]'::jsonb),
        'actions', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', action.id,
                'projectId', action.project_id,
                'title', action.title,
                'dueOn', action.due_on,
                'status', action.status,
                'priority', action.priority,
                'assigneeUserId', action.assignee_user_id,
                'assigneeOrganizationId', action.assignee_organization_id,
                'taskId', action.task_id,
                'meetingId', action.meeting_id
            ) ORDER BY action.due_on)
            FROM public.opc_actions action
            WHERE action.project_id = project.id
        ), '[]'::jsonb),
        'prerequisites', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', prerequisite.id,
                'taskId', prerequisite.task_id,
                'label', prerequisite.label,
                'category', prerequisite.category,
                'requiredOn', prerequisite.required_on,
                'status', prerequisite.status
            ) ORDER BY prerequisite.required_on NULLS LAST)
            FROM public.opc_task_prerequisites prerequisite
            WHERE prerequisite.project_id = project.id
        ), '[]'::jsonb),
        'delays', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', delay.id,
                'taskId', delay.task_id,
                'cause', delay.cause,
                'causeCategory', delay.cause_category,
                'delayDays', delay.delay_days,
                'occurredOn', delay.occurred_on,
                'responsibilityOrganizationId', delay.responsibility_organization_id
            ) ORDER BY delay.occurred_on DESC)
            FROM public.opc_delay_events delay
            WHERE delay.project_id = project.id
        ), '[]'::jsonb),
        'reservations', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', reservation.id,
                'projectId', reservation.project_id,
                'title', reservation.title,
                'dueOn', reservation.due_on,
                'status', reservation.status,
                'severity', reservation.severity,
                'lotId', reservation.lot_id,
                'zoneId', reservation.zone_id,
                'companyId', reservation.company_id
            ) ORDER BY reservation.created_at DESC)
            FROM public.opc_reservations reservation
            WHERE reservation.project_id = project.id
        ), '[]'::jsonb),
        'receptions', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', reception.id,
                'title', reception.title,
                'receptionType', reception.reception_type,
                'plannedOn', reception.planned_on,
                'pronouncedOn', reception.pronounced_on,
                'status', reception.status
            ) ORDER BY reception.planned_on NULLS LAST, reception.created_at)
            FROM public.opc_receptions reception
            WHERE reception.project_id = project.id
        ), '[]'::jsonb),
        'lots', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', lot.id, 'code', lot.code, 'name', lot.name, 'companyId', lot.company_id
            ) ORDER BY lot.sequence_number)
            FROM public.opc_lots lot WHERE lot.project_id = project.id
        ), '[]'::jsonb),
        'zones', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', zone.id, 'code', zone.code, 'name', zone.name, 'parentId', zone.parent_id
            ) ORDER BY zone.sequence_number)
            FROM public.opc_zones zone WHERE zone.project_id = project.id
        ), '[]'::jsonb),
        'meetings', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', meeting.id,
                'title', meeting.title,
                'meetingType', meeting.meeting_type,
                'scheduledAt', meeting.scheduled_at,
                'status', meeting.status
            ) ORDER BY meeting.scheduled_at DESC)
            FROM public.opc_meetings meeting WHERE meeting.project_id = project.id
        ), '[]'::jsonb),
        'planningVersions', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', version.id,
                'name', version.name,
                'versionNumber', version.version_number,
                'isBaseline', version.is_baseline,
                'createdAt', version.created_at
            ) ORDER BY version.version_number DESC)
            FROM public.opc_planning_versions version WHERE version.project_id = project.id
        ), '[]'::jsonb)
    ) INTO result
    FROM public.projects project
    WHERE project.id = target_project_id;

    IF result IS NULL THEN
        RAISE EXCEPTION 'opc_project_not_found' USING ERRCODE = 'P0002';
    END IF;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opc_baseline(
    target_project_id UUID,
    target_name TEXT,
    target_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    created_version_id UUID;
    next_version INTEGER;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_name), '') IS NULL THEN
        RAISE EXCEPTION 'opc_baseline_name_required' USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM public.opc_planning_versions WHERE project_id = target_project_id;

    INSERT INTO public.opc_planning_versions (
        project_id, version_number, name, description, is_baseline, is_locked, created_by
    ) VALUES (
        target_project_id, next_version, BTRIM(target_name), target_description, TRUE, TRUE, auth.uid()
    ) RETURNING id INTO created_version_id;

    INSERT INTO public.opc_planning_version_items (version_id, entity_type, entity_id, payload)
    SELECT created_version_id, 'task', task.id, to_jsonb(task)
    FROM public.opc_tasks task WHERE task.project_id = target_project_id;

    INSERT INTO public.opc_planning_version_items (version_id, entity_type, entity_id, payload)
    SELECT created_version_id, 'dependency', dependency.id, to_jsonb(dependency)
    FROM public.opc_task_dependencies dependency WHERE dependency.project_id = target_project_id;

    RETURN created_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_opc_progress(
    target_task_id UUID,
    target_progress_percent NUMERIC,
    target_completed_quantity NUMERIC DEFAULT NULL,
    target_measured_on DATE DEFAULT CURRENT_DATE,
    target_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    target_project_id UUID;
    target_company_id UUID;
    entry_id UUID;
BEGIN
    SELECT project_id, company_id INTO target_project_id, target_company_id
    FROM public.opc_tasks WHERE id = target_task_id;

    IF target_project_id IS NULL
       OR NOT public.can_contribute_opc_project(target_project_id)
       OR (
           NOT public.can_edit_opc_project(target_project_id)
           AND target_company_id IS DISTINCT FROM public.opc_member_company(target_project_id)
       ) THEN
        RAISE EXCEPTION 'opc_progress_access_denied' USING ERRCODE = '42501';
    END IF;

    IF target_progress_percent < 0 OR target_progress_percent > 100 THEN
        RAISE EXCEPTION 'opc_progress_out_of_range' USING ERRCODE = '22003';
    END IF;

    INSERT INTO public.opc_progress_entries (
        project_id, task_id, progress_percent, completed_quantity,
        measured_on, comment, recorded_by
    ) VALUES (
        target_project_id, target_task_id, target_progress_percent,
        target_completed_quantity, target_measured_on, target_comment, auth.uid()
    )
    ON CONFLICT (task_id, measured_on, recorded_by)
    DO UPDATE SET
        progress_percent = EXCLUDED.progress_percent,
        completed_quantity = EXCLUDED.completed_quantity,
        comment = EXCLUDED.comment
    RETURNING id INTO entry_id;

    UPDATE public.opc_tasks
    SET progress_percent = target_progress_percent,
        completed_quantity = COALESCE(target_completed_quantity, completed_quantity),
        status = CASE
            WHEN target_progress_percent >= 100 THEN 'completed'::public.opc_task_status
            WHEN target_progress_percent > 0 THEN 'in_progress'::public.opc_task_status
            ELSE status
        END,
        actual_start = CASE
            WHEN target_progress_percent > 0 THEN COALESCE(actual_start, target_measured_on)
            ELSE actual_start
        END,
        actual_end = CASE WHEN target_progress_percent >= 100 THEN target_measured_on ELSE NULL END,
        updated_at = NOW()
    WHERE id = target_task_id;

    RETURN entry_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_opc_task(
    target_project_id UUID,
    target_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    target_task_id UUID;
    task_start DATE;
    task_end DATE;
    task_is_milestone BOOLEAN;
    task_duration INTEGER;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_payload->>'code'), '') IS NULL
       OR NULLIF(BTRIM(target_payload->>'name'), '') IS NULL THEN
        RAISE EXCEPTION 'opc_task_identity_required' USING ERRCODE = '22023';
    END IF;

    task_start := (target_payload->>'plannedStart')::DATE;
    task_end := (target_payload->>'plannedEnd')::DATE;
    task_is_milestone := COALESCE((target_payload->>'isMilestone')::BOOLEAN, FALSE);
    task_duration := CASE
        WHEN task_is_milestone THEN 0
        ELSE COALESCE((target_payload->>'durationDays')::INTEGER, task_end - task_start + 1)
    END;

    IF task_end < task_start OR task_duration < 0 THEN
        RAISE EXCEPTION 'opc_task_dates_invalid' USING ERRCODE = '22007';
    END IF;

    IF NULLIF(target_payload->>'id', '') IS NOT NULL THEN
        target_task_id := (target_payload->>'id')::UUID;
        UPDATE public.opc_tasks
        SET code = BTRIM(target_payload->>'code'),
            name = BTRIM(target_payload->>'name'),
            description = NULLIF(BTRIM(target_payload->>'description'), ''),
            planned_start = task_start,
            planned_end = task_end,
            duration_days = task_duration,
            priority = COALESCE((target_payload->>'priority')::public.opc_task_priority, priority),
            is_milestone = task_is_milestone,
            is_contractual_milestone = COALESCE((target_payload->>'isContractualMilestone')::BOOLEAN, FALSE),
            updated_at = NOW()
        WHERE id = target_task_id AND project_id = target_project_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'opc_task_not_found' USING ERRCODE = 'P0002';
        END IF;
    ELSE
        INSERT INTO public.opc_tasks (
            project_id, code, name, description, planned_start, planned_end,
            duration_days, priority, is_milestone, is_contractual_milestone,
            created_by
        ) VALUES (
            target_project_id,
            BTRIM(target_payload->>'code'),
            BTRIM(target_payload->>'name'),
            NULLIF(BTRIM(target_payload->>'description'), ''),
            task_start,
            task_end,
            task_duration,
            COALESCE((target_payload->>'priority')::public.opc_task_priority, 'normal'),
            task_is_milestone,
            COALESCE((target_payload->>'isContractualMilestone')::BOOLEAN, FALSE),
            auth.uid()
        ) RETURNING id INTO target_task_id;
    END IF;

    RETURN target_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opc_dependency(
    target_project_id UUID,
    target_predecessor_id UUID,
    target_successor_id UUID,
    target_dependency_type public.opc_dependency_type DEFAULT 'FS',
    target_lag_days INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    dependency_id UUID;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.opc_task_dependencies (
        project_id, predecessor_id, successor_id, dependency_type,
        lag_days, created_by
    ) VALUES (
        target_project_id, target_predecessor_id, target_successor_id,
        target_dependency_type, target_lag_days, auth.uid()
    ) RETURNING id INTO dependency_id;

    RETURN dependency_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opc_action(
    target_project_id UUID,
    target_title TEXT,
    target_due_on DATE,
    target_priority public.opc_task_priority DEFAULT 'normal',
    target_task_id UUID DEFAULT NULL,
    target_assignee_organization_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    action_id UUID;
    member_company UUID;
BEGIN
    IF NOT public.can_contribute_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_contribution_denied' USING ERRCODE = '42501';
    END IF;

    member_company := public.opc_member_company(target_project_id);
    IF NOT public.can_edit_opc_project(target_project_id)
       AND target_assignee_organization_id IS DISTINCT FROM member_company THEN
        RAISE EXCEPTION 'opc_action_company_scope_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_title), '') IS NULL THEN
        RAISE EXCEPTION 'opc_action_title_required' USING ERRCODE = '22023';
    END IF;

    IF target_task_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.opc_tasks task
        WHERE task.id = target_task_id AND task.project_id = target_project_id
    ) THEN
        RAISE EXCEPTION 'opc_action_task_cross_project' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.opc_actions (
        project_id, task_id, title, due_on, priority,
        assignee_organization_id, created_by
    ) VALUES (
        target_project_id, target_task_id, BTRIM(target_title), target_due_on,
        target_priority, COALESCE(target_assignee_organization_id, member_company), auth.uid()
    ) RETURNING id INTO action_id;

    RETURN action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opc_meeting(
    target_project_id UUID,
    target_title TEXT,
    target_scheduled_at TIMESTAMPTZ,
    target_meeting_type TEXT DEFAULT 'site',
    target_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    meeting_id UUID;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_title), '') IS NULL
       OR target_meeting_type NOT IN ('site', 'coordination', 'planning', 'opr', 'reception', 'other') THEN
        RAISE EXCEPTION 'opc_meeting_invalid' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.opc_meetings (
        project_id, title, meeting_type, scheduled_at, location,
        status, created_by
    ) VALUES (
        target_project_id, BTRIM(target_title), target_meeting_type,
        target_scheduled_at, NULLIF(BTRIM(target_location), ''),
        'scheduled', auth.uid()
    ) RETURNING id INTO meeting_id;

    RETURN meeting_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.declare_opc_delay(
    target_project_id UUID,
    target_task_id UUID,
    target_cause TEXT,
    target_cause_category TEXT,
    target_delay_days INTEGER,
    target_occurred_on DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    delay_id UUID;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_cause), '') IS NULL
       OR target_delay_days <= 0
       OR target_cause_category NOT IN ('company', 'client', 'design', 'weather', 'supply', 'administrative', 'interface', 'other')
       OR NOT EXISTS (
           SELECT 1 FROM public.opc_tasks task
           WHERE task.id = target_task_id AND task.project_id = target_project_id
       ) THEN
        RAISE EXCEPTION 'opc_delay_invalid' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.opc_delay_events (
        project_id, task_id, cause, cause_category, delay_days,
        occurred_on, created_by
    ) VALUES (
        target_project_id, target_task_id, BTRIM(target_cause),
        target_cause_category, target_delay_days, target_occurred_on, auth.uid()
    ) RETURNING id INTO delay_id;

    RETURN delay_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opc_reception(
    target_project_id UUID,
    target_title TEXT,
    target_reception_type TEXT,
    target_planned_on DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    reception_id UUID;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_title), '') IS NULL
       OR target_reception_type NOT IN ('opr', 'pre_reception', 'reception', 'partial_reception', 'gpa') THEN
        RAISE EXCEPTION 'opc_reception_invalid' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.opc_receptions (
        project_id, reception_type, title, planned_on, status, created_by
    ) VALUES (
        target_project_id, target_reception_type, BTRIM(target_title),
        target_planned_on, 'planned', auth.uid()
    ) RETURNING id INTO reception_id;

    RETURN reception_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opc_reservation(
    target_project_id UUID,
    target_reference TEXT,
    target_title TEXT,
    target_severity TEXT DEFAULT 'minor',
    target_due_on DATE DEFAULT NULL,
    target_reception_id UUID DEFAULT NULL,
    target_task_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    reservation_id UUID;
BEGIN
    IF NOT public.can_edit_opc_project(target_project_id) THEN
        RAISE EXCEPTION 'opc_project_edit_denied' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(target_reference), '') IS NULL
       OR NULLIF(BTRIM(target_title), '') IS NULL
       OR target_severity NOT IN ('minor', 'major', 'blocking') THEN
        RAISE EXCEPTION 'opc_reservation_invalid' USING ERRCODE = '22023';
    END IF;

    IF target_reception_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.opc_receptions reception
        WHERE reception.id = target_reception_id AND reception.project_id = target_project_id
    ) THEN
        RAISE EXCEPTION 'opc_reservation_reception_cross_project' USING ERRCODE = '23514';
    END IF;

    IF target_task_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.opc_tasks task
        WHERE task.id = target_task_id AND task.project_id = target_project_id
    ) THEN
        RAISE EXCEPTION 'opc_reservation_task_cross_project' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.opc_reservations (
        project_id, reception_id, task_id, reference, title,
        severity, due_on, status, created_by
    ) VALUES (
        target_project_id, target_reception_id, target_task_id,
        UPPER(BTRIM(target_reference)), BTRIM(target_title), target_severity,
        target_due_on, 'open', auth.uid()
    ) RETURNING id INTO reservation_id;

    RETURN reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_opc_project(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_edit_opc_project(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_contribute_opc_project(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.opc_member_company(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_opc_workspace(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_opc_baseline(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_opc_progress(UUID, NUMERIC, NUMERIC, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_opc_task(UUID, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_opc_dependency(UUID, UUID, UUID, public.opc_dependency_type, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_opc_action(UUID, TEXT, DATE, public.opc_task_priority, UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_opc_meeting(UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.declare_opc_delay(UUID, UUID, TEXT, TEXT, INTEGER, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_opc_reception(UUID, TEXT, TEXT, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_opc_reservation(UUID, TEXT, TEXT, TEXT, DATE, UUID, UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_access_opc_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_opc_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_contribute_opc_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.opc_member_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_opc_workspace(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opc_baseline(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_opc_progress(UUID, NUMERIC, NUMERIC, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_opc_task(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opc_dependency(UUID, UUID, UUID, public.opc_dependency_type, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opc_action(UUID, TEXT, DATE, public.opc_task_priority, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opc_meeting(UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.declare_opc_delay(UUID, UUID, TEXT, TEXT, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opc_reception(UUID, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opc_reservation(UUID, TEXT, TEXT, TEXT, DATE, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.get_opc_workspace(UUID) IS
'Retourne le snapshot OPC autorise d un chantier sans injecter de donnees fictives.';
COMMENT ON FUNCTION public.create_opc_baseline(UUID, TEXT, TEXT) IS
'Cree une version de planning verrouillee et copie les taches et dependances.';
COMMENT ON TABLE public.opc_change_log IS
'Journal metier append-only des modifications OPC, distinct de l audit de signature.';
