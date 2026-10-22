-- Données fictives de démonstration — catégories d'annuaire, source d'import, fiches et contacts.

insert into directory_categories (code, label, service_code) values
  ('ENTREPRISE_BTP', 'Entreprises BTP', 'directory.btp'),
  ('BET', 'Bureaux d''études techniques', 'directory.bet'),
  ('FOURNISSEUR', 'Fournisseurs', 'directory.suppliers');

insert into directory_sources (id, label, imported_by_user_id, created_count) values
  ('b1c2d3e4-0001-4000-8000-000000000001', 'Import de démonstration (Phase B)', 'aa6f3ee5-3d6a-4e5c-8823-e39030844dd8', 6);

insert into directory_companies (id, category_id, name, siret, trade_code_id, address, postal_code, city, phone, email, website, source_id) values
  ('b1c2d3e4-0002-4000-8000-000000000001', (select id from directory_categories where code = 'ENTREPRISE_BTP'), 'Terrassements de l''Océan Indien', '85234567800014', (select id from trade_codes where code = 'GO'), '12 route de Longoni', '97650', 'Koungou', '0269601234', 'contact@toi-mayotte.fr', 'https://toi-mayotte.fr', 'b1c2d3e4-0001-4000-8000-000000000001'),
  ('b1c2d3e4-0002-4000-8000-000000000002', (select id from directory_categories where code = 'ENTREPRISE_BTP'), 'Électricité Générale Mahoraise', '79345678900023', (select id from trade_codes where code = 'ELEC'), '5 rue des Bougainvilliers', '97600', 'Mamoudzou', '0269602345', 'egm@egm-mayotte.yt', null, 'b1c2d3e4-0001-4000-8000-000000000001'),
  ('b1c2d3e4-0002-4000-8000-000000000003', (select id from directory_categories where code = 'BET'), 'BET Structure Lagon', '81456789000032', (select id from trade_codes where code = 'GO'), '3 avenue du Lagon', '97600', 'Mamoudzou', '0269603456', 'contact@bet-lagon.yt', 'https://bet-lagon.yt', 'b1c2d3e4-0001-4000-8000-000000000001'),
  ('b1c2d3e4-0002-4000-8000-000000000004', (select id from directory_categories where code = 'BET'), 'Fluides Ingénierie Mayotte', '82567890100041', (select id from trade_codes where code = 'CVC'), '8 impasse des Manguiers', '97615', 'Pamandzi', '0269604567', 'contact@fim-ingenierie.yt', null, 'b1c2d3e4-0001-4000-8000-000000000001'),
  ('b1c2d3e4-0002-4000-8000-000000000005', (select id from directory_categories where code = 'FOURNISSEUR'), 'Matériaux du Nord Mayotte', '83678901200050', null, 'Zone industrielle de Kawéni', '97600', 'Mamoudzou', '0269605678', 'commercial@mnm.yt', 'https://materiaux-nord.yt', 'b1c2d3e4-0001-4000-8000-000000000001'),
  ('b1c2d3e4-0002-4000-8000-000000000006', (select id from directory_categories where code = 'FOURNISSEUR'), 'Quincaillerie du Lagon', '84789012300069', null, '2 rue du Commerce', '97610', 'Dzaoudzi', '0269606789', 'contact@quincaillerie-lagon.yt', null, 'b1c2d3e4-0001-4000-8000-000000000001');

insert into directory_contacts (company_id, full_name, role, email, phone, is_primary) values
  ('b1c2d3e4-0002-4000-8000-000000000001', 'Ahmed Bacar', 'Gérant', 'a.bacar@toi-mayotte.fr', '0639601234', true),
  ('b1c2d3e4-0002-4000-8000-000000000002', 'Fatima Said', 'Chargée d''affaires', 'f.said@egm-mayotte.yt', '0639602345', true),
  ('b1c2d3e4-0002-4000-8000-000000000003', 'Nicolas Perrin', 'Ingénieur structure', 'n.perrin@bet-lagon.yt', '0639603456', true),
  ('b1c2d3e4-0002-4000-8000-000000000004', 'Laure Chanfi', 'Directrice technique', 'l.chanfi@fim-ingenierie.yt', '0639604567', true),
  ('b1c2d3e4-0002-4000-8000-000000000005', 'Youssouf Mari', 'Responsable commercial', 'y.mari@mnm.yt', '0639605678', true),
  ('b1c2d3e4-0002-4000-8000-000000000006', 'Chamsia Abdou', 'Gérante', 'c.abdou@quincaillerie-lagon.yt', '0639606789', true);

-- Démonstration du quota : l'entitlement directory.btp de SARL Madaterrassement (déjà ACTIVE
-- depuis la Phase A) reçoit un quota de 1 fiche consultée par mois civil.
update organization_entitlements
set access_quota = 1
where organization_id = 'c0115ecd-2400-4a48-b18a-4db633451692'
  and service_id = (select id from service_catalog where code = 'directory.btp');
