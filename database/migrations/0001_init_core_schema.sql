-- AdminBTP — Migration initiale (Phase 1 → appliquée en Phase 2)
-- APPLIQUÉE au projet Supabase "AdminBTP" (ref: azphgxzapyuazxtqzvta) le 2026-10-21, après
-- suppression d'un schéma hérité d'un projet précédent (tables vides, confirmé par l'utilisateur
-- — voir docs/DECISIONS.md). users.id référence directement auth.users.id (voir migration
-- 0002_auth_user_sync.sql pour le trigger de provisioning automatique).
-- Reflète fidèlement les schémas Zod de packages/types (source de vérité applicative).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type mission_role as enum (
  'MOA', 'MOE', 'AMO', 'OPC', 'BET',
  'ENTREPRISE_TCE', 'ENTREPRISE_GENERALE', 'ENTREPRISE_LOT', 'SOUS_TRAITANT',
  'PROMOTEUR', 'BAILLEUR_SOCIAL', 'COLLECTIVITE'
);

create type user_permission_role as enum (
  'ADMIN_PLATEFORME', 'RESPONSABLE_PORTEFEUILLE', 'GESTIONNAIRE_ADMINISTRATIF',
  'CHARGE_AFFAIRES', 'ASSISTANT_ADMINISTRATIF', 'EXPERT_TECHNIQUE', 'VALIDATEUR',
  'DIRIGEANT_CLIENT', 'COLLABORATEUR_CLIENT', 'OBSERVATEUR'
);

create type subscription_plan as enum ('DEMO', 'STARTER', 'PRO', 'ENTERPRISE');

create type site_status as enum (
  'ETUDE', 'CONSULTATION', 'PREPARATION', 'EN_COURS', 'RECEPTION', 'GPA', 'CLOTURE', 'SUSPENDU'
);

create type phase_instance_status as enum (
  'A_VENIR', 'EN_COURS', 'EN_ATTENTE_VALIDATION', 'VALIDEE', 'BLOQUEE', 'ANNULEE'
);

create type document_category as enum (
  'COURRIER', 'COMPTE_RENDU', 'PPSPS', 'DC4', 'AGREMENT_SOUS_TRAITANT', 'RESERVES',
  'SITUATION_TRAVAUX', 'DOE', 'DGD', 'MARCHE', 'ADMINISTRATIF', 'AUTRE'
);

create type document_status as enum (
  'BROUILLON', 'PREEDITION', 'EN_CONTROLE', 'EN_VALIDATION', 'VALIDE', 'ENVOYE', 'ARCHIVE'
);

create type validation_step as enum (
  'PREPARATION', 'CONTROLE_GESTIONNAIRE', 'VALIDATION_DIRIGEANT', 'SIGNATURE', 'ENVOI', 'ARCHIVAGE'
);

create type approval_decision as enum ('APPROUVE', 'REFUSE', 'MODIFICATION_DEMANDEE');

create type audit_actor_type as enum ('USER', 'AUTOMATION', 'AI');

create type mail_urgency as enum ('NORMALE', 'URGENTE', 'CRITIQUE');

create type mail_status as enum (
  'NON_TRAITE', 'AFFECTE', 'BROUILLON_PRET', 'EN_VALIDATION', 'REPONDU', 'CLOTURE'
);

create type task_status as enum ('A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'FAIT', 'ANNULE');

create type task_priority as enum ('BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE');

create type task_source_type as enum ('MANUEL', 'MAIL', 'PHASE', 'VALIDATION', 'AUTOMATISATION');

create type payment_status as enum (
  'A_ETABLIR', 'TRANSMIS', 'EN_VERIFICATION', 'ACCEPTE', 'CONTESTE', 'PAYE'
);

create type reminder_channel as enum ('EMAIL', 'WHATSAPP', 'COURRIER');

create type expertise_request_type as enum (
  'AVIS_INGENIEUR', 'CONSULTATION_ARCHITECTE', 'ANALYSE_EXE', 'ANALYSE_DOE',
  'RELECTURE_MEMOIRE_TECHNIQUE', 'ASSISTANCE_APPEL_OFFRES', 'AUTRE'
);

create type expertise_request_status as enum (
  'NOUVELLE', 'ASSIGNEE', 'EN_COURS', 'RAPPORT_LIVRE', 'CLOTUREE'
);

-- ---------------------------------------------------------------------------
-- Tenants & utilisateurs
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text not null,
  siret char(14),
  logo_url text,
  address text,
  postal_code text,
  city text,
  country text not null default 'FR',
  domain text,
  domain_verified boolean not null default false,
  subscription_plan subscription_plan not null default 'DEMO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- id = auth.users.id (Supabase Auth) : un profil AdminBTP existe pour chaque utilisateur
-- authentifié, créé par le trigger handle_new_user (voir 0002_auth_user_sync.sql).
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade, -- null = compte AdminBTP transverse
  email text not null unique,
  full_name text not null,
  permission_role user_permission_role not null,
  avatar_url text,
  mfa_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index users_organization_id_idx on users(organization_id);

-- Collaborateur AdminBTP autorisé à superviser plusieurs sociétés clientes.
create table portfolio_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  granted_by uuid not null references users(id),
  granted_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- ---------------------------------------------------------------------------
-- Chantiers
-- ---------------------------------------------------------------------------

create table sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  reference text not null,
  address text not null,
  city text not null,
  postal_code text,
  status site_status not null,
  budget_ht numeric(14, 2),
  start_date date,
  end_date_estimated date,
  manager_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create index sites_organization_id_idx on sites(organization_id);

create table site_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  can_validate boolean not null default false,
  can_edit_documents boolean not null default true,
  can_manage_finance boolean not null default false,
  unique (user_id, site_id)
);

