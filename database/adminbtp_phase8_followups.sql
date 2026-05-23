-- Phase 8 - Relances decomptes et tresorerie pour AdminBTP
-- Base cible: Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'situation_status') THEN
        CREATE TYPE situation_status AS ENUM (
            'draft',
            'sent',
            'partially_paid',
            'paid',
            'disputed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'followup_status') THEN
        CREATE TYPE followup_status AS ENUM (
            'scheduled',
            'sent',
            'done',
            'cancelled'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.situations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    reference TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
    issued_on DATE NOT NULL,
    due_on DATE NOT NULL,
    status situation_status NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT situations_amount_check CHECK (amount_cents >= 0),
    CONSTRAINT situations_due_check CHECK (due_on >= issued_on)
);

CREATE TABLE IF NOT EXISTS public.payment_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_id UUID NOT NULL REFERENCES public.situations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    step_label TEXT NOT NULL,
    days_after_due INTEGER NOT NULL,
    scheduled_for DATE NOT NULL,
    status followup_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_followups_days_check CHECK (days_after_due >= 0)
);

GRANT SELECT, INSERT, UPDATE ON public.situations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_followups TO authenticated;

ALTER TABLE public.situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "situations_select_org_members" ON public.situations;
CREATE POLICY "situations_select_org_members"
ON public.situations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = situations.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "situations_manage_org_members" ON public.situations;
CREATE POLICY "situations_manage_org_members"
ON public.situations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = situations.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = situations.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "payment_followups_select_org_members" ON public.payment_followups;
CREATE POLICY "payment_followups_select_org_members"
ON public.payment_followups
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = payment_followups.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "payment_followups_manage_org_members" ON public.payment_followups;
CREATE POLICY "payment_followups_manage_org_members"
ON public.payment_followups
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = payment_followups.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = payment_followups.organization_id
          AND om.user_id = auth.uid()
    )
);
