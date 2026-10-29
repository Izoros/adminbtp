-- Données fictives de démonstration — bibliothèque de modèles de documents premium (Phase C).
-- Réutilise les mêmes identifiants fixes que les seeds Phase A/B (`aa6f3ee5-3d6a-4e5c-8823-
-- e39030844dd8` = compte ADMIN_PLATEFORME de démonstration, `c0115ecd-2400-4a48-b18a-
-- 4db633451692` = organisation SARL Madaterrassement, voir 0001_demo_admin_user.sql et
-- 0005_directory_phase_b_seed.sql).

insert into document_template_catalog (id, service_code, code, name, description, category) values
  (
    'c3d4e5f6-0001-4000-8000-000000000001', 'templates.moe', 'templates.moe.doe_structure',
    'DOE — Dossier des ouvrages exécutés (structure)',
    'Modèle premium de DOE prérempli pour les missions de maîtrise d''œuvre, lot structure.',
    'DOE'
  ),
  (
    'c3d4e5f6-0001-4000-8000-000000000002', 'templates.tce', 'templates.tce.pv_reception',
    'Procès-verbal de réception (tous corps d''état)',
    'Modèle premium de PV de réception multi-lots, à compléter par chantier.',
    'ADMINISTRATIF'
  );

insert into template_versions (id, template_catalog_id, version_number, file_url, variables, created_by_user_id) values
  (
    'c3d4e5f6-0002-4000-8000-000000000001', 'c3d4e5f6-0001-4000-8000-000000000001', 1,
    'demo://premium-templates/doe-structure-v1.docx', array['chantier.nom', 'societe.nom'],
    'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'
  ),
  (
    'c3d4e5f6-0002-4000-8000-000000000002', 'c3d4e5f6-0001-4000-8000-000000000002', 1,
    'demo://premium-templates/pv-reception-v1.docx', array['chantier.nom'],
    'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'
  );

-- Achat de démonstration : seule SARL Madaterrassement a acheté le modèle DOE structure — sert à
-- vérifier l'invariant d'isolation (voir docs/VALIDATION_CHECKLIST.md Phase C) : aucune autre
-- organisation ne doit avoir accès à template_versions pour ce modèle, ni pouvoir générer un
-- document à partir de lui. Le PV de réception (deuxième modèle) n'est acheté par personne —
-- sert à vérifier qu'un modèle non acheté reste invisible même listé au catalogue.
insert into template_purchases (organization_id, template_catalog_id, version_id, purchased_by_user_id) values
  (
    'c0115ecd-2400-4a48-b18a-4db633451692', 'c3d4e5f6-0001-4000-8000-000000000001',
    'c3d4e5f6-0002-4000-8000-000000000001', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'
  );
