-- Profil société/corps d'état, actes de lancement par rôle, pièces de marché structurées
-- (préparation OCR), lignes de décompte, macrolots/sous-traitants, contrôle IA.
-- Voir docs/DECISIONS.md pour la règle "toute nouvelle Server Action qui insère dans une table
-- protégée par can_access_site() (ou une table sœur protégée par la même fonction) doit générer
-- l'id côté serveur et éviter .select() après .insert()" — applicable à toutes les tables créées
-- ici dont la policy SELECT lit (directement ou via jointure) sites/site_participants.

-- ---------------------------------------------------------------------------
-- 1. Profil société et corps d'état
-- ---------------------------------------------------------------------------

create type trade_family as enum ('STRUCTURE_VRD', 'TECHNIQUE', 'ETANCHEITE_FACADE', 'FINITIONS');

create table trade_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  family trade_family not null
);

create type legal_kind as enum (
  'ENTREPRISE', 'MOE', 'BET', 'AMO_OPC', 'PROMOTEUR', 'BAILLEUR', 'COLLECTIVITE', 'ARTISAN', 'GROUPE'
);

create type organization_size_band as enum ('TPE', 'PME', 'ETI');

-- Le profil ne crée aucun droit : sert de défaut à l'onboarding et au pré-filtre des modèles et
-- lots proposés. Le rôle effectif reste site_participants.mission_role.
create table organization_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  legal_kind legal_kind not null,
  default_mission_roles mission_role[] not null default '{}',
  size_band organization_size_band,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_trades (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  trade_code_id uuid not null references trade_codes(id),
  is_primary boolean not null default false,
  unique (organization_id, trade_code_id)
);

create index organization_trades_organization_id_idx on organization_trades(organization_id);
create index organization_trades_trade_code_id_idx on organization_trades(trade_code_id);

-- ---------------------------------------------------------------------------
-- 2. Actes de lancement — référentiel déclaratif (checklist de dépendances), pas une machine à
-- états parallèle. Chaque acte produit un Document (cycle de statuts standard déjà existant).
-- ---------------------------------------------------------------------------

create table act_templates (
  id uuid primary key default gen_random_uuid(),
  mission_family text not null, -- ex: 'MOE'
  code text not null, -- ex: 'NOTIFICATION_MARCHE', 'OS_DEMARRAGE'
  label text not null,
  document_category document_category not null,
  required_mission_role mission_role not null,
  depends_on_act_code text, -- référence un autre act_templates.code de la même mission_family
  unlocks_phase_template_code text, -- ex: OS_DEMARRAGE débloque 'EXE'
  sort_order integer not null default 0,
  unique (mission_family, code)
);

