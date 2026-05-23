-- AdminBTP - socle de donnees pour l'accompagnement technique et le conseil
-- Cible: PostgreSQL

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

CREATE TABLE IF NOT EXISTS expert_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS expert_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    assigned_expert_id UUID REFERENCES expert_profiles(id),
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

CREATE TABLE IF NOT EXISTS consulting_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_number TEXT UNIQUE,
    expert_request_id UUID REFERENCES expert_requests(id) ON DELETE SET NULL,
    lead_expert_id UUID REFERENCES expert_profiles(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS consulting_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulting_mission_id UUID NOT NULL REFERENCES consulting_missions(id) ON DELETE CASCADE,
    expert_profile_id UUID REFERENCES expert_profiles(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS technical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_number TEXT UNIQUE,
    expert_request_id UUID REFERENCES expert_requests(id) ON DELETE SET NULL,
    consulting_mission_id UUID REFERENCES consulting_missions(id) ON DELETE SET NULL,
    reviewer_expert_id UUID REFERENCES expert_profiles(id) ON DELETE SET NULL,
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
    ON expert_profiles(role);

CREATE INDEX IF NOT EXISTS idx_expert_requests_status
    ON expert_requests(status);

CREATE INDEX IF NOT EXISTS idx_expert_requests_assigned_expert_id
    ON expert_requests(assigned_expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_requests_related_entity
    ON expert_requests(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_consulting_missions_status
    ON consulting_missions(status);

CREATE INDEX IF NOT EXISTS idx_consulting_missions_expert_request_id
    ON consulting_missions(expert_request_id);

CREATE INDEX IF NOT EXISTS idx_consulting_missions_related_entity
    ON consulting_missions(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_consulting_hours_mission_work_date
    ON consulting_hours(consulting_mission_id, work_date);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_mission_id
    ON technical_reviews(consulting_mission_id);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_request_id
    ON technical_reviews(expert_request_id);

CREATE INDEX IF NOT EXISTS idx_technical_reviews_related_entity
    ON technical_reviews(related_entity_type, related_entity_id);

-- Vue utilitaire pour preparer le pilotage de consommation des missions.
CREATE OR REPLACE VIEW consulting_mission_capacity AS
SELECT
    m.id,
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
FROM consulting_missions m
LEFT JOIN consulting_hours h
    ON h.consulting_mission_id = m.id
GROUP BY
    m.id,
    m.mission_number,
    m.title,
    m.status,
    m.billing_mode,
    m.sold_hours,
    m.consumed_hours;
