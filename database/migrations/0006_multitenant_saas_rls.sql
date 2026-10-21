-- AdminBTP — RLS pour les exigences SaaS multi-tenant (Phase 2, suite)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21. Voir docs/CDC/MULTI_TENANT_SAAS.md.

-- handle_new_user doit maintenant renseigner role_scope (OBSERVATEUR -> ENTREPRISE).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, permission_role, role_scope)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'OBSERVATEUR',
    'ENTREPRISE'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Un grant révoqué (revoked_at renseigné) n'ouvre plus aucun accès, mais reste en base pour la
-- traçabilité (jamais supprimé) — voir docs/CDC/MULTI_TENANT_SAAS.md.
create or replace function has_portfolio_access(target_org_id uuid)
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1 from portfolio_grants
    where user_id = current_app_user_id()
      and organization_id = target_org_id
      and revoked_at is null
  );
$$;

-- Accès à un chantier : organisation propriétaire, OU organisation participante au chantier
-- (collaboration inter-entreprises sur chantier partagé, contrôle d'accès par ressource — pas
-- par organisation entière : participer à un chantier ne donne pas accès aux autres chantiers de
-- l'organisation propriétaire).
create or replace function can_access_site(target_site_id uuid)
returns boolean
language sql stable
set search_path = public
as $$
  select
    exists (
      select 1 from sites s
      where s.id = target_site_id and can_access_organization(s.organization_id)
    )
    or exists (
      select 1 from site_participants sp
      where sp.site_id = target_site_id and can_access_organization(sp.organization_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- Activation RLS sur les nouvelles tables
-- ---------------------------------------------------------------------------

alter table organization_domains enable row level security;
alter table plan_features enable row level security;
alter table organization_integrations enable row level security;
alter table signature_profiles enable row level security;

create policy organization_domains_all on organization_domains
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

-- Référentiel partagé en lecture (comme phase_templates) ; écriture réservée à la plateforme.
create policy plan_features_select on plan_features for select using (true);

create policy organization_integrations_all on organization_integrations
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

create policy signature_profiles_all on signature_profiles
  for all using (can_access_organization(organization_id))
  with check (can_access_organization(organization_id));

-- ---------------------------------------------------------------------------
-- portfolio_grants : création et révocation
-- ---------------------------------------------------------------------------

create policy portfolio_grants_insert on portfolio_grants
  for insert with check (
    current_user_permission_role() in ('ADMIN_PLATEFORME', 'RESPONSABLE_PORTEFEUILLE')
  );

create policy portfolio_grants_revoke on portfolio_grants
  for update using (
    current_user_permission_role() = 'ADMIN_PLATEFORME'
    or granted_by = current_app_user_id()
  )
  with check (
    current_user_permission_role() = 'ADMIN_PLATEFORME'
    or granted_by = current_app_user_id()
  );

-- ---------------------------------------------------------------------------
-- Collaboration inter-entreprises sur chantier partagé : élargissement de la lecture
-- (les policies d'écriture restent scopées à l'organisation propriétaire du chantier — voir
-- 0007_multitenant_saas_performance_cleanup.sql)
-- ---------------------------------------------------------------------------

create policy sites_select_shared on sites
  for select using (can_access_site(id));

create policy phase_instances_select_shared on phase_instances
  for select using (can_access_site(site_id));

create policy documents_select_shared on documents
  for select using (
    can_access_organization(organization_id)
    or (site_id is not null and can_access_site(site_id))
  );

create policy mail_threads_select_shared on mail_threads
  for select using (
    can_access_organization(organization_id)
    or (site_id is not null and can_access_site(site_id))
  );

create policy tasks_select_shared on tasks
  for select using (
    can_access_organization(organization_id)
    or (site_id is not null and can_access_site(site_id))
  );

-- situations, reminder_rules, site_participants, lots, site_access : les policies existantes
-- rejoignaient déjà sites pour vérifier can_access_organization(s.organization_id) ; on les
-- élargit à can_access_site pour inclure les organisations participantes.
drop policy if exists situations_select on situations;
create policy situations_select on situations
  for select using (can_access_site(site_id));

drop policy if exists reminder_rules_select on reminder_rules;
create policy reminder_rules_select on reminder_rules
  for select using (can_access_site(site_id));

drop policy if exists site_participants_select on site_participants;
create policy site_participants_select on site_participants
  for select using (can_access_site(site_id));

drop policy if exists lots_select on lots;
create policy lots_select on lots
  for select using (can_access_site(site_id));

drop policy if exists site_access_select on site_access;
create policy site_access_select on site_access
  for select using (can_access_site(site_id));