-- Document concerné par un document (ex: DC4/AGREMENT_SOUS_TRAITANT désigne un sous-traitant
-- précis, distinct de documents.organization_id qui reste l'organisation auteure).
alter table documents add column concerns_organization_id uuid references organizations(id);
create index documents_concerns_organization_id_idx on documents(concerns_organization_id);

-- ---------------------------------------------------------------------------
-- 3. Pièces de marché structurées (préparation OCR, aucun fournisseur réel branché)
-- ---------------------------------------------------------------------------

create type market_contract_type as enum ('PRIVE', 'PUBLIC');

-- Aucun délai/taux par défaut implicite : ces colonnes restent NULL tant qu'elles n'ont pas été
-- saisies ou extraites puis validées depuis les clauses du marché.
create table market_contracts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  lot_id uuid references lots(id),
  contract_type market_contract_type not null,
  price_reference_month text, -- "YYYY-MM"
  retention_guarantee_rate numeric check (retention_guarantee_rate >= 0 and retention_guarantee_rate <= 1),
  payment_term_days integer check (payment_term_days > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index market_contracts_site_id_idx on market_contracts(site_id);
create index market_contracts_lot_id_idx on market_contracts(lot_id);

create type market_clause_kind as enum (
  'DELAI_PAIEMENT', 'RETENUE_GARANTIE', 'ACTUALISATION', 'PENALITE', 'AVANCE', 'AUTRE'
);
create type extraction_status as enum ('EXTRAIT', 'VALIDE', 'REJETE');

create table market_clauses (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references market_contracts(id) on delete cascade,
  kind market_clause_kind not null,
  payload jsonb not null default '{}',
  status extraction_status not null default 'EXTRAIT',
  source_document_id uuid references documents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index market_clauses_contract_id_idx on market_clauses(contract_id);
create index market_clauses_source_document_id_idx on market_clauses(source_document_id);

create type price_line_origin as enum ('SAISIE', 'IMPORT_OCR');

create table price_lines (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  code text not null, -- code DPGF/BPU
  label text not null,
  unit text not null,
  quantity_market numeric not null check (quantity_market >= 0),
  unit_price_ht numeric not null check (unit_price_ht >= 0),
  origin price_line_origin not null,
  status extraction_status not null default 'EXTRAIT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index price_lines_lot_id_idx on price_lines(lot_id);

-- ---------------------------------------------------------------------------
-- 4. Décomptes — Situation reste l'en-tête, nouvelles lignes + champs de calcul
-- ---------------------------------------------------------------------------

alter table situations
  add column actualization_coefficient numeric check (actualization_coefficient > 0),
  add column index_month text,
  add column retention_amount numeric check (retention_amount >= 0),
  add column advance_recovered numeric check (advance_recovered >= 0),
  add column penalties_amount numeric check (penalties_amount >= 0),
  add column net_amount_ht numeric;

create table situation_lines (
  id uuid primary key default gen_random_uuid(),
  situation_id uuid not null references situations(id) on delete cascade,
  price_line_id uuid not null references price_lines(id),
  quantity_previous numeric not null default 0,
  quantity_month numeric not null,
  unit_price_ht numeric not null check (unit_price_ht >= 0),
  amount_ht numeric not null
);

create index situation_lines_situation_id_idx on situation_lines(situation_id);
create index situation_lines_price_line_id_idx on situation_lines(price_line_id);

-- Ventilation optionnelle vers une organisation tierce (paiement direct sous-traitant) — jamais
-- créée sans DC4/agrément VALIDE pour cette organisation sur ce chantier (voir trigger plus bas).
create table situation_allocations (
  id uuid primary key default gen_random_uuid(),
  situation_id uuid not null references situations(id) on delete cascade,
  payee_organization_id uuid not null references organizations(id),
  amount_ht numeric not null check (amount_ht >= 0),
  created_at timestamptz not null default now()
);

create index situation_allocations_situation_id_idx on situation_allocations(situation_id);
create index situation_allocations_payee_organization_id_idx on situation_allocations(payee_organization_id);

-- ---------------------------------------------------------------------------
-- 5. Macrolots et sous-traitants
-- ---------------------------------------------------------------------------

alter table lots add column parent_lot_id uuid references lots(id);
alter table lots add constraint lots_parent_not_self check (parent_lot_id is null or parent_lot_id <> id);
create index lots_parent_lot_id_idx on lots(parent_lot_id);

-- Fonction réutilisable : une ligne de décompte (ou une ventilation) ne peut concerner un
-- sous-traitant que si un DC4 ou un agrément de sous-traitance VALIDE existe pour lui sur ce
-- chantier. SECURITY DEFINER pour rester utilisable depuis un trigger ou une policy future sans
-- dépendre des droits de lecture de l'appelant sur documents.
create or replace function has_valid_subcontractor_agreement(p_site_id uuid, p_organization_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from documents d
    where d.site_id = p_site_id
      and d.concerns_organization_id = p_organization_id
      and d.category in ('DC4', 'AGREMENT_SOUS_TRAITANT')
      and d.status = 'VALIDE'
  );
$$;

create or replace function prevent_lot_cycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current uuid;
  v_depth integer := 0;
begin
  if new.parent_lot_id is null then
    return new;
  end if;
  v_current := new.parent_lot_id;
  while v_current is not null loop
    v_depth := v_depth + 1;
    if v_depth > 50 then
      raise exception 'Hiérarchie de lots trop profonde ou cycle suspecté';
    end if;
    if v_current = new.id then
      raise exception 'Un lot ne peut pas être son propre ancêtre (cycle détecté)';
    end if;
    select parent_lot_id into v_current from lots where id = v_current;
  end loop;
  return new;
end;
$$;

create trigger lots_prevent_cycle
  before insert or update of parent_lot_id on lots
  for each row execute function prevent_lot_cycle();

create or replace function check_subcontractor_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_is_subcontractor boolean;
begin
  select s.site_id into v_site_id from situations s where s.id = new.situation_id;

  select exists (
    select 1 from site_participants sp
    where sp.site_id = v_site_id
      and sp.organization_id = new.payee_organization_id
      and sp.mission_role = 'SOUS_TRAITANT'
  ) into v_is_subcontractor;

  if v_is_subcontractor and not has_valid_subcontractor_agreement(v_site_id, new.payee_organization_id) then
    raise exception 'Aucun DC4 ou agrément de sous-traitance VALIDE pour cette organisation sur ce chantier' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger situation_allocations_check_subcontractor
  before insert or update on situation_allocations
  for each row execute function check_subcontractor_allocation();

-- ---------------------------------------------------------------------------
-- 6. Contrôle IA — trace de contrôle, pas de nouveau statut "validé par IA"
-- ---------------------------------------------------------------------------

create type document_review_source as enum ('AI', 'HUMAIN');
create type document_review_verdict as enum ('OK', 'ECARTS', 'INSUFFISANT');

create table document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  source document_review_source not null,
  verdict document_review_verdict not null,
  findings jsonb not null default '{}',
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

create index document_reviews_document_id_idx on document_reviews(document_id);

-- Trace auditée explicite pour un déblocage d'acte malgré une dépendance non satisfaite (voir
-- act_templates.depends_on_act_code) — le blocage est une checklist affichée, pas un verrou
-- silencieux, mais tout déblocage doit être tracé.
create or replace function log_act_override(p_organization_id uuid, p_site_id uuid, p_act_code text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := current_app_user_id();
begin
  if not can_access_site(p_site_id) then
    raise exception 'Chantier non accessible' using errcode = '42501';
  end if;
  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (p_organization_id, v_actor, 'USER', 'act.override_block', 'sites', p_site_id::text, jsonb_build_object('act_code', p_act_code, 'reason', p_reason));
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------

create trigger organization_profiles_set_updated_at before update on organization_profiles
  for each row execute function set_updated_at();
create trigger market_contracts_set_updated_at before update on market_contracts
  for each row execute function set_updated_at();
create trigger market_clauses_set_updated_at before update on market_clauses
  for each row execute function set_updated_at();
create trigger price_lines_set_updated_at before update on price_lines
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table trade_codes enable row level security;
alter table organization_profiles enable row level security;
alter table organization_trades enable row level security;
alter table act_templates enable row level security;
alter table market_contracts enable row level security;
alter table market_clauses enable row level security;
alter table price_lines enable row level security;
alter table situation_lines enable row level security;
alter table situation_allocations enable row level security;
alter table document_reviews enable row level security;

-- Référentiels plateforme (partagés, pas de tenant) : lecture pour tous, écriture ADMIN_PLATEFORME.
create policy trade_codes_select on trade_codes for select using (true);
create policy trade_codes_insert on trade_codes for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy trade_codes_update on trade_codes for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy trade_codes_delete on trade_codes for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy act_templates_select on act_templates for select using (true);
create policy act_templates_insert on act_templates for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy act_templates_update on act_templates for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy act_templates_delete on act_templates for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');

create policy organization_profiles_select on organization_profiles for select using (can_access_organization(organization_id));
create policy organization_profiles_insert on organization_profiles for insert with check (can_access_organization(organization_id));
create policy organization_profiles_update on organization_profiles for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));

create policy organization_trades_select on organization_trades for select using (can_access_organization(organization_id));
create policy organization_trades_insert on organization_trades for insert with check (can_access_organization(organization_id));
create policy organization_trades_update on organization_trades for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));
create policy organization_trades_delete on organization_trades for delete using (can_access_organization(organization_id));

