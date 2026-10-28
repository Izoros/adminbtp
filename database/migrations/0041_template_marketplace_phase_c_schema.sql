-- AdminBTP — Marketplace & entitlements, Phase C : bibliothèque de modèles de documents premium
-- Voir docs/MONETIZATION_AND_ENTITLEMENTS.md (Phase A/B) et docs/ROADMAP.md (Phase C) pour les
-- règles produit. Réutilise le moteur de génération existant (Phase 3,
-- apps/web/src/lib/actions/documents.ts::generateDocumentFromTemplate / IAIProvider /
-- renderGeneratedDocumentPdf) — cette migration ajoute seulement le catalogue, le versionnage et
-- le registre des achats qui gouvernent l'accès à un modèle premium, jamais un second moteur de
-- génération.
--
-- Invariants non négociables (voir docs/ROADMAP.md Phase C) :
-- 1. Une organisation sans ligne template_purchases valide pour un modèle ne peut ni voir son
--    contenu réel (RLS SELECT sur template_versions, via has_any_template_purchase()) ni générer
--    de document à partir de lui (vérification explicite dans get_purchased_template_version(),
--    SECURITY DEFINER appelée par la Server Action — même défense en profondeur que
--    get_directory_company_detail() en Phase B : RLS ET vérification applicative explicite).
-- 2. Un modèle retiré du catalogue (document_template_catalog.is_active = false) reste pleinement
--    utilisable par toute organisation qui l'avait déjà acheté : has_template_purchase() et
--    has_any_template_purchase() ne vérifient jamais is_active, et aucune fonction ne supprime
--    jamais de ligne template_versions.
-- 3. Un document généré à partir d'un modèle premium référence directement la version utilisée
--    (documents.premium_template_version_id), jamais le catalogue — il reste donc consultable
--    même après retrait logique du modèle du catalogue (voir invariant 2).
-- 4. Seul ADMIN_PLATEFORME peut approuver un achat (approve_template_purchase_request, migration
--    0042) — même règle non négociable que pour les entitlements (Phase A) : aucune policy RLS
--    INSERT/UPDATE/DELETE sur template_purchases, même pour ADMIN_PLATEFORME.

-- ---------------------------------------------------------------------------
-- Catalogue (référentiel partagé, pas de tenant) — chaque modèle référence un service déjà
-- existant du catalogue Phase A (ex: "templates.moe", voir
-- database/seeds/0003_entitlements_phase_a_seed.sql) pour sa catégorisation/tarification
-- d'affichage uniquement. L'accès effectif à la génération ne passe JAMAIS par has_entitlement()
-- sur ce service : il passe exclusivement par template_purchases ci-dessous — un modèle acheté
-- reste utilisable même si l'abonnement au service sous-jacent n'est plus actif.
-- ---------------------------------------------------------------------------

create table document_template_catalog (
  id uuid primary key default gen_random_uuid(),
  service_code text not null references service_catalog(code),
  code text not null unique, -- identifiant stable (ex: "templates.moe.doe_structure")
  name text not null,
  description text,
  category document_category not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index document_template_catalog_service_code_idx on document_template_catalog(service_code);

create trigger document_template_catalog_set_updated_at before update on document_template_catalog
  for each row execute function set_updated_at();

-- Versionné : un modèle déjà acheté ou déjà utilisé pour générer un document doit rester
-- résoluble pour toujours — aucune fonction de cette phase ne supprime jamais une ligne
-- template_versions, même quand une nouvelle version est publiée ou le modèle retiré du
-- catalogue.
create table template_versions (
  id uuid primary key default gen_random_uuid(),
  template_catalog_id uuid not null references document_template_catalog(id),
  version_number integer not null check (version_number > 0),
  file_url text not null, -- chemin Storage privé (modèle DOCX source)
  variables text[] not null default '{}',
  requires_expert_review boolean not null default false,
  changelog text,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  unique (template_catalog_id, version_number)
);

create index template_versions_template_catalog_id_idx on template_versions(template_catalog_id);
create index template_versions_created_by_user_id_idx on template_versions(created_by_user_id);

-- Registre des achats — quelle organisation a acheté quelle version. Jamais redistribué entre
-- organisations : un achat est propre à une organisation (contrainte unique ci-dessous), jamais
-- transférable. La version achetée est figée au moment de l'octroi (même principe que
-- organization_entitlements.price_id en Phase A) ; approve_template_purchase_request() (migration
-- 0042) peut la faire avancer vers une version plus récente sans dupliquer la ligne.
create table template_purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_catalog_id uuid not null references document_template_catalog(id),
  version_id uuid not null references template_versions(id),
  purchased_by_user_id uuid not null references users(id), -- ADMIN_PLATEFORME qui a approuvé
  purchased_at timestamptz not null default now(),
  source_access_request_id uuid references access_requests(id),
  note text,
  unique (organization_id, template_catalog_id)
);

