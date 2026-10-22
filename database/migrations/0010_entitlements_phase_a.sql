-- AdminBTP — Marketplace & entitlements, Phase A : catalogue et moteur d'autorisation
-- Voir docs/MONETIZATION_AND_ENTITLEMENTS.md pour les règles produit complètes.
--
-- Règle non négociable : seul un utilisateur ADMIN_PLATEFORME ("Super Administrateur" — rôle
-- déjà existant, aucun rôle redondant créé) peut accorder, suspendre, prolonger ou révoquer un
-- entitlement. Toute mutation de organization_entitlements/entitlement_grants passe exclusivement
-- par les fonctions SECURITY DEFINER ci-dessous (pas de policy INSERT/UPDATE/DELETE sur ces
-- tables, même pour ADMIN_PLATEFORME) — garantit l'atomicité entitlement+historique+audit et
-- empêche tout court-circuit via un appel API direct.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type service_category_code as enum (
  'DIRECTORY', 'DOCUMENTS', 'AUTOMATION', 'AI', 'MESSAGING', 'SITE_MANAGEMENT',
  'INTEGRATIONS', 'SIGNATURES', 'EXPERT_SERVICES', 'CUSTOM_SERVICES'
);

create type service_billing_model as enum (
  'FREE', 'SUBSCRIPTION_MONTHLY', 'SUBSCRIPTION_ANNUAL', 'PER_UNIT', 'PREPAID_CREDIT',
  'CREDIT_PACK', 'SERVICE_PACKAGE', 'CUSTOM', 'QUOTE'
);

create type billing_period as enum ('MONTHLY', 'ANNUAL', 'ONE_TIME');

create type access_request_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

create type entitlement_status as enum ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED');

create type entitlement_action as enum ('GRANT', 'SUSPEND', 'REACTIVATE', 'EXTEND', 'REVOKE');

-- ---------------------------------------------------------------------------
-- Catalogue (référentiel partagé, pas de tenant)
-- ---------------------------------------------------------------------------

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  code service_category_code not null unique,
  label text not null,
  description text,
  sort_order integer not null default 0
);