create policy market_contracts_select on market_contracts for select using (can_access_site(site_id));
create policy market_contracts_insert on market_contracts for insert with check (can_access_site(site_id));
create policy market_contracts_update on market_contracts for update using (can_access_site(site_id)) with check (can_access_site(site_id));

create policy market_clauses_select on market_clauses for select using (
  exists (select 1 from market_contracts mc where mc.id = contract_id and can_access_site(mc.site_id))
);
create policy market_clauses_insert on market_clauses for insert with check (
  exists (select 1 from market_contracts mc where mc.id = contract_id and can_access_site(mc.site_id))
);
create policy market_clauses_update on market_clauses for update using (
  exists (select 1 from market_contracts mc where mc.id = contract_id and can_access_site(mc.site_id))
) with check (
  exists (select 1 from market_contracts mc where mc.id = contract_id and can_access_site(mc.site_id))
);

create policy price_lines_select on price_lines for select using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy price_lines_insert on price_lines for insert with check (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy price_lines_update on price_lines for update using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
) with check (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);

create policy situation_lines_select on situation_lines for select using (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);
create policy situation_lines_insert on situation_lines for insert with check (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);
create policy situation_lines_update on situation_lines for update using (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
) with check (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);

create policy situation_allocations_select on situation_allocations for select using (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);
create policy situation_allocations_insert on situation_allocations for insert with check (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);

create policy document_reviews_select on document_reviews for select using (
  exists (
    select 1 from documents d where d.id = document_id
    and (can_access_organization(d.organization_id) or (d.site_id is not null and can_access_site(d.site_id)))
  )
);
create policy document_reviews_insert on document_reviews for insert with check (
  exists (
    select 1 from documents d where d.id = document_id
    and (can_access_organization(d.organization_id) or (d.site_id is not null and can_access_site(d.site_id)))
  )
);

-- Situations n'avait jusqu'ici qu'une policy SELECT (lecture seule côté UI) : ajout des policies
-- d'écriture nécessaires au nouvel écran de décompte.
create policy situations_insert on situations for insert with check (can_access_site(site_id));
create policy situations_update on situations for update using (can_access_site(site_id)) with check (can_access_site(site_id));
