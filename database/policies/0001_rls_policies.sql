-- AdminBTP — Politiques RLS (Phase 1 → appliquées en Phase 2)
-- APPLIQUÉES au projet Supabase "AdminBTP" (ref: azphgxzapyuazxtqzvta) le 2026-10-21, juste après
-- database/migrations/0001_init_core_schema.sql. Durcies ensuite par les migrations
-- 0003_security_hardening.sql et 0004_performance_hardening.sql (search_path, policies SELECT
-- redondantes supprimées — voir ces fichiers pour le détail).
--
-- Modèle d'isolation multi-tenant :
--   - Chaque ligne métier porte organization_id (directement ou via un chantier/document parent).
--   - public.users.id = auth.uid() (Supabase Auth), garanti par la FK posée dans
--     0001_init_core_schema.sql (users.id references auth.users.id).
--   - ADMIN_PLATEFORME voit tout. Un collaborateur AdminBTP (ex: gestionnaire, chargé d'affaires)
--     voit les organisations pour lesquelles il détient un portfolio_grants ; les comptes "client"
--     (DIRIGEANT_CLIENT, COLLABORATEUR_CLIENT, ...) ne voient que leur propre organization_id.
--
-- AMENDÉ par database/migrations/0006_multitenant_saas_rls.sql (collaboration inter-entreprises
-- sur chantier partagé — fonction can_access_site()) et 0007_multitenant_saas_performance_cleanup.sql
-- (policies FOR ALL ci-dessous remplacées par des policies INSERT/UPDATE/DELETE séparées pour
-- sites, phase_instances, documents, mail_threads, tasks). Ce fichier reste le point de départ
-- historique ; l'état réellement appliqué est la somme de 0001 + 0006 + 0007. Voir
-- docs/CDC/MULTI_TENANT_SAAS.md.

create or replace function current_app_user_id()
returns uuid
language sql stable
as $$
  select auth.uid();
$$;

create or replace function current_user_permission_role()
returns user_permission_role
language sql stable
as $$
  select permission_role from users where id = current_app_user_id();
$$;

create or replace function current_user_organization_id()
returns uuid
language sql stable
as $$
  select organization_id from users where id = current_app_user_id();
$$;

create or replace function has_portfolio_access(target_org_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from portfolio_grants
    where user_id = current_app_user_id()
      and organization_id = target_org_id
  );
$$;

-- Vrai si l'utilisateur courant peut voir les données de l'organisation ciblée :
-- admin plateforme, membre de l'organisation elle-même, ou détenteur d'un portfolio_grants.
create or replace function can_access_organization(target_org_id uuid)
returns boolean
language sql stable
as $$
  select
    current_user_permission_role() = 'ADMIN_PLATEFORME'
    or current_user_organization_id() = target_org_id
    or has_portfolio_access(target_org_id);
$$;

-- ---------------------------------------------------------------------------
-- Activation RLS
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table users enable row level security;
alter table portfolio_grants enable row level security;
alter table sites enable row level security;
alter table site_access enable row level security;
alter table lots enable row level security;
alter table site_participants enable row level security;
alter table phase_templates enable row level security;
alter table phase_template_sets enable row level security;
alter table phase_instances enable row level security;
alter table document_templates enable row level security;
alter table documents enable row level security;
alter table validation_records enable row level security;
alter table audit_log enable row level security;
alter table mail_addresses enable row level security;
alter table mail_threads enable row level security;
alter table tasks enable row level security;
alter table situations enable row level security;
alter table reminder_rules enable row level security;
alter table expertise_requests enable row level security;

-- ---------------------------------------------------------------------------
-- organizations / users / portfolio_grants
-- ---------------------------------------------------------------------------

create policy organizations_select on organizations
  for select using (can_access_organization(id));

create policy users_select on users
  for select using (
    id = current_app_user_id()
    or current_user_permission_role() = 'ADMIN_PLATEFORME'
    or (organization_id is not null and can_access_organization(organization_id))
  );

create policy portfolio_grants_select on portfolio_grants
  for select using (
    user_id = current_app_user_id()
    or current_user_permission_role() = 'ADMIN_PLATEFORME'
  );

-- ---------------------------------------------------------------------------
-- Chantiers et dépendances directes (organization_id porté par sites)
-- ---------------------------------------------------------------------------

-- Pas de policy SELECT séparée : FOR ALL (ci-dessous) couvre déjà SELECT avec la même condition
-- (une policy SELECT dédiée identique serait redondante et évaluée en double à chaque requête —
-- voir 0004_performance_hardening.sql).
create policy sites_write on sites
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

create policy site_access_select on site_access
  for select using (
    exists (select 1 from sites s where s.id = site_access.site_id and can_access_organization(s.organization_id))
  );

create policy lots_select on lots
  for select using (
    exists (select 1 from sites s where s.id = lots.site_id and can_access_organization(s.organization_id))
  );

create policy site_participants_select on site_participants
  for select using (
    exists (select 1 from sites s where s.id = site_participants.site_id and can_access_organization(s.organization_id))
  );

-- ---------------------------------------------------------------------------
-- Moteur de phases — les templates/sets sont des référentiels partagés (lecture globale),
-- les instances héritent de l'organisation du chantier.
-- ---------------------------------------------------------------------------

create policy phase_templates_select on phase_templates for select using (true);
create policy phase_template_sets_select on phase_template_sets for select using (true);

-- Pas de policy SELECT séparée (redondante avec FOR ALL, voir note sur sites_write ci-dessus).
create policy phase_instances_write on phase_instances
  for all using (
    exists (select 1 from sites s where s.id = phase_instances.site_id and can_access_organization(s.organization_id))
  )
  with check (
    exists (select 1 from sites s where s.id = phase_instances.site_id and can_access_organization(s.organization_id))
  );

-- ---------------------------------------------------------------------------
-- Documents et validations
-- ---------------------------------------------------------------------------

create policy document_templates_select on document_templates
  for select using (can_access_organization(organization_id));

-- Pas de policy SELECT séparée (redondante avec FOR ALL, voir note sur sites_write ci-dessus).
create policy documents_write on documents
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

create policy validation_records_select on validation_records
  for select using (
    exists (select 1 from documents d where d.id = validation_records.document_id and can_access_organization(d.organization_id))
  );

-- Journal d'audit : lecture seule pour les membres de l'organisation, jamais d'update/delete
-- applicatif (append-only — seules les fonctions serveur avec la clé service y écrivent).
create policy audit_log_select on audit_log
  for select using (can_access_organization(organization_id));

-- ---------------------------------------------------------------------------
-- Mails / tâches / finance / expertise — toutes rattachées à organization_id
-- ---------------------------------------------------------------------------

create policy mail_addresses_select on mail_addresses
  for select using (can_access_organization(organization_id));

-- Pas de policy SELECT séparée (redondante avec FOR ALL, voir note sur sites_write ci-dessus).
create policy mail_threads_write on mail_threads
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

-- Pas de policy SELECT séparée (redondante avec FOR ALL, voir note sur sites_write ci-dessus).
create policy tasks_write on tasks
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

create policy situations_select on situations
  for select using (
    exists (select 1 from sites s where s.id = situations.site_id and can_access_organization(s.organization_id))
  );

create policy reminder_rules_select on reminder_rules
  for select using (
    exists (select 1 from sites s where s.id = reminder_rules.site_id and can_access_organization(s.organization_id))
  );

create policy expertise_requests_select on expertise_requests
  for select using (can_access_organization(organization_id));