create table lots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  number text not null,
  name text not null,
  assigned_organization_id uuid references organizations(id),
  amount_ht numeric(14, 2)
);

create index lots_site_id_idx on lots(site_id);

-- Participation d'une organisation (intervenant) à un chantier avec un rôle métier.
create table site_participants (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  mission_role mission_role not null,
  lot_id uuid references lots(id),
  contract_amount_ht numeric(14, 2),
  joined_at timestamptz not null default now()
);

create index site_participants_site_id_idx on site_participants(site_id);
create index site_participants_organization_id_idx on site_participants(organization_id);

-- ---------------------------------------------------------------------------
-- Moteur de phases (commun et configurable — ne pas dupliquer par profil métier)
-- ---------------------------------------------------------------------------

create table phase_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  default_duration_days integer
);

create table phase_template_sets (
  id uuid primary key default gen_random_uuid(),
  mission_family text not null,
  label text not null,
  phase_template_ids uuid[] not null default '{}'
);

create table phase_instances (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  phase_template_id uuid not null references phase_templates(id),
  status phase_instance_status not null,
  start_date date,
  end_date_target date,
  end_date_actual date,
  responsible_user_id uuid references users(id),
  checklist jsonb not null default '[]', -- ChecklistItem[]
  expected_document_types text[] not null default '{}',
  depends_on_phase_instance_ids uuid[] not null default '{}' -- conditions de passage déclaratives
);

create index phase_instances_site_id_idx on phase_instances(site_id);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category document_category not null,
  name text not null,
  file_url text not null,
  variables text[] not null default '{}',
  requires_expert_review boolean not null default false, -- true pour PPSPS notamment
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  category document_category not null,
  title text not null,
  status document_status not null,
  file_url text not null,
  version integer not null default 1,
  template_id uuid references document_templates(id),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_organization_id_idx on documents(organization_id);
create index documents_site_id_idx on documents(site_id);

-- Règle produit non négociable : tout PPSPS généré doit naître avec le statut PREEDITION
-- (cf. document_templates.requires_expert_review). Un check constraint ne peut pas porter sur
-- l'historique des statuts ; cette garantie est donc appliquée par le service de création de
-- documents (apps/web), pas par le schéma — voir docs/VALIDATION_CHECKLIST.md.

-- ---------------------------------------------------------------------------
-- Validations — préparation / contrôle / validation / signature / envoi / archivage
-- Distinction stricte : approbation humaine ≠ preuve WhatsApp ≠ signature électronique.
-- ---------------------------------------------------------------------------

create table validation_records (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  step validation_step not null,
  decision approval_decision,
  decided_by_user_id uuid references users(id),
  decided_at timestamptz,
  comment text,
  whatsapp_proof_url text, -- preuve d'échange uniquement, ne vaut jamais signature
  signature_provider text, -- ex: "yousign", "docusign" — non branché en Phase 1
  signature_envelope_id text,
  is_legally_binding_signature boolean not null default false
);

create index validation_records_document_id_idx on validation_records(document_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references users(id), -- null si action automatisée (n8n, IA)
  actor_type audit_actor_type not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_log_organization_id_idx on audit_log(organization_id);

-- ---------------------------------------------------------------------------
-- Mails
-- ---------------------------------------------------------------------------

create table mail_addresses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  address text not null unique,
  label text not null,
  site_id uuid references sites(id),
  is_active boolean not null default true
);

create table mail_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  mail_address_id uuid not null references mail_addresses(id),
  site_id uuid references sites(id),
  subject text not null,
  from_address text not null,
  status mail_status not null,
  urgency mail_urgency not null,
  assigned_user_id uuid references users(id),
  last_message_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index mail_threads_organization_id_idx on mail_threads(organization_id);

-- ---------------------------------------------------------------------------
-- Tâches
-- ---------------------------------------------------------------------------

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid references sites(id),
  title text not null,
  description text,
  status task_status not null,
  priority task_priority not null,
  assigned_user_id uuid references users(id),
  due_date date,
  source_type task_source_type not null default 'MANUEL',
  source_id uuid,
  created_at timestamptz not null default now()
);

create index tasks_organization_id_idx on tasks(organization_id);

-- ---------------------------------------------------------------------------
-- Finance — situations/décomptes et règles de relance (configurables par marché)
-- ---------------------------------------------------------------------------

create table situations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  lot_id uuid references lots(id),
  number integer not null,
  amount_ht numeric(14, 2) not null,
  status payment_status not null,
  submitted_at date,
  due_date date, -- calculée selon les clauses du marché, jamais codée en dur
  paid_at date,
  dispute_reason text
);

create index situations_site_id_idx on situations(site_id);

create table reminder_rules (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  applies_to_contract_type text not null, -- ex: "marché privé", "marché public"
  days_after_due integer not null,
  channel reminder_channel not null,
  template_id uuid references document_templates(id)
);

-- ---------------------------------------------------------------------------
-- Expertise technique
-- ---------------------------------------------------------------------------

create table expertise_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid references sites(id),
  type expertise_request_type not null,
  status expertise_request_status not null,
  requested_by_user_id uuid not null references users(id),
  assigned_expert_user_id uuid references users(id),
  description text not null,
  attached_document_ids uuid[] not null default '{}',
  hours_spent numeric(6, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index expertise_requests_organization_id_idx on expertise_requests(organization_id);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger sites_set_updated_at before update on sites
  for each row execute function set_updated_at();
create trigger documents_set_updated_at before update on documents
  for each row execute function set_updated_at();