create index template_purchases_organization_id_idx on template_purchases(organization_id);
create index template_purchases_template_catalog_id_idx on template_purchases(template_catalog_id);
create index template_purchases_version_id_idx on template_purchases(version_id);
create index template_purchases_purchased_by_user_id_idx on template_purchases(purchased_by_user_id);
create index template_purchases_source_access_request_id_idx on template_purchases(source_access_request_id);

-- Demande d'achat : réutilise access_requests (même flux que Phase A/B, voir
-- docs/MONETIZATION_AND_ENTITLEMENTS.md). Nullable : distingue une demande de modèle premium
-- d'une demande de service générique. `service_id` reste systématiquement rempli (résolu depuis
-- document_template_catalog.service_code) pour que /admin liste toutes les demandes de façon
-- uniforme, mais seule une demande avec document_template_catalog_id renseigné peut être traitée
-- par approve_template_purchase_request() (migration 0042).
alter table access_requests add column document_template_catalog_id uuid references document_template_catalog(id);
create index access_requests_document_template_catalog_id_idx on access_requests(document_template_catalog_id);

-- Un document généré à partir d'un modèle premium référence sa version exacte, jamais le
-- catalogue — garantit la consultabilité même après retrait du modèle (invariant 3 ci-dessus).
-- Un document ne peut jamais référencer les deux sources de modèle à la fois.
alter table documents add column premium_template_version_id uuid references template_versions(id);
create index documents_premium_template_version_id_idx on documents(premium_template_version_id);
alter table documents add constraint documents_single_template_source
  check (template_id is null or premium_template_version_id is null);

-- ---------------------------------------------------------------------------
-- Fonctions de vérification d'accès réutilisables — SECURITY DEFINER dès la création (même piège
-- documenté que can_access_site(), voir skill adminbtp-multitenant-security : toute fonction RLS
-- qui lit une table elle-même protégée par RLS doit l'être dès sa création).
-- ---------------------------------------------------------------------------

-- Vérification stricte, pour un couple organisation/modèle précis : l'organisation désignée a-t-
-- elle acheté ce modèle ? Ne vérifie jamais document_template_catalog.is_active : un modèle
-- retiré du catalogue reste accessible à qui l'a déjà acheté (invariant 2). Utilisée à la fois en
-- RLS et explicitement par la Server Action de génération (double vérification, voir migration
-- 0042 : get_purchased_template_version()).
create or replace function has_template_purchase(target_org_id uuid, target_template_catalog_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from template_purchases tp
    where tp.organization_id = target_org_id
      and tp.template_catalog_id = target_template_catalog_id
  );
$$;

-- Utilisée en RLS (SELECT sur template_versions, contenu réel du modèle) : vrai si
-- ADMIN_PLATEFORME, ou si une organisation accessible par l'utilisateur courant a acheté ce
-- modèle — même principe que has_any_accessible_entitlement() en Phase B.
create or replace function has_any_template_purchase(target_template_catalog_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select
    current_user_permission_role() = 'ADMIN_PLATEFORME'
    or exists (
      select 1 from template_purchases tp
      where tp.template_catalog_id = target_template_catalog_id
        and can_access_organization(tp.organization_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table document_template_catalog enable row level security;
alter table template_versions enable row level security;
alter table template_purchases enable row level security;

-- Catalogue : référentiel partagé, parcourable par tous (comme service_catalog) pour permettre de
-- demander un achat même sans en avoir encore un ; écriture réservée à la plateforme.
create policy document_template_catalog_select on document_template_catalog for select using (true);
create policy document_template_catalog_insert on document_template_catalog for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy document_template_catalog_update on document_template_catalog for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');

-- Versions : contenu réel (fichier, variables) réservé aux organisations qui ont acheté le modèle
-- — une organisation sans achat valide ne voit aucune version, même par appel API direct
-- (invariant 1). Jamais de policy UPDATE/DELETE : une version publiée n'est jamais modifiée ni
-- supprimée, seule une nouvelle version peut être ajoutée.
create policy template_versions_select on template_versions for select using (has_any_template_purchase(template_catalog_id));
create policy template_versions_insert on template_versions for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');

-- Achats : lecture par l'organisation concernée, écriture exclusivement via
-- approve_template_purchase_request() (SECURITY DEFINER, migration 0042) — aucune policy
-- INSERT/UPDATE/DELETE, même pour ADMIN_PLATEFORME (invariant 4).
create policy template_purchases_select on template_purchases for select using (can_access_organization(organization_id));
