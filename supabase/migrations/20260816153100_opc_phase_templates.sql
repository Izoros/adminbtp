-- Migration separee : PostgreSQL exige un commit apres l'ajout de la valeur
-- d'enum phase_profile avant de pouvoir l'utiliser.

INSERT INTO public.project_phase_templates (
    profile,
    code,
    title,
    description,
    sequence_number
) VALUES
    ('opc', 'opc-planning-initial', 'Planning initial et baseline', 'Structurer le WBS, les jalons contractuels, les dependances et figer le planning de reference.', 1),
    ('opc', 'opc-coordination-execution', 'Coordination d execution', 'Piloter le chemin critique, les interfaces entreprises, les zones et les prerequis.', 2),
    ('opc', 'opc-lookahead-progress', 'Lookahead et avancement', 'Animer les horizons court terme, relever l avancement et traiter les derives.', 3),
    ('opc', 'opc-opr-reception', 'OPR, reception et GPA', 'Coordonner les OPR, les reserves, les receptions et la garantie de parfait achevement.', 4)
ON CONFLICT (code) DO UPDATE SET
    profile = EXCLUDED.profile,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    sequence_number = EXCLUDED.sequence_number,
    updated_at = NOW();

INSERT INTO public.project_phases (project_id, template_id, profile)
SELECT DISTINCT
    project_organization.project_id,
    template.id,
    'opc'::public.phase_profile
FROM public.project_organizations project_organization
CROSS JOIN public.project_phase_templates template
WHERE project_organization.role = 'opc'
  AND template.profile = 'opc'
ON CONFLICT (project_id, template_id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.initialize_opc_project_phases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.role = 'opc' THEN
        INSERT INTO public.project_phases (project_id, template_id, profile)
        SELECT NEW.project_id, template.id, 'opc'::public.phase_profile
        FROM public.project_phase_templates template
        WHERE template.profile = 'opc'
        ON CONFLICT (project_id, template_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.initialize_opc_project_phases() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS project_organizations_initialize_opc_phases ON public.project_organizations;
CREATE TRIGGER project_organizations_initialize_opc_phases
AFTER INSERT OR UPDATE OF role ON public.project_organizations
FOR EACH ROW EXECUTE FUNCTION private.initialize_opc_project_phases();
