-- AdminBTP - durcissement de securite des modules tardifs

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ai_suggestions_organization_id_fkey'
    ) THEN
        ALTER TABLE public.ai_suggestions
            ADD CONSTRAINT ai_suggestions_organization_id_fkey
            FOREIGN KEY (organization_id)
            REFERENCES public.organizations(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ai_suggestions_project_id_fkey'
    ) THEN
        ALTER TABLE public.ai_suggestions
            ADD CONSTRAINT ai_suggestions_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES public.projects(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_portal_accesses_organization_id_fkey'
    ) THEN
        ALTER TABLE public.client_portal_accesses
            ADD CONSTRAINT client_portal_accesses_organization_id_fkey
            FOREIGN KEY (organization_id)
            REFERENCES public.organizations(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_portal_accesses_client_organization_id_fkey'
    ) THEN
        ALTER TABLE public.client_portal_accesses
            ADD CONSTRAINT client_portal_accesses_client_organization_id_fkey
            FOREIGN KEY (client_organization_id)
            REFERENCES public.organizations(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_portal_accesses_project_id_fkey'
    ) THEN
        ALTER TABLE public.client_portal_accesses
            ADD CONSTRAINT client_portal_accesses_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES public.projects(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_feedback_threads_organization_id_fkey'
    ) THEN
        ALTER TABLE public.client_feedback_threads
            ADD CONSTRAINT client_feedback_threads_organization_id_fkey
            FOREIGN KEY (organization_id)
            REFERENCES public.organizations(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_feedback_threads_client_organization_id_fkey'
    ) THEN
        ALTER TABLE public.client_feedback_threads
            ADD CONSTRAINT client_feedback_threads_client_organization_id_fkey
            FOREIGN KEY (client_organization_id)
            REFERENCES public.organizations(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_feedback_threads_project_id_fkey'
    ) THEN
        ALTER TABLE public.client_feedback_threads
            ADD CONSTRAINT client_feedback_threads_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES public.projects(id)
            ON DELETE SET NULL;
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.ai_suggestions TO authenticated;
GRANT SELECT, INSERT ON public.ai_suggestion_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.client_portal_accesses TO authenticated;
GRANT SELECT, INSERT ON public.client_feedback_threads TO authenticated;

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestion_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_accesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_feedback_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_suggestions_select_org_members" ON public.ai_suggestions;
CREATE POLICY "ai_suggestions_select_org_members"
ON public.ai_suggestions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = ai_suggestions.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "ai_suggestions_manage_org_members" ON public.ai_suggestions;
CREATE POLICY "ai_suggestions_manage_org_members"
ON public.ai_suggestions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = ai_suggestions.organization_id
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = ai_suggestions.organization_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "ai_suggestion_audit_logs_select_org_members" ON public.ai_suggestion_audit_logs;
CREATE POLICY "ai_suggestion_audit_logs_select_org_members"
ON public.ai_suggestion_audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.ai_suggestions s
        JOIN public.organization_members om
          ON om.organization_id = s.organization_id
        WHERE s.id = ai_suggestion_audit_logs.ai_suggestion_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "ai_suggestion_audit_logs_insert_org_members" ON public.ai_suggestion_audit_logs;
CREATE POLICY "ai_suggestion_audit_logs_insert_org_members"
ON public.ai_suggestion_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.ai_suggestions s
        JOIN public.organization_members om
          ON om.organization_id = s.organization_id
        WHERE s.id = ai_suggestion_audit_logs.ai_suggestion_id
          AND om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "client_portal_accesses_select_visible_parties" ON public.client_portal_accesses;
CREATE POLICY "client_portal_accesses_select_visible_parties"
ON public.client_portal_accesses
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id IN (
            client_portal_accesses.organization_id,
            client_portal_accesses.client_organization_id
          )
    )
);

DROP POLICY IF EXISTS "client_portal_accesses_manage_adminbtp_org_managers" ON public.client_portal_accesses;
CREATE POLICY "client_portal_accesses_manage_adminbtp_org_managers"
ON public.client_portal_accesses
FOR ALL
TO authenticated
USING (public.is_org_manager(organization_id))
WITH CHECK (public.is_org_manager(organization_id));

DROP POLICY IF EXISTS "client_feedback_threads_select_visible_parties" ON public.client_feedback_threads;
CREATE POLICY "client_feedback_threads_select_visible_parties"
ON public.client_feedback_threads
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id IN (
            client_feedback_threads.organization_id,
            client_feedback_threads.client_organization_id
          )
    )
);

DROP POLICY IF EXISTS "client_feedback_threads_insert_visible_parties" ON public.client_feedback_threads;
CREATE POLICY "client_feedback_threads_insert_visible_parties"
ON public.client_feedback_threads
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id IN (
            client_feedback_threads.organization_id,
            client_feedback_threads.client_organization_id
          )
    )
);
