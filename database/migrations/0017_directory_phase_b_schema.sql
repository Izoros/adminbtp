-- Annuaire professionnel BTP — Phase B du module Marketplace. Catalogue partagé (pas de tenant),
-- accès gouverné par les entitlements déjà posés en Phase A (directory.btp/bet/suppliers).
--
-- Deux niveaux de protection des données, tous deux au niveau base (jamais seulement UI) :
-- 1. RLS : une organisation sans entitlement ACTIVE pour la catégorie ne voit AUCUNE ligne,
--    même via un appel API direct (has_any_accessible_entitlement()).
-- 2. Privilèges par colonne : même avec l'entitlement, un SELECT direct sur directory_companies
--    ne retourne que les colonnes de navigation (nom, catégorie, métier, ville) — les
--    coordonnées (téléphone, email, site, adresse, SIRET, notes) ne sont accessibles que via
--    get_directory_company_detail(), qui applique le quota et journalise. directory_contacts
--    n'est lisible par aucun SELECT direct, uniquement via get_directory_company_contacts().

create table directory_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  service_code text not null references service_catalog(code)
);

create table directory_sources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  imported_by_user_id uuid not null references users(id),
  imported_at timestamptz not null default now(),
  created_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0
);

create table directory_companies (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references directory_categories(id),
  name text not null,
  siret char(14),
  trade_code_id uuid references trade_codes(id),
  address text,
  postal_code text,
  city text,
  phone text,
  email text,
  website text,
  notes text,
  source_id uuid references directory_sources(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index directory_companies_category_id_idx on directory_companies(category_id);
create index directory_companies_trade_code_id_idx on directory_companies(trade_code_id);
create index directory_companies_source_id_idx on directory_companies(source_id);
create unique index directory_companies_siret_unique on directory_companies(siret) where siret is not null;

create trigger directory_companies_set_updated_at before update on directory_companies
  for each row execute function set_updated_at();

create table directory_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references directory_companies(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false
);

create index directory_contacts_company_id_idx on directory_contacts(company_id);

create table directory_access_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references directory_companies(id) on delete cascade,
  accessed_by_user_id uuid not null references users(id),
  accessed_at timestamptz not null default now()
);

create index directory_access_log_organization_id_idx on directory_access_log(organization_id);
create index directory_access_log_company_id_idx on directory_access_log(company_id);
create index directory_access_log_accessed_by_user_id_idx on directory_access_log(accessed_by_user_id);

-- Quota générique (voir packages/types/src/entitlements.ts) — réutilisable par tout service à
-- consommation mesurée, pas spécifique à l'annuaire.
alter table organization_entitlements add column access_quota integer check (access_quota > 0);

-- ---------------------------------------------------------------------------
-- Fonctions
-- ---------------------------------------------------------------------------

create or replace function has_any_accessible_entitlement(target_service_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    current_user_permission_role() = 'ADMIN_PLATEFORME'
    or exists (
      select 1
      from organization_entitlements oe
      join service_catalog sc on sc.id = oe.service_id
      where sc.code = target_service_code
        and oe.status = 'ACTIVE'
        and (oe.expires_at is null or oe.expires_at > now())
        and can_access_organization(oe.organization_id)
    );
$$;

-- Consultation d'une fiche : vérifie l'entitlement, applique le quota mensuel (fiches DISTINCTES
-- par organisation et mois civil — reconsulter une fiche déjà vue ce mois-ci ne recompte pas),
-- journalise, puis retourne les coordonnées. ADMIN_PLATEFORME n'est jamais soumis au quota.
create or replace function get_directory_company_detail(p_organization_id uuid, p_company_id uuid)
returns table (
  id uuid, siret text, address text, postal_code text, city text,
  phone text, email text, website text, notes text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := current_app_user_id();
  v_category_id uuid;
  v_service_code text;
  v_quota integer;
  v_already_viewed boolean;
  v_count_this_month integer;
  v_is_admin boolean := current_user_permission_role() = 'ADMIN_PLATEFORME';
begin
  if not v_is_admin then
    if not can_access_organization(p_organization_id) then
      raise exception 'Organisation non accessible' using errcode = '42501';
    end if;

    select dc.category_id into v_category_id from directory_companies dc where dc.id = p_company_id;
    if v_category_id is null then
      raise exception 'Fiche introuvable';
    end if;

    select cat.service_code into v_service_code from directory_categories cat where cat.id = v_category_id;

    if not has_entitlement(p_organization_id, v_service_code) then
      raise exception 'Accès non autorisé à cette catégorie d''annuaire' using errcode = '42501';
    end if;

    select oe.access_quota into v_quota
    from organization_entitlements oe
    join service_catalog sc on sc.id = oe.service_id
    where oe.organization_id = p_organization_id and sc.code = v_service_code and oe.status = 'ACTIVE';

    if v_quota is not null then
      select exists (
        select 1 from directory_access_log dal
        where dal.organization_id = p_organization_id
          and dal.company_id = p_company_id
          and dal.accessed_at >= date_trunc('month', now())
      ) into v_already_viewed;

      if not v_already_viewed then
        select count(distinct dal.company_id) into v_count_this_month
        from directory_access_log dal
        where dal.organization_id = p_organization_id
          and dal.accessed_at >= date_trunc('month', now());

        if v_count_this_month >= v_quota then
          raise exception 'Quota mensuel de consultations atteint pour cet annuaire' using errcode = '42501';
        end if;
      end if;
    end if;
  end if;

  insert into directory_access_log (organization_id, company_id, accessed_by_user_id)
  values (p_organization_id, p_company_id, v_actor);

  return query
    select dc.id, dc.siret::text, dc.address, dc.postal_code, dc.city, dc.phone, dc.email, dc.website, dc.notes
    from directory_companies dc where dc.id = p_company_id;
end;
$$;

-- Contacts d'une fiche : exige que la fiche ait déjà été "déverrouillée" ce mois-ci via
-- get_directory_company_detail() — ne consomme pas de quota supplémentaire.
create or replace function get_directory_company_contacts(p_organization_id uuid, p_company_id uuid)
returns table (id uuid, full_name text, role text, email text, phone text, is_primary boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unlocked boolean;
begin
  if current_user_permission_role() <> 'ADMIN_PLATEFORME' then
    if not can_access_organization(p_organization_id) then
      raise exception 'Organisation non accessible' using errcode = '42501';
    end if;
    select exists (
      select 1 from directory_access_log dal
      where dal.organization_id = p_organization_id and dal.company_id = p_company_id
        and dal.accessed_at >= date_trunc('month', now())
    ) into v_unlocked;
    if not v_unlocked then
      raise exception 'Consultez d''abord la fiche pour accéder aux contacts' using errcode = '42501';
    end if;
  end if;

  return query
    select c.id, c.full_name, c.role, c.email, c.phone, c.is_primary
    from directory_contacts c where c.company_id = p_company_id;
end;
$$;

-- Liste complète (toutes colonnes) réservée au Super Administrateur — pour l'interface d'import
-- et de revue de qualité des données, sans passer par les privilèges de colonnes restreints.
create or replace function list_directory_companies_admin(p_category_id uuid default null, p_search text default null)
returns setof directory_companies
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() <> 'ADMIN_PLATEFORME' then
    raise exception 'Réservé au Super Administrateur' using errcode = '42501';
  end if;
  return query
    select * from directory_companies dc
    where (p_category_id is null or dc.category_id = p_category_id)
      and (p_search is null or dc.name ilike '%' || p_search || '%' or dc.siret = p_search)
    order by dc.name
    limit 200;
end;
$$;

-- Déduplication à l'import : SIRET prioritaire, sinon nom + code postal. Réservé à
-- ADMIN_PLATEFORME (seul rôle qui importe) ; bypasse les privilèges de colonnes restreints.
create or replace function find_directory_duplicate(p_siret text, p_name text, p_postal_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if current_user_permission_role() <> 'ADMIN_PLATEFORME' then
    raise exception 'Réservé au Super Administrateur' using errcode = '42501';
  end if;
  if p_siret is not null and p_siret <> '' then
    select id into v_id from directory_companies where siret = p_siret limit 1;
  end if;
  if v_id is null then
    select id into v_id from directory_companies
    where lower(name) = lower(p_name) and coalesce(postal_code, '') = coalesce(p_postal_code, '')
    limit 1;
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table directory_categories enable row level security;
alter table directory_sources enable row level security;
alter table directory_companies enable row level security;
alter table directory_contacts enable row level security;
alter table directory_access_log enable row level security;

create policy directory_categories_select on directory_categories for select using (true);
create policy directory_categories_insert on directory_categories for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_categories_update on directory_categories for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_categories_delete on directory_categories for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy directory_sources_select on directory_sources for select using (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_sources_insert on directory_sources for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_sources_update on directory_sources for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy directory_companies_select on directory_companies for select using (
  exists (
    select 1 from directory_categories dc
    where dc.id = category_id and has_any_accessible_entitlement(dc.service_code)
  )
);
create policy directory_companies_insert on directory_companies for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_companies_update on directory_companies for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_companies_delete on directory_companies for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy directory_contacts_insert on directory_contacts for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_contacts_update on directory_contacts for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy directory_contacts_delete on directory_contacts for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');
-- Pas de policy SELECT : lecture exclusivement via get_directory_company_contacts().

create policy directory_access_log_select on directory_access_log for select using (can_access_organization(organization_id));
-- Pas de policy INSERT : uniquement via get_directory_company_detail() (SECURITY DEFINER).

-- ---------------------------------------------------------------------------
-- Privilèges par colonne — deuxième niveau de protection, indépendant de RLS
-- ---------------------------------------------------------------------------

revoke select on directory_companies from authenticated, anon;
grant select (id, category_id, name, trade_code_id, city, postal_code, source_id, created_at, updated_at)
  on directory_companies to authenticated;

revoke select on directory_contacts from authenticated, anon;
