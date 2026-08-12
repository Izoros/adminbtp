\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  helper_name TEXT;
BEGIN
  FOREACH helper_name IN ARRAY ARRAY[
    'is_org_manager',
    'is_org_contributor',
    'can_access_project',
    'can_manage_project',
    'can_complete_phase',
    'is_platform_admin'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_proc procedure
      JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = 'public'
        AND procedure.proname = helper_name
        AND procedure.prosecdef = TRUE
        AND procedure.proconfig @> ARRAY['search_path=pg_catalog, public']
    ) THEN
      RAISE EXCEPTION 'Fonction RLS non durcie: %', helper_name;
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF has_column_privilege('authenticated', 'public.user_profiles', 'internal_role', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated peut encore modifier internal_role';
  END IF;

  IF NOT has_column_privilege('authenticated', 'public.user_profiles', 'full_name', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated ne peut plus modifier full_name';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.user_profiles'::regclass
      AND tgname = 'user_profiles_guard_internal_role'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Trigger de protection internal_role absent';
  END IF;
END;
$$;

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
)
VALUES (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'authenticated',
  'authenticated',
  'security-audit@example.invalid',
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
);

INSERT INTO public.organizations (id, slug, name, created_by)
VALUES (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'security-audit',
  'Organisation audit securite',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
);

INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
VALUES (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'org_owner',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
);

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
)
VALUES (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'authenticated',
  'authenticated',
  'security-viewer@example.invalid',
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
);

INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
VALUES (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'org_viewer',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
BEGIN
  BEGIN
    UPDATE public.user_profiles
    SET internal_role = 'platform_admin'
    WHERE id = auth.uid();

    RAISE EXCEPTION 'L auto-elevation internal_role a reussi';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'ffffffff-ffff-4fff-8fff-ffffffffffff', true);

DO $$
BEGIN
  IF public.is_org_contributor('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') THEN
    RAISE EXCEPTION 'org_viewer est encore considere contributeur';
  END IF;

  BEGIN
    INSERT INTO public.ai_suggestions (
      organization_id,
      source_entity_type,
      source_entity_id,
      suggestion_kind,
      title,
      prompt_snapshot
    ) VALUES (
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'document',
      '99999999-9999-4999-8999-999999999999',
      'document_classification',
      'Tentative lecteur',
      'test'
    );

    RAISE EXCEPTION 'org_viewer a pu inserer une suggestion IA';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);

RESET ROLE;
GRANT UPDATE (internal_role) ON public.user_profiles TO authenticated;
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  BEGIN
    UPDATE public.user_profiles
    SET internal_role = 'platform_admin'
    WHERE id = auth.uid();

    RAISE EXCEPTION 'Le trigger a laisse passer internal_role';
  EXCEPTION
    WHEN insufficient_privilege THEN
      IF SQLERRM <> 'internal_role_immutable' THEN
        RAISE;
      END IF;
  END;
END;
$$;

RESET ROLE;
REVOKE UPDATE (internal_role) ON public.user_profiles FROM authenticated;
SET LOCAL ROLE authenticated;

UPDATE public.user_profiles
SET full_name = 'Profil autorise'
WHERE id = auth.uid();

DO $$
DECLARE
  visible_memberships INTEGER;
BEGIN
  SELECT count(*)
  INTO visible_memberships
  FROM public.organization_members
  WHERE user_id = auth.uid();

  IF visible_memberships <> 1 THEN
    RAISE EXCEPTION 'Lecture RLS organization_members incorrecte: %', visible_memberships;
  END IF;

  IF NOT public.is_org_manager('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') THEN
    RAISE EXCEPTION 'Le helper is_org_manager ne reconnait pas le proprietaire';
  END IF;
END;
$$;

RESET ROLE;
ROLLBACK;

SELECT 'Contrats de durcissement securite valides' AS result;
