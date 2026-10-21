-- AdminBTP — Exigences SaaS multi-tenant (Phase 2, suite)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21. Voir docs/CDC/MULTI_TENANT_SAAS.md pour
-- le contexte produit complet : AdminBTP est un SaaS multi-tenant commercial, jamais un outil
-- interne dédié à une seule entreprise cliente (MAWU comprise).

-- ---------------------------------------------------------------------------
-- role_scope : distinction explicite plateforme / entreprise sur users
-- ---------------------------------------------------------------------------

create type role_scope as enum ('PLATEFORME', 'ENTREPRISE');

alter table users add column role_scope role_scope;

update users set role_scope = case
  when permission_role in (
    'ADMIN_PLATEFORME', 'RESPONSABLE_PORTEFEUILLE', 'GESTIONNAIRE_ADMINISTRATIF',
    'CHARGE_AFFAIRES', 'ASSISTANT_ADMINISTRATIF', 'EXPERT_TECHNIQUE'
  ) then 'PLATEFORME'::role_scope
  else 'ENTREPRISE'::role_scope
end;

alter table users alter column role_scope set not null;

-- Un rôle PLATEFORME ne doit jamais être rattaché à une organisation cliente. Un rôle ENTREPRISE
-- peut temporairement n'avoir aucune organisation (nouvel inscrit en attente de rattachement) :
-- RLS le laisse déjà sans accès à aucune donnée dans cet état, donc pas de risque à l'autoriser.
alter table users add constraint users_role_scope_platforme_no_org
  check (role_scope <> 'PLATEFORME' or organization_id is null);

-- ---------------------------------------------------------------------------
-- organization_domains : plusieurs domaines mail par organisation
-- ---------------------------------------------------------------------------

create table organization_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  domain text not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (domain)
);

create index organization_domains_organization_id_idx on organization_domains(organization_id);

-- ---------------------------------------------------------------------------
-- plan_features : paramétrage des fonctionnalités par abonnement
-- ---------------------------------------------------------------------------

create table plan_features (
  plan subscription_plan not null,
  feature_key text not null,
  enabled boolean not null default true,
  primary key (plan, feature_key)
);

-- ---------------------------------------------------------------------------
-- organization_integrations : connecteurs Odoo/n8n/... isolés par organisation
-- ---------------------------------------------------------------------------

create type integration_type as enum ('ODOO', 'N8N', 'EMAIL', 'WHATSAPP', 'AI');
create type integration_managed_by as enum ('ADMINBTP', 'CLIENT');

create table organization_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  integration_type integration_type not null,
  managed_by integration_managed_by not null default 'ADMINBTP',
  config jsonb not null default '{}', -- non-secret uniquement (URL, id d'instance...)
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_type)
);

create index organization_integrations_organization_id_idx on organization_integrations(organization_id);

create trigger organization_integrations_set_updated_at before update on organization_integrations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- signature_profiles : modèles de signature propres à chaque organisation
-- ---------------------------------------------------------------------------

create table signature_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  label text not null,
  signer_name text not null,
  signer_role text not null,
  signature_style text not null,
  whatsapp_enabled boolean not null default false,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index signature_profiles_organization_id_idx on signature_profiles(organization_id);

create trigger signature_profiles_set_updated_at before update on signature_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- portfolio_grants : révocation tracée
-- ---------------------------------------------------------------------------

alter table portfolio_grants add column revoked_at timestamptz;
alter table portfolio_grants add column revoked_by uuid references users(id);
