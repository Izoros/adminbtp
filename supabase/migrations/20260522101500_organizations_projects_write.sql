-- Ecritures minimales du lot organizations + projects.
-- Ces fonctions permettent d'amorcer les creations atomiques
-- sans contourner le modele multi-tenant de lecture.

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    target_name TEXT,
    target_slug TEXT,
    target_legal_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    created_organization_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifie';
    END IF;

    IF btrim(COALESCE(target_name, '')) = '' THEN
        RAISE EXCEPTION 'Nom organisation obligatoire';
    END IF;

    IF btrim(COALESCE(target_slug, '')) = '' THEN
        RAISE EXCEPTION 'Slug organisation obligatoire';
    END IF;

    INSERT INTO public.organizations (
        name,
        slug,
        legal_name,
        created_by
    )
    VALUES (
        btrim(target_name),
        lower(btrim(target_slug)),
        NULLIF(btrim(COALESCE(target_legal_name, '')), ''),
        current_user_id
    )
    RETURNING id INTO created_organization_id;

    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        invited_by
    )
    VALUES (
        created_organization_id,
        current_user_id,
        'org_owner',
        current_user_id
    );

    UPDATE public.user_profiles
    SET default_organization_id = COALESCE(default_organization_id, created_organization_id),
        updated_at = NOW()
    WHERE id = current_user_id;

    RETURN created_organization_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, TEXT) IS
'Cree une organisation puis le rattachement owner du demandeur dans une transaction unique.';

CREATE OR REPLACE FUNCTION public.create_project_with_owner_role(
    target_owner_organization_id UUID,
    target_code TEXT,
    target_slug TEXT,
    target_name TEXT,
    target_description TEXT DEFAULT NULL,
    target_status project_status DEFAULT 'draft',
    target_role project_role DEFAULT 'opc',
    target_starts_on DATE DEFAULT NULL,
    target_ends_on DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    created_project_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifie';
    END IF;

    IF NOT public.is_org_manager(target_owner_organization_id) THEN
        RAISE EXCEPTION 'Droits insuffisants sur l organisation proprietaire';
    END IF;

    IF btrim(COALESCE(target_name, '')) = '' THEN
        RAISE EXCEPTION 'Nom chantier obligatoire';
    END IF;

    IF btrim(COALESCE(target_code, '')) = '' THEN
        RAISE EXCEPTION 'Code chantier obligatoire';
    END IF;

    IF btrim(COALESCE(target_slug, '')) = '' THEN
        RAISE EXCEPTION 'Slug chantier obligatoire';
    END IF;

    INSERT INTO public.projects (
        code,
        slug,
        name,
        description,
        status,
        owner_organization_id,
        created_by,
        starts_on,
        ends_on
    )
    VALUES (
        upper(btrim(target_code)),
        lower(btrim(target_slug)),
        btrim(target_name),
        NULLIF(btrim(COALESCE(target_description, '')), ''),
        target_status,
        target_owner_organization_id,
        current_user_id,
        target_starts_on,
        target_ends_on
    )
    RETURNING id INTO created_project_id;

    INSERT INTO public.project_organizations (
        project_id,
        organization_id,
        role,
        is_lead,
        created_by
    )
    VALUES (
        created_project_id,
        target_owner_organization_id,
        target_role,
        TRUE,
        current_user_id
    );

    RETURN created_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_project_with_owner_role(UUID, TEXT, TEXT, TEXT, TEXT, project_status, project_role, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_project_with_owner_role(UUID, TEXT, TEXT, TEXT, TEXT, project_status, project_role, DATE, DATE) TO authenticated;

COMMENT ON FUNCTION public.create_project_with_owner_role(UUID, TEXT, TEXT, TEXT, TEXT, project_status, project_role, DATE, DATE) IS
'Cree un chantier puis son premier rattachement projet dans une transaction unique.';
