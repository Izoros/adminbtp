-- Données fictives de démonstration — profil société, actes de lancement, pièces de marché,
-- décompte avec ligne, macrolot/sous-traitant.

-- 1. Référentiel trade_codes (16 corps d'état)
insert into trade_codes (code, label, family) values
  ('GO', 'Gros œuvre', 'STRUCTURE_VRD'),
  ('VRD', 'Voirie et réseaux divers', 'STRUCTURE_VRD'),
  ('ESPACES_VERTS', 'Espaces verts', 'STRUCTURE_VRD'),
  ('CHARPENTE', 'Charpente', 'STRUCTURE_VRD'),
  ('COUVERTURE', 'Couverture', 'STRUCTURE_VRD'),
  ('CVC', 'Chauffage, ventilation, climatisation', 'TECHNIQUE'),
  ('ELEC', 'Électricité', 'TECHNIQUE'),
  ('PLOMB', 'Plomberie', 'TECHNIQUE'),
  ('SSI', 'Sécurité incendie', 'TECHNIQUE'),
  ('ASCENSEUR', 'Ascenseur', 'TECHNIQUE'),
  ('ETANCH', 'Étanchéité', 'ETANCHEITE_FACADE'),
  ('MENUIS_EXT', 'Menuiserie extérieure', 'ETANCHEITE_FACADE'),
  ('METALLERIE', 'Métallerie', 'ETANCHEITE_FACADE'),
  ('MENUIS_INT', 'Menuiserie intérieure', 'FINITIONS'),
  ('CARRELAGE', 'Carrelage', 'FINITIONS'),
  ('PEINTURE', 'Peinture', 'FINITIONS');

-- 2. Référentiel act_templates (famille MOE, ACT/DET) — chaîne de dépendances :
-- AE -> NOTIFICATION_MARCHE -> OS_DEMARRAGE -> {OS_PROLONGATION, OS_ARRET -> OS_REPRISE, OS_RECEPTION}
insert into act_templates (mission_family, code, label, document_category, required_mission_role, depends_on_act_code, unlocks_phase_template_code, sort_order) values
  ('MOE', 'AE', 'Acte d''engagement', 'AE', 'MOE', null, null, 1),
  ('MOE', 'NOTIFICATION_MARCHE', 'Notification du marché', 'NOTIFICATION_MARCHE', 'MOE', 'AE', null, 2),
  ('MOE', 'OS_DEMARRAGE', 'OS de démarrage', 'OS', 'MOE', 'NOTIFICATION_MARCHE', 'EXE', 3),
  ('MOE', 'OS_PROLONGATION', 'OS de prolongation', 'OS', 'MOE', 'OS_DEMARRAGE', null, 4),
  ('MOE', 'OS_ARRET', 'OS d''arrêt', 'OS', 'MOE', 'OS_DEMARRAGE', null, 5),
  ('MOE', 'OS_REPRISE', 'OS de reprise', 'OS', 'MOE', 'OS_ARRET', null, 6),
  ('MOE', 'OS_RECEPTION', 'OS de réception', 'OS', 'MOE', 'OS_DEMARRAGE', 'AOR', 7);

-- 3. Profils d'organisation (ne créent aucun droit, uniquement des valeurs par défaut)
insert into organization_profiles (organization_id, legal_kind, default_mission_roles, size_band) values
  ('c0115ecd-2400-4a48-b18a-4db633451692', 'ENTREPRISE', array['ENTREPRISE_GENERALE','SOUS_TRAITANT']::mission_role[], 'PME'),
  ('ce294d75-a768-4c89-8a43-4dc452c2de5e', 'AMO_OPC', array['AMO','MOE']::mission_role[], 'TPE');

insert into organization_trades (organization_id, trade_code_id, is_primary) values
  ('c0115ecd-2400-4a48-b18a-4db633451692', (select id from trade_codes where code = 'GO'), true),
  ('c0115ecd-2400-4a48-b18a-4db633451692', (select id from trade_codes where code = 'VRD'), false);

-- 4. Scénario "actes de lancement" — Cabinet AMO Lagon tient aussi le rôle MOE sur le collège de
-- Kawéni (une organisation peut avoir plusieurs mission_role sur un même chantier).
insert into site_participants (site_id, organization_id, mission_role, joined_at) values
  ('06d0729e-7d45-4e20-bc3d-6afcca29bc2b', 'ce294d75-a768-4c89-8a43-4dc452c2de5e', 'MOE', now());

insert into documents (organization_id, site_id, category, title, status, file_url, act_code, created_by_user_id) values
  ('ce294d75-a768-4c89-8a43-4dc452c2de5e', '06d0729e-7d45-4e20-bc3d-6afcca29bc2b', 'AE', 'Acte d''engagement — Réhabilitation collège de Kawéni', 'ENVOYE', 'demo://documents/doc-7.pdf', 'AE', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ('ce294d75-a768-4c89-8a43-4dc452c2de5e', '06d0729e-7d45-4e20-bc3d-6afcca29bc2b', 'NOTIFICATION_MARCHE', 'Notification du marché — Réhabilitation collège de Kawéni', 'ENVOYE', 'demo://documents/doc-8.pdf', 'NOTIFICATION_MARCHE', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8');

-- 5. Scénario "macrolot et sous-traitant" — Bâti Mayotte Construction (TCE) sous-traite le
-- second œuvre à SARL Madaterrassement sur l'extension de la mairie de Koungou.
insert into lots (id, site_id, number, name, assigned_organization_id, amount_ht) values
  ('a1b2c3d4-0001-4000-8000-000000000001', '73c7ddac-b418-4a6f-8ccc-9c159116a706', 'Lot 01', 'Second œuvre', 'fa304300-2a6e-4f37-a56a-4d574c8c9bbc', 280000),
  ('a1b2c3d4-0001-4000-8000-000000000002', '73c7ddac-b418-4a6f-8ccc-9c159116a706', 'Lot 01-A', 'Second œuvre — Terrassement', 'c0115ecd-2400-4a48-b18a-4db633451692', 95000);

update lots set parent_lot_id = 'a1b2c3d4-0001-4000-8000-000000000001' where id = 'a1b2c3d4-0001-4000-8000-000000000002';

insert into site_participants (site_id, organization_id, mission_role, lot_id, contract_amount_ht, joined_at) values
  ('73c7ddac-b418-4a6f-8ccc-9c159116a706', 'c0115ecd-2400-4a48-b18a-4db633451692', 'SOUS_TRAITANT', 'a1b2c3d4-0001-4000-8000-000000000002', 95000, now());

-- DC4 validé pour ce sous-traitant précis sur ce chantier — condition requise pour toute
-- ventilation de décompte vers cette organisation (has_valid_subcontractor_agreement()).
insert into documents (organization_id, site_id, category, title, status, file_url, concerns_organization_id, created_by_user_id) values
  ('fa304300-2a6e-4f37-a56a-4d574c8c9bbc', '73c7ddac-b418-4a6f-8ccc-9c159116a706', 'DC4', 'DC4 — SARL Madaterrassement (terrassement)', 'VALIDE', 'demo://documents/doc-9.pdf', 'c0115ecd-2400-4a48-b18a-4db633451692', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8');

-- 6. Pièces de marché structurées (saisie manuelle, pas d'OCR réel) + décompte avec ligne
insert into market_contracts (id, site_id, lot_id, contract_type, price_reference_month, retention_guarantee_rate, payment_term_days) values
  ('a1b2c3d4-0002-4000-8000-000000000001', '73c7ddac-b418-4a6f-8ccc-9c159116a706', 'a1b2c3d4-0001-4000-8000-000000000002', 'PUBLIC', '2026-01', 0.05, 45);

insert into market_clauses (contract_id, kind, payload, status) values
  ('a1b2c3d4-0002-4000-8000-000000000001', 'DELAI_PAIEMENT', jsonb_build_object('jours', 45, 'base', 'réception de facture'), 'VALIDE');

insert into price_lines (id, lot_id, code, label, unit, quantity_market, unit_price_ht, origin, status) values
  ('a1b2c3d4-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000002', 'DPGF-012', 'Terrassement général', 'm3', 1200, 38, 'SAISIE', 'VALIDE');

insert into situations (id, site_id, lot_id, number, amount_ht, status, retention_amount, net_amount_ht) values
  ('a1b2c3d4-0004-4000-8000-000000000001', '73c7ddac-b418-4a6f-8ccc-9c159116a706', 'a1b2c3d4-0001-4000-8000-000000000002', 1, 22800, 'A_ETABLIR', 1140, 21660);

insert into situation_lines (situation_id, price_line_id, quantity_previous, quantity_month, unit_price_ht, amount_ht) values
  ('a1b2c3d4-0004-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000001', 0, 600, 38, 22800);

insert into situation_allocations (situation_id, payee_organization_id, amount_ht) values
  ('a1b2c3d4-0004-4000-8000-000000000001', 'c0115ecd-2400-4a48-b18a-4db633451692', 22800);