create table service_catalog (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references service_categories(id),
  code text not null unique, -- identifiant stable (ex: "directory.btp") utilisé côté applicatif
  name text not null,
  description text,
  billing_model service_billing_model not null,
  requires_admin_approval boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_catalog_category_id_idx on service_catalog(category_id);

create trigger service_catalog_set_updated_at before update on service_catalog
  for each row execute function set_updated_at();

-- Prix versionné : un changement tarifaire ne modifie jamais rétroactivement un entitlement déjà
-- accordé (qui référence le price_id en vigueur au moment de l'octroi).
create table service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references service_catalog(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency char(3) not null default 'EUR',
  billing_period billing_period not null default 'ONE_TIME',
  effective_from timestamptz not null default now(),
  effective_to timestamptz, -- null = tarif actuellement en vigueur
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index service_prices_service_id_idx on service_prices(service_id);
create unique index service_prices_one_current_per_service on service_prices(service_id) where effective_to is null;

-- ---------------------------------------------------------------------------
-- Demandes d'activation
-- ---------------------------------------------------------------------------

create table access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references service_catalog(id),
  requested_by_user_id uuid not null references users(id),
  status access_request_status not null default 'PENDING',
  message text,
  admin_decision_by_user_id uuid references users(id),
  admin_decision_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index access_requests_organization_id_idx on access_requests(organization_id);
create index access_requests_service_id_idx on access_requests(service_id);

create trigger access_requests_set_updated_at before update on access_requests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Entitlements — accès effectif courant (une ligne par organisation × service)
-- ---------------------------------------------------------------------------

create table organization_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references service_catalog(id),
  status entitlement_status not null,
  price_id uuid references service_prices(id),
  granted_by_user_id uuid not null references users(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz, -- null = sans échéance
  revoked_at timestamptz,
  revoked_by_user_id uuid references users(id),
  revoke_reason text,
  source_access_request_id uuid references access_requests(id),
  notes text,
  updated_at timestamptz not null default now(),
  unique (organization_id, service_id)
);

create index organization_entitlements_service_id_idx on organization_entitlements(service_id);

create trigger organization_entitlements_set_updated_at before update on organization_entitlements
  for each row execute function set_updated_at();

-- Historique immuable (append-only) de chaque changement d'état — jamais modifié/supprimé.
create table entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references service_catalog(id),
  action entitlement_action not null,
  performed_by_user_id uuid not null references users(id),
  performed_at timestamptz not null default now(),
  previous_status entitlement_status,
  new_status entitlement_status not null,
  expires_at timestamptz,
  note text
);

create index entitlement_grants_organization_id_idx on entitlement_grants(organization_id);
create index entitlement_grants_service_id_idx on entitlement_grants(service_id);

-- ---------------------------------------------------------------------------
-- Fonction réutilisable centrale de vérification d'accès (à utiliser par toute future policy
-- RLS protégeant une ressource premium — annuaire/bibliothèque en Phase B/C).
-- ---------------------------------------------------------------------------

create or replace function has_entitlement(target_org_id uuid, target_service_code text)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_entitlements oe
    join service_catalog sc on sc.id = oe.service_id
    where oe.organization_id = target_org_id
      and sc.code = target_service_code
      and oe.status = 'ACTIVE'
      and (oe.expires_at is null or oe.expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper interne (jamais appelé directement par un client — pas de vérification de rôle propre,
-- EXECUTE révoqué de public/anon/authenticated ci-dessous) : upsert entitlement + historique +
-- audit_log en une seule opération atomique.
-- ---------------------------------------------------------------------------

create or replace function _upsert_entitlement(
  p_org_id uuid,
  p_service_id uuid,
  p_new_status entitlement_status,
  p_expires_at timestamptz,
  p_note text,
  p_price_id uuid,
  p_source_request_id uuid,
  p_action entitlement_action
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_status entitlement_status;
  v_actor uuid := current_app_user_id();
begin
  select status into v_previous_status
  from organization_entitlements
  where organization_id = p_org_id and service_id = p_service_id;

  insert into organization_entitlements (
    organization_id, service_id, status, price_id, granted_by_user_id, granted_at,
    expires_at, source_access_request_id, notes
  ) values (
    p_org_id, p_service_id, p_new_status, p_price_id, v_actor, now(),
    p_expires_at, p_source_request_id, p_note
  )
  on conflict (organization_id, service_id) do update set
    status = p_new_status,
    price_id = coalesce(p_price_id, organization_entitlements.price_id),
    granted_by_user_id = case when p_action in ('GRANT', 'REACTIVATE') then v_actor else organization_entitlements.granted_by_user_id end,
    granted_at = case when p_action in ('GRANT', 'REACTIVATE') then now() else organization_entitlements.granted_at end,
    expires_at = case when p_action in ('GRANT', 'REACTIVATE', 'EXTEND') then p_expires_at else organization_entitlements.expires_at end,
    notes = coalesce(p_note, organization_entitlements.notes),
    revoked_at = case when p_action = 'REVOKE' then now() else null end,
    revoked_by_user_id = case when p_action = 'REVOKE' then v_actor else null end,
    revoke_reason = case when p_action = 'REVOKE' then p_note else null end,
    updated_at = now();

  insert into entitlement_grants (
    organization_id, service_id, action, performed_by_user_id, previous_status, new_status, expires_at, note
  ) values (
    p_org_id, p_service_id, p_action, v_actor, v_previous_status, p_new_status, p_expires_at, p_note
  );

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (
    p_org_id, v_actor, 'USER', 'entitlement.' || lower(p_action::text), 'organization_entitlements',
    p_service_id::text, jsonb_build_object('previous_status', v_previous_status, 'new_status', p_new_status, 'note', p_note)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Fonctions publiques — chacune vérifie explicitement ADMIN_PLATEFORME avant toute écriture
-- (SECURITY DEFINER contourne RLS : ce contrôle explicite est la seule protection réelle).
-- ---------------------------------------------------------------------------

create or replace function grant_entitlement(
  p_organization_id uuid, p_service_id uuid, p_expires_at timestamptz default null,
  p_note text default null, p_price_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut accorder un entitlement' using errcode = '42501';
  end if;
  perform _upsert_entitlement(p_organization_id, p_service_id, 'ACTIVE'::entitlement_status, p_expires_at, p_note, p_price_id, null, 'GRANT'::entitlement_action);
end;
$$;

create or replace function suspend_entitlement(
  p_organization_id uuid, p_service_id uuid, p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut suspendre un entitlement' using errcode = '42501';
  end if;
  perform _upsert_entitlement(p_organization_id, p_service_id, 'SUSPENDED'::entitlement_status, null, p_note, null, null, 'SUSPEND'::entitlement_action);
end;
$$;

create or replace function reactivate_entitlement(
  p_organization_id uuid, p_service_id uuid, p_expires_at timestamptz default null, p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut réactiver un entitlement' using errcode = '42501';
  end if;
  perform _upsert_entitlement(p_organization_id, p_service_id, 'ACTIVE'::entitlement_status, p_expires_at, p_note, null, null, 'REACTIVATE'::entitlement_action);
end;
$$;

create or replace function extend_entitlement(
  p_organization_id uuid, p_service_id uuid, p_new_expires_at timestamptz, p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut prolonger un entitlement' using errcode = '42501';
  end if;
  perform _upsert_entitlement(p_organization_id, p_service_id, 'ACTIVE'::entitlement_status, p_new_expires_at, p_note, null, null, 'EXTEND'::entitlement_action);
end;
$$;

create or replace function revoke_entitlement(
  p_organization_id uuid, p_service_id uuid, p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut révoquer un entitlement' using errcode = '42501';
  end if;
  perform _upsert_entitlement(p_organization_id, p_service_id, 'REVOKED'::entitlement_status, null, p_reason, null, null, 'REVOKE'::entitlement_action);
end;
$$;

-- ---------------------------------------------------------------------------
-- Demandes d'activation — cycle de vie complet via fonctions (pas de policy INSERT/UPDATE sur
-- access_requests : chaque transition doit produire une trace audit_log cohérente).
-- ---------------------------------------------------------------------------

create or replace function request_service_access(
  p_organization_id uuid, p_service_id uuid, p_message text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := current_app_user_id();
  v_request_id uuid;
  v_requires_approval boolean;
begin
  if not can_access_organization(p_organization_id) then
    raise exception 'Organisation non accessible' using errcode = '42501';
  end if;

  select requires_admin_approval into v_requires_approval
  from service_catalog where id = p_service_id and is_active;
  if not found then
    raise exception 'Service introuvable ou inactif';
  end if;

  insert into access_requests (organization_id, service_id, requested_by_user_id, status, message)
  values (p_organization_id, p_service_id, v_actor, 'PENDING', p_message)
  returning id into v_request_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (p_organization_id, v_actor, 'USER', 'access_request.create', 'access_requests', v_request_id::text, jsonb_build_object('service_id', p_service_id));

  -- Architecture pour activation automatique future (voir docs/MONETIZATION_AND_ENTITLEMENTS.md) :
  -- seuls les services explicitement configurés avec requires_admin_approval = false passent par
  -- cette branche. Aujourd'hui, tous les services du catalogue ont requires_admin_approval = true
  -- — cette branche reste donc inactive tant qu'aucun Super Administrateur ne change ce réglage,
  -- sans que cela modifie les règles des options actuellement protégées.
  if v_requires_approval = false then
    perform _upsert_entitlement(p_organization_id, p_service_id, 'ACTIVE'::entitlement_status, null, 'Activation automatique (service sans validation requise)', null, v_request_id, 'GRANT'::entitlement_action);
    update access_requests set status = 'APPROVED', admin_decision_at = now(), admin_note = 'Activation automatique' where id = v_request_id;
  end if;

  return v_request_id;
end;
$$;

create or replace function cancel_access_request(p_request_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_actor uuid := current_app_user_id();
begin
  select * into v_request from access_requests where id = p_request_id for update;
  if not found then
    raise exception 'Demande introuvable';
  end if;
  if v_request.requested_by_user_id <> v_actor then
    raise exception 'Seul l''auteur de la demande peut l''annuler' using errcode = '42501';
  end if;
  if v_request.status <> 'PENDING' then
    raise exception 'Seule une demande en attente peut être annulée';
  end if;

  update access_requests set status = 'CANCELLED' where id = p_request_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (v_request.organization_id, v_actor, 'USER', 'access_request.cancel', 'access_requests', p_request_id::text, '{}'::jsonb);
end;
$$;

create or replace function approve_access_request(
  p_request_id uuid, p_expires_at timestamptz default null, p_price_id uuid default null, p_admin_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_actor uuid := current_app_user_id();
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut approuver une demande' using errcode = '42501';
  end if;

  select * into v_request from access_requests where id = p_request_id for update;
  if not found then
    raise exception 'Demande introuvable';
  end if;
  if v_request.status <> 'PENDING' then
    raise exception 'Cette demande a déjà été traitée';
  end if;

  perform _upsert_entitlement(v_request.organization_id, v_request.service_id, 'ACTIVE'::entitlement_status, p_expires_at, p_admin_note, p_price_id, p_request_id, 'GRANT'::entitlement_action);

  update access_requests
  set status = 'APPROVED', admin_decision_by_user_id = v_actor, admin_decision_at = now(), admin_note = p_admin_note
  where id = p_request_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (v_request.organization_id, v_actor, 'USER', 'access_request.approve', 'access_requests', p_request_id::text, jsonb_build_object('service_id', v_request.service_id));
end;
$$;

create or replace function reject_access_request(
  p_request_id uuid, p_admin_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_actor uuid := current_app_user_id();
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut refuser une demande' using errcode = '42501';
  end if;

  select * into v_request from access_requests where id = p_request_id for update;
  if not found then
    raise exception 'Demande introuvable';
  end if;
  if v_request.status <> 'PENDING' then
    raise exception 'Cette demande a déjà été traitée';
  end if;

  update access_requests
  set status = 'REJECTED', admin_decision_by_user_id = v_actor, admin_decision_at = now(), admin_note = p_admin_note
  where id = p_request_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (v_request.organization_id, v_actor, 'USER', 'access_request.reject', 'access_requests', p_request_id::text, jsonb_build_object('service_id', v_request.service_id, 'note', p_admin_note));
end;
$$;

-- Le helper interne n'a aucune vérification de rôle propre : jamais appelable en RPC direct.
revoke execute on function _upsert_entitlement(uuid, uuid, entitlement_status, timestamptz, text, uuid, uuid, entitlement_action) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table service_categories enable row level security;
alter table service_catalog enable row level security;
alter table service_prices enable row level security;
alter table access_requests enable row level security;
alter table organization_entitlements enable row level security;
alter table entitlement_grants enable row level security;

-- Catalogue : référentiel partagé en lecture, écriture réservée à la plateforme.
create policy service_categories_select on service_categories for select using (true);
create policy service_categories_insert on service_categories for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy service_categories_update on service_categories for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy service_categories_delete on service_categories for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy service_catalog_select on service_catalog for select using (true);
create policy service_catalog_insert on service_catalog for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy service_catalog_update on service_catalog for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy service_prices_select on service_prices for select using (true);
create policy service_prices_insert on service_prices for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy service_prices_update on service_prices for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');

-- Demandes : lecture par l'organisation concernée, toute écriture passe par les fonctions
-- ci-dessus (pas de policy INSERT/UPDATE ici).
create policy access_requests_select on access_requests for select using (can_access_organization(organization_id));

-- Entitlements et historique : lecture par l'organisation concernée, écriture exclusivement via
-- les fonctions SECURITY DEFINER (aucune policy INSERT/UPDATE/DELETE, même pour ADMIN_PLATEFORME).
create policy organization_entitlements_select on organization_entitlements for select using (can_access_organization(organization_id));
create policy entitlement_grants_select on entitlement_grants for select using (can_access_organization(organization_id));
