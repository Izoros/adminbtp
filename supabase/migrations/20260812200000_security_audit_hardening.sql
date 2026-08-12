-- Phase 36 - Durcissement issu de l'audit de securite du 12 aout 2026.
-- Les fonctions d'aide RLS s'executent avec les droits de leur proprietaire afin
-- d'eviter toute recursion de politique, tout en conservant auth.uid() comme
-- identite de reference.

CREATE OR REPLACE FUNCTION public.is_org_manager(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = target_org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('org_owner', 'org_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_contributor(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = target_org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('org_owner', 'org_admin', 'org_member')
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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

CREATE OR REPLACE FUNCTION public.can_complete_phase(target_phase_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT
        public.can_access_project(pp.project_id)
        AND NOT EXISTS (
            SELECT 1
            FROM public.phase_checklist_items pci
            WHERE pci.phase_id = target_phase_id
              AND pci.is_required = TRUE
              AND pci.is_completed = FALSE
        )
    FROM public.project_phases pp
    WHERE pp.id = target_phase_id;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.internal_role = 'platform_admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_org_manager(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_contributor(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_project(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_project(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_complete_phase(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_org_manager(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_contributor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_complete_phase(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- Un compte applicatif ne peut modifier que les deux champs de profil prevus
-- par l'interface. internal_role reste reserve au service_role et aux
-- administrateurs de la base.
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (full_name, default_organization_id) ON public.user_profiles TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_user_profile_internal_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.internal_role IS DISTINCT FROM OLD.internal_role
       AND COALESCE(auth.role(), '') <> 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'internal_role_immutable'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_user_profile_internal_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_profiles_guard_internal_role ON public.user_profiles;
CREATE TRIGGER user_profiles_guard_internal_role
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION private.guard_user_profile_internal_role();

-- org_viewer reste strictement en lecture seule sur les suggestions et leur
-- journal. Les membres contributeurs peuvent conserver le parcours de revue.
DROP POLICY IF EXISTS "ai_suggestions_manage_org_members" ON public.ai_suggestions;

DROP POLICY IF EXISTS "ai_suggestions_insert_org_contributors" ON public.ai_suggestions;
CREATE POLICY "ai_suggestions_insert_org_contributors"
ON public.ai_suggestions
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_contributor(organization_id));

DROP POLICY IF EXISTS "ai_suggestions_update_org_contributors" ON public.ai_suggestions;
CREATE POLICY "ai_suggestions_update_org_contributors"
ON public.ai_suggestions
FOR UPDATE
TO authenticated
USING (public.is_org_contributor(organization_id))
WITH CHECK (public.is_org_contributor(organization_id));

DROP POLICY IF EXISTS "ai_suggestions_delete_org_contributors" ON public.ai_suggestions;
CREATE POLICY "ai_suggestions_delete_org_contributors"
ON public.ai_suggestions
FOR DELETE
TO authenticated
USING (public.is_org_contributor(organization_id));

DROP POLICY IF EXISTS "ai_suggestion_audit_logs_insert_org_members" ON public.ai_suggestion_audit_logs;
DROP POLICY IF EXISTS "ai_suggestion_audit_logs_insert_org_contributors" ON public.ai_suggestion_audit_logs;
CREATE POLICY "ai_suggestion_audit_logs_insert_org_contributors"
ON public.ai_suggestion_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.ai_suggestions suggestion
        WHERE suggestion.id = ai_suggestion_audit_logs.ai_suggestion_id
          AND public.is_org_contributor(suggestion.organization_id)
    )
);

DROP POLICY IF EXISTS "client_feedback_threads_insert_visible_parties" ON public.client_feedback_threads;
DROP POLICY IF EXISTS "client_feedback_threads_insert_contributors_or_clients" ON public.client_feedback_threads;
CREATE POLICY "client_feedback_threads_insert_contributors_or_clients"
ON public.client_feedback_threads
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_org_contributor(organization_id)
    OR EXISTS (
        SELECT 1
        FROM public.organization_members client_member
        WHERE client_member.organization_id = client_feedback_threads.client_organization_id
          AND client_member.user_id = auth.uid()
    )
);

COMMENT ON FUNCTION public.is_org_contributor(UUID) IS
'Retourne vrai pour un membre autorise a ecrire, a l exclusion du role org_viewer.';

COMMENT ON FUNCTION private.guard_user_profile_internal_role() IS
'Defense en profondeur contre l auto-elevation du role interne via PostgREST.';
