-- AdminBTP — Jeu de données de démonstration (Phase 2, persistance réelle)
-- APPLIQUÉ au projet Supabase "AdminBTP" le 2026-10-21, via execute_sql (données, pas un
-- changement de schéma). Traduit fidèlement les fixtures historiques de
-- apps/web/src/lib/mock-data/* en lignes réelles, pour que les écrans convertis à de vraies
-- requêtes Supabase affichent un contenu équivalent à la démo Phase 1.
--
-- Remplacer le mot de passe de Julien avant réexécution dans un autre environnement — ne jamais
-- commiter de vrai mot de passe en clair (voir apps/web/.env.local, jamais committé, pour la
-- valeur réellement utilisée).

do $$
declare
  v_amina uuid := (select id from auth.users where email = 'demo.seed@adminbtp.test');
  v_julien uuid := gen_random_uuid();
  v_julien_password text := 'CHANGE_ME_BEFORE_RUNNING';

  v_org1 uuid; -- SARL Madaterrassement
  v_org2 uuid; -- Bâti Mayotte Construction
  v_org3 uuid; -- Cabinet AMO Lagon

  v_site1 uuid; v_site2 uuid; v_site3 uuid; v_site4 uuid; v_site5 uuid;
  v_lot1 uuid; v_lot2 uuid; v_lot3 uuid; v_lot4 uuid;

  v_pi1 uuid; v_pi2 uuid; v_pi3 uuid; v_pi4 uuid; v_pi5 uuid;

  v_tpl_ppsps uuid; v_tpl_courrier uuid; v_tpl_situation uuid; v_tpl_doe uuid;

  v_doc1 uuid; v_doc2 uuid; v_doc3 uuid; v_doc4 uuid; v_doc5 uuid; v_doc6 uuid;

  v_ma1 uuid; v_ma2 uuid; v_ma3 uuid;
  v_mail1 uuid; v_mail2 uuid; v_mail3 uuid; v_mail4 uuid; v_mail5 uuid;
begin
  -- -------------------------------------------------------------------------
  -- Utilisateur plateforme supplémentaire (Julien Perrot), même piège GoTrue que
  -- database/seeds/0001_demo_admin_user.sql : les colonnes "token" doivent être '' et non NULL.
  -- -------------------------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_julien, 'authenticated', 'authenticated',
    'julien.perrot.demo@adminbtp.test', crypt(v_julien_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Julien Perrot"}'::jsonb,
    '', '', '', '', '', '', '', '',
    now(), now()
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, created_at, updated_at
  ) values (
    gen_random_uuid(), v_julien::text, v_julien,
    jsonb_build_object('sub', v_julien::text, 'email', 'julien.perrot.demo@adminbtp.test'),
    'email', now(), now()
  );

  -- Le trigger on_auth_user_created crée public.users en OBSERVATEUR/ENTREPRISE ; on l'aligne
  -- sur le profil "chargé d'affaires" plateforme des fixtures historiques.
  update public.users
    set full_name = 'Julien Perrot', permission_role = 'CHARGE_AFFAIRES', role_scope = 'PLATEFORME'
    where id = v_julien;

  -- -------------------------------------------------------------------------
  -- Organisations
  -- -------------------------------------------------------------------------
  insert into organizations (name, legal_name, siret, city, postal_code, country, domain, domain_verified, subscription_plan, created_at, updated_at)
  values ('SARL Madaterrassement', 'Madaterrassement SARL', '88123456700012', 'Mamoudzou', '97600', 'FR', 'madaterrassement.yt', false, 'PRO', '2025-02-10T08:00:00Z', '2026-09-01T08:00:00Z')
  returning id into v_org1;

  insert into organizations (name, legal_name, siret, city, postal_code, country, subscription_plan, created_at, updated_at)
  values ('Bâti Mayotte Construction', 'Bâti Mayotte Construction SAS', '90234567800015', 'Koungou', '97600', 'FR', 'STARTER', '2025-06-20T08:00:00Z', '2026-08-15T08:00:00Z')
  returning id into v_org2;

  insert into organizations (name, legal_name, city, postal_code, country, subscription_plan, created_at, updated_at)
  values ('Cabinet AMO Lagon', 'Cabinet AMO Lagon', 'Dzaoudzi', '97615', 'FR', 'PRO', '2025-09-05T08:00:00Z', '2026-10-01T08:00:00Z')
  returning id into v_org3;

  -- Portefeuille des gestionnaires (fixtures historiques /portefeuille)
  insert into portfolio_grants (user_id, organization_id, granted_by, granted_at) values
    (v_amina, v_org1, v_amina, '2026-01-01T08:00:00Z'),
    (v_amina, v_org2, v_amina, '2026-01-01T08:00:00Z'),
    (v_amina, v_org3, v_amina, '2026-01-01T08:00:00Z'),
    (v_julien, v_org1, v_amina, '2026-01-01T08:00:00Z'),
    (v_julien, v_org2, v_amina, '2026-01-01T08:00:00Z');

  -- -------------------------------------------------------------------------
  -- Chantiers
  -- -------------------------------------------------------------------------
  insert into sites (organization_id, name, reference, address, city, postal_code, status, budget_ht, start_date, end_date_estimated, manager_user_id, created_at, updated_at)
  values (v_org1, 'Réhabilitation collège de Kawéni', '2026-MDA-012', 'Route de Kawéni', 'Mamoudzou', '97600', 'EN_COURS', 1850000, '2026-02-01', '2027-05-31', v_amina, '2026-01-10T08:00:00Z', '2026-10-18T08:00:00Z')
  returning id into v_site1;

  insert into sites (organization_id, name, reference, address, city, postal_code, status, budget_ht, start_date, end_date_estimated, manager_user_id, created_at, updated_at)
  values (v_org1, 'Construction 24 logements sociaux — Tsoundzou', '2026-MDA-018', 'Lotissement Tsoundzou 2', 'Mamoudzou', '97600', 'PREPARATION', 3200000, '2026-11-15', '2028-02-28', v_julien, '2026-05-02T08:00:00Z', '2026-10-15T08:00:00Z')
  returning id into v_site2;

  insert into sites (organization_id, name, reference, address, city, postal_code, status, budget_ht, start_date, end_date_estimated, manager_user_id, created_at, updated_at)
  values (v_org2, 'Extension mairie de Koungou', '2025-BMC-004', 'Place de la mairie', 'Koungou', '97600', 'RECEPTION', 980000, '2025-03-01', '2026-09-30', v_amina, '2025-02-01T08:00:00Z', '2026-10-10T08:00:00Z')
  returning id into v_site3;

  insert into sites (organization_id, name, reference, address, city, postal_code, status, budget_ht, start_date, end_date_estimated, manager_user_id, created_at, updated_at)
  values (v_org2, 'Réseau VRD lotissement Longoni', '2024-BMC-021', 'Zone de Longoni', 'Koungou', '97600', 'GPA', 540000, '2024-09-01', '2025-12-01', v_julien, '2024-08-01T08:00:00Z', '2026-09-20T08:00:00Z')
  returning id into v_site4;

  insert into sites (organization_id, name, reference, address, city, postal_code, status, budget_ht, start_date, end_date_estimated, manager_user_id, created_at, updated_at)
  values (v_org3, 'Étude programmation centre nautique', '2026-AMO-002', 'Baie de Dzaoudzi', 'Dzaoudzi', '97615', 'ETUDE', 120000, '2026-06-01', '2026-12-31', v_amina, '2026-05-20T08:00:00Z', '2026-10-05T08:00:00Z')
  returning id into v_site5;

  -- Intervenants (site_participants)
  insert into site_participants (site_id, organization_id, mission_role, contract_amount_ht, joined_at) values
    (v_site1, v_org1, 'ENTREPRISE_GENERALE', 1850000, '2026-01-10T08:00:00Z'),
    (v_site1, v_org3, 'AMO', null, '2026-01-05T08:00:00Z'),
    (v_site2, v_org1, 'ENTREPRISE_GENERALE', 3200000, '2026-05-02T08:00:00Z'),
    (v_site3, v_org2, 'ENTREPRISE_TCE', 980000, '2025-02-01T08:00:00Z'),
    (v_site4, v_org2, 'ENTREPRISE_GENERALE', 540000, '2024-08-01T08:00:00Z'),
    (v_site5, v_org3, 'AMO', null, '2026-05-20T08:00:00Z');

  -- Lots
  insert into lots (site_id, number, name, assigned_organization_id, amount_ht)
  values (v_site1, 'Lot 01', 'Gros œuvre', v_org1, 920000) returning id into v_lot1;
  insert into lots (site_id, number, name, amount_ht)
  values (v_site1, 'Lot 02', 'Électricité CFO/CFA', 310000) returning id into v_lot2;
  insert into lots (site_id, number, name, amount_ht)
  values (v_site1, 'Lot 03', 'Plomberie - VMC', 180000) returning id into v_lot3;
  insert into lots (site_id, number, name, assigned_organization_id, amount_ht)
  values (v_site2, 'Lot 01', 'Terrassement - VRD', v_org1, 450000) returning id into v_lot4;

  -- -------------------------------------------------------------------------
  -- Moteur de phases (référentiel partagé + instances sur site-1 et site-3)
  -- -------------------------------------------------------------------------
  insert into phase_templates (code, label) values
    ('CONSULTATION', 'Consultation'),
    ('ATTRIBUTION', 'Attribution'),
    ('PREPARATION', 'Préparation de chantier'),
    ('EXE', 'Études d''exécution'),
    ('TRAVAUX', 'Travaux'),
    ('RECEPTION', 'Réception'),
    ('DOE', 'DOE'),
    ('DGD', 'Décompte général définitif'),
    ('GPA', 'Garantie de parfait achèvement')
  on conflict (code) do nothing;

  insert into phase_instances (site_id, phase_template_id, status, start_date, end_date_target, end_date_actual, responsible_user_id, checklist, expected_document_types, depends_on_phase_instance_ids)
  values (
    v_site1, (select id from phase_templates where code = 'PREPARATION'), 'VALIDEE',
    '2026-02-01', '2026-02-28', '2026-02-25', v_amina,
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'label', 'PPSPS préédité et relu par le coordinateur SPS', 'done', true),
      jsonb_build_object('id', gen_random_uuid(), 'label', 'Installation de chantier validée', 'done', true),
      jsonb_build_object('id', gen_random_uuid(), 'label', 'Déclaration d''ouverture de chantier', 'done', true)
    ),
    array['PPSPS'], '{}'
  ) returning id into v_pi1;

  insert into phase_instances (site_id, phase_template_id, status, start_date, end_date_target, end_date_actual, responsible_user_id, checklist, expected_document_types, depends_on_phase_instance_ids)
  values (
    v_site1, (select id from phase_templates where code = 'EXE'), 'VALIDEE',
    '2026-02-15', '2026-03-31', '2026-03-28', v_julien,
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'label', 'Plans d''exécution lot gros œuvre', 'done', true),
      jsonb_build_object('id', gen_random_uuid(), 'label', 'Visa BET structure', 'done', true)
    ),
    '{}', array[v_pi1]
  ) returning id into v_pi2;

  insert into phase_instances (site_id, phase_template_id, status, start_date, end_date_target, responsible_user_id, checklist, expected_document_types, depends_on_phase_instance_ids)
  values (
    v_site1, (select id from phase_templates where code = 'TRAVAUX'), 'EN_COURS',
    '2026-03-01', '2027-03-31', v_amina,
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'label', 'Suivi hebdomadaire des réserves', 'done', false),
      jsonb_build_object('id', gen_random_uuid(), 'label', 'Situations mensuelles à jour', 'done', true, 'dueDate', '2026-10-31')
    ),
    array['SITUATION_TRAVAUX', 'COMPTE_RENDU'], array[v_pi2]
  ) returning id into v_pi3;

  insert into phase_instances (site_id, phase_template_id, status, start_date, end_date_target, checklist, expected_document_types, depends_on_phase_instance_ids)
  values (
    v_site1, (select id from phase_templates where code = 'RECEPTION'), 'A_VENIR',
    '2027-04-01', '2027-04-30', '[]', array['RESERVES'], array[v_pi3]
  ) returning id into v_pi4;

  insert into phase_instances (site_id, phase_template_id, status, start_date, end_date_target, responsible_user_id, checklist, expected_document_types, depends_on_phase_instance_ids)
  values (
    v_site3, (select id from phase_templates where code = 'RECEPTION'), 'EN_ATTENTE_VALIDATION',
    '2026-09-15', '2026-10-15', v_amina,
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'label', 'Levée des réserves', 'done', false, 'dueDate', '2026-10-28')),
    array['RESERVES'], '{}'
  ) returning id into v_pi5;

  -- -------------------------------------------------------------------------
  -- Modèles de documents (org-1, correspond à l'écran Paramètres > Modèles de documents)
  -- -------------------------------------------------------------------------
  insert into document_templates (organization_id, category, name, file_url, requires_expert_review, variables)
  values (v_org1, 'PPSPS', 'PPSPS type', 'demo://templates/ppsps-type.docx', true,
    array['chantier.nom', 'entreprise.nom', 'date.debut']) returning id into v_tpl_ppsps;
  insert into document_templates (organization_id, category, name, file_url, variables)
  values (v_org1, 'COURRIER', 'Courrier de notification de démarrage', 'demo://templates/courrier-demarrage.docx',
    array['chantier.nom', 'destinataire.nom']) returning id into v_tpl_courrier;
  insert into document_templates (organization_id, category, name, file_url)
  values (v_org1, 'SITUATION_TRAVAUX', 'Situation de travaux', 'demo://templates/situation-travaux.docx') returning id into v_tpl_situation;
  insert into document_templates (organization_id, category, name, file_url)
  values (v_org1, 'DOE', 'DOE — Dossier des ouvrages exécutés', 'demo://templates/doe.docx') returning id into v_tpl_doe;

  -- Chaque organisation a ses propres modèles (voir docs/CDC/MULTI_TENANT_SAAS.md) — on en sème
  -- aussi pour org2/org3 pour que l'écran Paramètres ne soit pas vide selon l'organisation active.
  insert into document_templates (organization_id, category, name, file_url, requires_expert_review) values
    (v_org2, 'PPSPS', 'PPSPS type', 'demo://templates/ppsps-type.docx', true),
    (v_org2, 'COURRIER', 'Courrier de notification de démarrage', 'demo://templates/courrier-demarrage.docx', false),
    (v_org3, 'PPSPS', 'PPSPS type', 'demo://templates/ppsps-type.docx', true),
    (v_org3, 'COURRIER', 'Courrier de notification de démarrage', 'demo://templates/courrier-demarrage.docx', false);

  -- -------------------------------------------------------------------------
  -- Documents
  -- -------------------------------------------------------------------------
  insert into documents (organization_id, site_id, category, title, status, file_url, version, template_id, created_by_user_id, created_at, updated_at)
  values (v_org1, v_site1, 'PPSPS', 'PPSPS — Réhabilitation collège de Kawéni', 'PREEDITION', 'demo://documents/doc-1.pdf', 2, v_tpl_ppsps, v_amina, '2026-01-20T08:00:00Z', '2026-01-28T08:00:00Z')
  returning id into v_doc1;

  insert into documents (organization_id, site_id, category, title, status, file_url, version, created_by_user_id, created_at, updated_at)
  values (v_org1, v_site1, 'SITUATION_TRAVAUX', 'Situation n°8 — Lot gros œuvre', 'EN_VALIDATION', 'demo://documents/doc-2.pdf', 1, v_julien, '2026-10-05T08:00:00Z', '2026-10-18T08:00:00Z')
  returning id into v_doc2;

  insert into documents (organization_id, site_id, category, title, status, file_url, version, created_by_user_id, created_at, updated_at)
  values (v_org2, v_site3, 'RESERVES', 'Tableau de réserves — Réception extension mairie', 'EN_CONTROLE', 'demo://documents/doc-3.pdf', 1, v_amina, '2026-10-12T08:00:00Z', '2026-10-19T08:00:00Z')
  returning id into v_doc3;

  insert into documents (organization_id, site_id, category, title, status, file_url, version, created_by_user_id, created_at, updated_at)
  values (v_org2, v_site4, 'DOE', 'DOE — Réseau VRD Longoni', 'ARCHIVE', 'demo://documents/doc-4.pdf', 1, v_julien, '2025-11-30T08:00:00Z', '2025-12-10T08:00:00Z')
  returning id into v_doc4;

  insert into documents (organization_id, site_id, category, title, status, file_url, version, created_by_user_id, created_at, updated_at)
  values (v_org1, v_site2, 'DC4', 'DC4 — Sous-traitant VRD', 'BROUILLON', 'demo://documents/doc-5.pdf', 1, v_amina, '2026-10-15T08:00:00Z', '2026-10-15T08:00:00Z')
  returning id into v_doc5;

  insert into documents (organization_id, site_id, category, title, status, file_url, version, created_by_user_id, created_at, updated_at)
  values (v_org1, v_site1, 'COURRIER', 'Courrier de relance — DOE attendu BET structure', 'ENVOYE', 'demo://documents/doc-6.pdf', 1, v_amina, '2026-09-25T08:00:00Z', '2026-09-26T08:00:00Z')
  returning id into v_doc6;

  -- -------------------------------------------------------------------------
  -- Mails
  -- -------------------------------------------------------------------------
  insert into mail_addresses (organization_id, address, label, is_active)
  values (v_org1, 'madaterrassement@adminbtp.yt', 'Boîte générale', true) returning id into v_ma1;
  insert into mail_addresses (organization_id, address, label, site_id, is_active)
  values (v_org1, 'kaweni-college@adminbtp.yt', 'Chantier collège Kawéni', v_site1, true) returning id into v_ma2;
  insert into mail_addresses (organization_id, address, label, is_active)
  values (v_org2, 'bati-mayotte@adminbtp.yt', 'Boîte générale', true) returning id into v_ma3;

  insert into mail_threads (organization_id, mail_address_id, site_id, subject, from_address, status, urgency, assigned_user_id, last_message_at, created_at)
  values (v_org1, v_ma2, v_site1, 'Demande de DOE lot électricité', 'contact@electro-mayotte.yt', 'AFFECTE', 'NORMALE', v_julien, '2026-10-19T09:12:00Z', '2026-10-19T09:12:00Z')
  returning id into v_mail1;

  insert into mail_threads (organization_id, mail_address_id, site_id, subject, from_address, status, urgency, last_message_at, created_at)
  values (v_org1, v_ma1, v_site2, 'URGENT — Fuite réseau sur zone de travaux Tsoundzou', 'securite@bati-mayotte.yt', 'NON_TRAITE', 'CRITIQUE', '2026-10-20T16:45:00Z', '2026-10-20T16:45:00Z')
  returning id into v_mail2;

  insert into mail_threads (organization_id, mail_address_id, site_id, subject, from_address, status, urgency, assigned_user_id, last_message_at, created_at)
  values (v_org1, v_ma2, v_site1, 'Relance situation n°8 non réglée', 'compta@madaterrassement.yt', 'BROUILLON_PRET', 'URGENTE', v_amina, '2026-10-18T11:00:00Z', '2026-10-15T08:30:00Z')
  returning id into v_mail3;

  insert into mail_threads (organization_id, mail_address_id, site_id, subject, from_address, status, urgency, assigned_user_id, last_message_at, created_at)
  values (v_org2, v_ma3, v_site3, 'Validation du tableau de réserves', 'moe@cabinet-lagon.yt', 'EN_VALIDATION', 'NORMALE', v_amina, '2026-10-17T14:20:00Z', '2026-10-16T09:00:00Z')
  returning id into v_mail4;

  insert into mail_threads (organization_id, mail_address_id, site_id, subject, from_address, status, urgency, last_message_at, created_at)
  values (v_org2, v_ma3, v_site4, 'Confirmation levée de réserves GPA', 'mairie-koungou@koungou.yt', 'CLOTURE', 'NORMALE', '2026-09-30T10:00:00Z', '2026-09-25T10:00:00Z')
  returning id into v_mail5;

  -- -------------------------------------------------------------------------
  -- Tâches
  -- -------------------------------------------------------------------------
  insert into tasks (organization_id, site_id, title, status, priority, assigned_user_id, due_date, source_type, source_id, created_at)
  values (v_org1, v_site1, 'Relancer le BET structure pour le DOE', 'EN_COURS', 'HAUTE', v_julien, '2026-10-24', 'MAIL', v_mail1, '2026-10-19T09:30:00Z');

  insert into tasks (organization_id, site_id, title, status, priority, assigned_user_id, due_date, source_type, source_id, created_at)
  values (v_org1, v_site2, 'Traiter l''alerte sécurité — fuite réseau', 'A_FAIRE', 'CRITIQUE', v_amina, '2026-10-21', 'MAIL', v_mail2, '2026-10-20T16:50:00Z');

  insert into tasks (organization_id, site_id, title, status, priority, assigned_user_id, due_date, source_type, source_id, created_at)
  values (v_org1, v_site1, 'Valider la préédition PPSPS avec le coordinateur SPS', 'EN_ATTENTE', 'NORMALE', v_amina, '2026-10-30', 'PHASE', v_pi1, '2026-01-22T08:00:00Z');

  insert into tasks (organization_id, site_id, title, status, priority, assigned_user_id, due_date, source_type, source_id, created_at)
  values (v_org2, v_site3, 'Compléter le tableau de réserves avant validation MOE', 'FAIT', 'NORMALE', v_amina, '2026-10-16', 'VALIDATION', v_doc3, '2026-10-12T08:10:00Z');

  insert into tasks (organization_id, site_id, title, status, priority, assigned_user_id, due_date, source_type, created_at)
  values (v_org1, v_site2, 'Préparer le DC4 pour le sous-traitant VRD', 'A_FAIRE', 'NORMALE', v_amina, '2026-10-28', 'MANUEL', '2026-10-15T09:00:00Z');

  -- -------------------------------------------------------------------------
  -- Finance (situations)
  -- -------------------------------------------------------------------------
  insert into situations (site_id, lot_id, number, amount_ht, status, submitted_at, due_date, paid_at)
  values (v_site1, v_lot1, 8, 92000, 'EN_VERIFICATION', '2026-10-05', '2026-10-25', null);

  insert into situations (site_id, lot_id, number, amount_ht, status, submitted_at, due_date, paid_at)
  values (v_site1, v_lot2, 6, 41000, 'ACCEPTE', '2026-09-28', '2026-10-18', '2026-10-17');

  insert into situations (site_id, number, amount_ht, status, submitted_at, due_date, dispute_reason)
  values (v_site3, 12, 65000, 'CONTESTE', '2026-09-20', '2026-10-10', 'Écart sur quantités VRD à justifier');

  insert into situations (site_id, number, amount_ht, status, due_date)
  values (v_site4, 1, 18000, 'A_ETABLIR', '2026-11-05');

  -- -------------------------------------------------------------------------
  -- Validations
  -- -------------------------------------------------------------------------
  insert into validation_records (document_id, step, is_legally_binding_signature)
  values (v_doc2, 'VALIDATION_DIRIGEANT', false);

  insert into validation_records (document_id, step, is_legally_binding_signature)
  values (v_doc3, 'CONTROLE_GESTIONNAIRE', false);

  insert into validation_records (document_id, step, decision, decided_by_user_id, decided_at, comment, is_legally_binding_signature)
  values (v_doc1, 'CONTROLE_GESTIONNAIRE', 'MODIFICATION_DEMANDEE', v_amina, '2026-01-28T10:00:00Z', 'Mise à jour du plan d''installation de chantier nécessaire avant validation.', false);

  insert into validation_records (document_id, step, decision, decided_by_user_id, decided_at, whatsapp_proof_url, is_legally_binding_signature)
  values (v_doc6, 'ENVOI', 'APPROUVE', v_amina, '2026-09-26T08:00:00Z', 'demo://whatsapp/proof-doc-6.png', false);
end $$;
