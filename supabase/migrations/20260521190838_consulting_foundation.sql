-- AdminBTP - socle consulting securise pour Supabase

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expert_role') THEN
        CREATE TYPE expert_role AS ENUM (
            'btp_engineer',
            'architect_hmonp',
            'regulatory_consultant',
            'project_management_consultant',
            'tce_support',
            'moa_support',
            'other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expert_request_type') THEN
        CREATE TYPE expert_request_type AS ENUM (
            'technical_question',
            'document_analysis',
            'methodology_review',
            'doe_review',
            'exe_review',
            'ppsps_review',
            'tender_support',
            'regulatory_support',
            'architectural_support',
            'project_management_support',
            'tce_support',
            'moa_support',
            'other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expert_request_status') THEN
        CREATE TYPE expert_request_status AS ENUM (
            'draft',
            'submitted',
            'qualified',
            'assigned',
            'in_progress',
            'waiting_for_documents',
            'waiting_for_client',
            'completed',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_billing_mode') THEN
        CREATE TYPE mission_billing_mode AS ENUM (
            'hourly',
            'fixed_fee',
            'retainer',
            'included_in_plan',
            'not_billable'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consulting_mission_status') THEN
        CREATE TYPE consulting_mission_status AS ENUM (
            'draft',
            'quoted',
            'approved',
            'scheduled',
            'in_progress',
            'on_hold',
            'completed',
            'cancelled',
            'invoiced'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_type') THEN
        CREATE TYPE review_type AS ENUM (
            'technical_review',
            'document_review',
            'doe_review',
            'exe_review',
            'ppsps_review',
            'regulatory_review',
            'architectural_review',
            'coordination_review',
            'compliance_review',
            'other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM (
            'draft',
            'in_progress',
            'ready_for_validation',
            'validated',
            'sent',
            'archived'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_mode') THEN
        CREATE TYPE delivery_mode AS ENUM (
            'human',
            'ai',
            'hybrid'
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.internal_role = 'platform_admin'
    );
$$;

CREATE TABLE IF NOT EXISTS public.expert_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    slug TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role expert_role NOT NULL,
    headline TEXT,
    bio TEXT,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    credentials TEXT[] NOT NULL DEFAULT '{}',
    seniority_years INTEGER,
    internal_expert BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate_cents INTEGER,
    currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT expert_profiles_seniority_check
        CHECK (seniority_years IS NULL OR seniority_years >= 0),
    CONSTRAINT expert_profiles_hourly_rate_check
        CHECK (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0)
);

CREATE TABLE IF NOT EXISTS public.expert_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    request_number TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    request_type expert_request_type NOT NULL,
    status expert_request_status NOT NULL DEFAULT 'draft',
    priority SMALLINT NOT NULL DEFAULT 3,
    requested_by_name TEXT,
    requested_by_email TEXT,
    company_name TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    assigned_expert_id UUID REFERENCES public.expert_profiles(id) ON DELETE SET NULL,
    delivery_mode delivery_mode NOT NULL DEFAULT 'hybrid',
    intake_channel TEXT,
    requested_due_at TIMESTAMPTZ,
    qualified_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT expert_requests_priority_check
        CHECK (priority BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS public.consulting_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    mission_number TEXT UNIQUE,
    expert_request_id UUID REFERENCES public.expert_requests(id) ON DELETE SET NULL,
    lead_expert_id UUID REFERENCES public.expert_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status consulting_mission_status NOT NULL DEFAULT 'draft',
    billing_mode mission_billing_mode NOT NULL DEFAULT 'hourly',
    related_entity_type TEXT,
    related_entity_id TEXT,
    sold_hours NUMERIC(10,2),
    consumed_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
    hourly_rate_cents INTEGER,
    fixed_fee_cents INTEGER,
    currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
    started_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT consulting_missions_sold_hours_check
        CHECK (sold_hours IS NULL OR sold_hours >= 0),
    CONSTRAINT consulting_missions_consumed_hours_check
        CHECK (consumed_hours >= 0),
    CONSTRAINT consulting_missions_hourly_rate_check
        CHECK (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0),
    CONSTRAINT consulting_missions_fixed_fee_check
        CHECK (fixed_fee_cents IS NULL OR fixed_fee_cents >= 0)
);

CREATE TABLE IF NOT EXISTS public.consulting_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulting_mission_id UUID NOT NULL REFERENCES public.consulting_missions(id) ON DELETE CASCADE,
    expert_profile_id UUID REFERENCES public.expert_profiles(id) ON DELETE SET NULL,
    work_date DATE NOT NULL,
    hours_spent NUMERIC(8,2) NOT NULL,
    billable_hours NUMERIC(8,2) NOT NULL,
    activity_type TEXT,
    notes TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT consulting_hours_hours_spent_check
        CHECK (hours_spent > 0),
    CONSTRAINT consulting_hours_billable_hours_check
        CHECK (billable_hours >= 0 AND billable_hours <= hours_spent)
);

CREATE TABLE IF NOT EXISTS public.technical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    review_number TEXT UNIQUE,
    expert_request_id UUID REFERENCES public.expert_requests(id) ON DELETE SET NULL,
    consulting_mission_id UUID REFERENCES public.consulting_missions(id) ON DELETE SET NULL,
    reviewer_expert_id UUID REFERENCES public.expert_profiles(id) ON DELETE SET NULL,
    review_type review_type NOT NULL,
    status review_status NOT NULL DEFAULT 'draft',
    title TEXT NOT NULL,
    summary TEXT,
    findings TEXT,
    recommendations TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    source_document_type TEXT,
    source_document_id TEXT,
    delivery_mode delivery_mode NOT NULL DEFAULT 'hybrid',
    reviewed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expert_profiles_role
    ON public.expert_profiles(role);

CREATE INDEX IF NOT EXISTS idx_expert_requests_status
    ON public.expert_requests(status);

CREATE INDEX IF NOT EXISTS idx_expert_requests_assigned_expert_id
    ON public.expert_requests(assigned_expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_requests_related_entity
    ON public.expert_requests(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_consulting_missions_status
    ON public.consulting_missions(status);

CREATE INDEX IF NOT EXISTS idx_consulting_missions_expert_request_id
    ON public.consulting_missions(expert_request_id);

CREATE INDEX IF NOT EXISTS idx_consulting_missions_related_entity
    ON public.consulting_missions(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_consulting_hours_mission_work_date
    ON public.consulting_hours(consulting_mission_id, work_date);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_mission_id
    ON public.technical_reviews(consulting_mission_id);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_request_id
    ON public.technical_reviews(expert_request_id);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_related_entity
    ON public.technical_reviews(related_entity_type, related_entity_id);

GRANT SELECT ON public.expert_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.expert_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.consulting_missions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.consulting_hours TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.technical_reviews TO authenticated;

ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_profiles_select_visible_profiles" ON public.expert_profiles;
CREATE POLICY "expert_profiles_select_visible_profiles"
ON public.expert_profiles
FOR SELECT
TO authenticated
USING (
    internal_expert = TRUE
    OR public.is_platform_admin()
    OR (
        organization_id IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.organization_members om
            WHERE om.organization_id = expert_profiles.organization_id
              AND om.user_id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "expert_profiles_manage_managers" ON public.expert_profiles;
CREATE POLICY "expert_profiles_manage_managers"
ON public.expert_profiles
FOR ALL
TO authenticated
USING (
    public.is_platform_admin()
    OR (
        organization_id IS NOT NULL
        AND public.is_org_manager(organization_id)
    )
)
WITH CHECK (
    public.is_platform_admin()
    OR (
        organization_id IS NOT NULL
        AND public.is_org_manager(organization_id)
    )
);

DROP POLICY IF EXISTS "expert_requests_select_org_members" ON public.expert_requests;
CREATE POLICY "expert_requests_select_org_members"
ON public.expert_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = expert_requests.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "expert_requests_manage_org_members" ON public.expert_requests;
CREATE POLICY "expert_requests_manage_org_members"
ON public.expert_requests
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = expert_requests.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = expert_requests.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "consulting_missions_select_org_members" ON public.consulting_missions;
CREATE POLICY "consulting_missions_select_org_members"
ON public.consulting_missions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = consulting_missions.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "consulting_missions_manage_org_members" ON public.consulting_missions;
CREATE POLICY "consulting_missions_manage_org_members"
ON public.consulting_missions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = consulting_missions.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = consulting_missions.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "consulting_hours_select_org_members" ON public.consulting_hours;
CREATE POLICY "consulting_hours_select_org_members"
ON public.consulting_hours
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.consulting_missions cm
        JOIN public.organization_members om
          ON om.organization_id = cm.organization_id
        WHERE cm.id = consulting_hours.consulting_mission_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "consulting_hours_manage_org_members" ON public.consulting_hours;
CREATE POLICY "consulting_hours_manage_org_members"
ON public.consulting_hours
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.consulting_missions cm
        JOIN public.organization_members om
          ON om.organization_id = cm.organization_id
        WHERE cm.id = consulting_hours.consulting_mission_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.consulting_missions cm
        JOIN public.organization_members om
          ON om.organization_id = cm.organization_id
        WHERE cm.id = consulting_hours.consulting_mission_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "technical_reviews_select_org_members" ON public.technical_reviews;
CREATE POLICY "technical_reviews_select_org_members"
ON public.technical_reviews
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = technical_reviews.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "technical_reviews_manage_org_members" ON public.technical_reviews;
CREATE POLICY "technical_reviews_manage_org_members"
ON public.technical_reviews
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = technical_reviews.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = technical_reviews.organization_id
          AND om.user_id = auth.uid()
    )
);

CREATE OR REPLACE VIEW public.consulting_mission_capacity
WITH (security_invoker = true)
AS
SELECT
    m.id,
    m.organization_id,
    m.mission_number,
    m.title,
    m.status,
    m.billing_mode,
    m.sold_hours,
    m.consumed_hours,
    COALESCE(SUM(h.hours_spent), 0)::NUMERIC(10,2) AS logged_hours,
    COALESCE(SUM(h.billable_hours), 0)::NUMERIC(10,2) AS logged_billable_hours,
    CASE
        WHEN m.sold_hours IS NULL THEN NULL
        ELSE (m.sold_hours - COALESCE(SUM(h.billable_hours), 0))::NUMERIC(10,2)
    END AS remaining_billable_hours
FROM public.consulting_missions m
LEFT JOIN public.consulting_hours h
    ON h.consulting_mission_id = m.id
GROUP BY
    m.id,
    m.organization_id,
    m.mission_number,
    m.title,
    m.status,
    m.billing_mode,
    m.sold_hours,
    m.consumed_hours;

GRANT SELECT ON public.consulting_mission_capacity TO authenticated;

COMMENT ON FUNCTION public.is_platform_admin() IS
'Retourne vrai si l utilisateur courant est administrateur plateforme.';
