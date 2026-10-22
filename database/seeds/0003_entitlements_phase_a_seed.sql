-- Données fictives de démonstration — catalogue Phase A (Marketplace & entitlements).

insert into service_categories (code, label, description, sort_order) values
  ('DIRECTORY', 'Annuaires', 'Annuaires professionnels du BTP (entreprises, BET, fournisseurs).', 0),
  ('DOCUMENTS', 'Documents', 'Bibliothèques de modèles de documents et génération assistée.', 1),
  ('AUTOMATION', 'Automatisations', 'Relances, courrier et autres automatisations opérationnelles.', 2),
  ('AI', 'Intelligence artificielle', 'Fonctionnalités assistées par IA.', 3),
  ('MESSAGING', 'Messagerie', 'Fonctionnalités de messagerie avancées.', 4),
  ('SITE_MANAGEMENT', 'Gestion de chantier', 'Fonctionnalités avancées de suivi de chantier.', 5),
  ('INTEGRATIONS', 'Intégrations', 'Connecteurs vers des outils tiers (comptabilité, etc.).', 6),
  ('SIGNATURES', 'Signatures', 'Signature électronique et preuve associée.', 7),
  ('EXPERT_SERVICES', 'Expertise humaine', 'Prestations d''expertise réalisées par des professionnels.', 8),
  ('CUSTOM_SERVICES', 'Prestations personnalisées', 'Prestations sur mesure, hors catalogue standard.', 9);

insert into service_catalog (category_id, code, name, description, billing_model, requires_admin_approval) values
  ((select id from service_categories where code = 'DIRECTORY'), 'directory.btp', 'Annuaire des entreprises BTP', 'Accès à l''annuaire des entreprises du BTP (Mayotte et France).', 'SUBSCRIPTION_MONTHLY', true),
  ((select id from service_categories where code = 'DIRECTORY'), 'directory.bet', 'Annuaire des bureaux d''études (BET)', 'Accès à l''annuaire des bureaux d''études techniques.', 'SUBSCRIPTION_MONTHLY', true),
  ((select id from service_categories where code = 'DIRECTORY'), 'directory.suppliers', 'Annuaire des fournisseurs', 'Accès à l''annuaire des fournisseurs et matériaux.', 'SUBSCRIPTION_MONTHLY', true),
  ((select id from service_categories where code = 'DOCUMENTS'), 'templates.basic', 'Modèles de documents — socle de base', 'Modèles génériques inclus, sans mission spécifique.', 'FREE', true),
  ((select id from service_categories where code = 'DOCUMENTS'), 'templates.moe', 'Bibliothèque de modèles — Maîtrise d''œuvre (MOE)', 'Modèles premium pour les missions de maîtrise d''œuvre.', 'SUBSCRIPTION_ANNUAL', true),
  ((select id from service_categories where code = 'DOCUMENTS'), 'templates.tce', 'Bibliothèque de modèles — Tous corps d''état (TCE)', 'Modèles premium pour les missions tous corps d''état.', 'SUBSCRIPTION_ANNUAL', true),
  ((select id from service_categories where code = 'DOCUMENTS'), 'templates.moa', 'Bibliothèque de modèles — Maîtrise d''ouvrage (MOA)', 'Modèles premium pour les missions de maîtrise d''ouvrage.', 'SUBSCRIPTION_ANNUAL', true),
  ((select id from service_categories where code = 'DOCUMENTS'), 'documents.ppsps', 'Génération assistée PPSPS', 'Génération assistée de PPSPS à l''unité.', 'PER_UNIT', true),
  ((select id from service_categories where code = 'DOCUMENTS'), 'documents.dc4', 'Génération assistée DC4', 'Génération assistée de DC4 à l''unité.', 'PER_UNIT', true),
  ((select id from service_categories where code = 'AUTOMATION'), 'automation.followups', 'Relances automatisées', 'Automatisation des relances de documents et validations.', 'SUBSCRIPTION_MONTHLY', true),
  ((select id from service_categories where code = 'AUTOMATION'), 'automation.mail', 'Automatisation du courrier', 'Automatisation du traitement du courrier entrant/sortant.', 'SUBSCRIPTION_MONTHLY', true),
  ((select id from service_categories where code = 'INTEGRATIONS'), 'integrations.odoo', 'Intégration comptable Odoo', 'Synchronisation avec une instance Odoo dédiée à l''organisation.', 'SUBSCRIPTION_MONTHLY', true),
  ((select id from service_categories where code = 'EXPERT_SERVICES'), 'expert.engineering', 'Expertise ingénierie à la demande', 'Mise en relation avec un ingénieur pour une prestation ponctuelle.', 'QUOTE', true),
  ((select id from service_categories where code = 'EXPERT_SERVICES'), 'expert.architecture', 'Expertise architecture à la demande', 'Mise en relation avec un architecte pour une prestation ponctuelle.', 'QUOTE', true);

insert into service_prices (service_id, amount_cents, currency, billing_period, created_by_user_id) values
  ((select id from service_catalog where code = 'directory.btp'), 4900, 'EUR', 'MONTHLY', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'directory.bet'), 2900, 'EUR', 'MONTHLY', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'directory.suppliers'), 2900, 'EUR', 'MONTHLY', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'templates.basic'), 0, 'EUR', 'ONE_TIME', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'templates.moe'), 19900, 'EUR', 'ANNUAL', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'templates.tce'), 19900, 'EUR', 'ANNUAL', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'templates.moa'), 19900, 'EUR', 'ANNUAL', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'documents.ppsps'), 1500, 'EUR', 'ONE_TIME', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'documents.dc4'), 500, 'EUR', 'ONE_TIME', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'automation.followups'), 1900, 'EUR', 'MONTHLY', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'automation.mail'), 2900, 'EUR', 'MONTHLY', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'integrations.odoo'), 9900, 'EUR', 'MONTHLY', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'expert.engineering'), 0, 'EUR', 'ONE_TIME', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8'),
  ((select id from service_catalog where code = 'expert.architecture'), 0, 'EUR', 'ONE_TIME', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8');

-- Scénario de démonstration : un entitlement déjà actif (SARL Madaterrassement / directory.btp)
-- et une demande en attente (Bâti Mayotte Construction / documents.ppsps) à traiter par un
-- Super Administrateur pour illustrer le parcours admin/client.
insert into organization_entitlements (organization_id, service_id, status, price_id, granted_by_user_id, notes)
values (
  'c0115ecd-2400-4a48-b18a-4db633451692',
  (select id from service_catalog where code = 'directory.btp'),
  'ACTIVE',
  (select id from service_prices where service_id = (select id from service_catalog where code = 'directory.btp')),
  'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8',
  'Octroi de démonstration (Phase A).'
);

insert into entitlement_grants (organization_id, service_id, action, performed_by_user_id, previous_status, new_status, note)
values (
  'c0115ecd-2400-4a48-b18a-4db633451692',
  (select id from service_catalog where code = 'directory.btp'),
  'GRANT',
  'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8',
  null,
  'ACTIVE',
  'Octroi de démonstration (Phase A).'
);

insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
values (
  'c0115ecd-2400-4a48-b18a-4db633451692',
  'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8',
  'USER',
  'entitlement.grant',
  'organization_entitlements',
  (select id::text from service_catalog where code = 'directory.btp'),
  jsonb_build_object('previous_status', null, 'new_status', 'ACTIVE', 'note', 'Octroi de démonstration (Phase A).')
);

insert into access_requests (organization_id, service_id, requested_by_user_id, status, message)
values (
  'fa304300-2a6e-4f37-a56a-4d574c8c9bbc',
  (select id from service_catalog where code = 'documents.ppsps'),
  'e44adca2-5ba9-4a1f-accf-e72ecf57120a',
  'PENDING',
  'Besoin de générer les PPSPS pour nos prochains chantiers.'
);
