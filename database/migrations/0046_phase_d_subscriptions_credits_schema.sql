-- AdminBTP — Marketplace & entitlements, Phase D : abonnements et crédits prépayés.
-- Voir docs/MONETIZATION_AND_ENTITLEMENTS.md et docs/ROADMAP.md ("Phase D — Abonnements et
-- crédits") pour les règles produit complètes. Reprend délibérément le pattern de
-- database/migrations/0010_entitlements_phase_a.sql pour tout ce qui touche à l'état commercial.
--
-- Règle non négociable (identique à la Phase A) : seul un utilisateur ADMIN_PLATEFORME peut
-- activer, suspendre, réactiver, prolonger ou annuler un abonnement, ou créditer un portefeuille
-- de crédits — exclusivement via les fonctions SECURITY DEFINER de 0048 (abonnements) et 0049
-- (crédits), jamais via une policy RLS d'écriture directe sur organization_subscriptions ou
-- credit_wallets. La consommation (débit) n'est pas un geste commercial au sens de cette règle :
-- elle est déclenchée par n'importe quel membre de l'organisation qui utilise une fonctionnalité
-- payante, mais reste elle aussi exclusivement exprimée via une fonction SECURITY DEFINER dédiée
-- (debit_credits/record_usage, 0049) pour garantir l'atomicité débit + historique + plafond de
-- solde — donc pas de policy INSERT/UPDATE sur credit_wallets/credit_transactions/usage_records
-- non plus, même pour ADMIN_PLATEFORME.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type subscription_status as enum ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

create type subscription_action as enum ('ACTIVATE', 'SUSPEND', 'REACTIVATE', 'EXTEND', 'CANCEL');

create type credit_transaction_type as enum ('TOPUP', 'DEBIT', 'ADJUSTMENT', 'REFUND');

-- ---------------------------------------------------------------------------
-- Abonnements — accès effectif courant par organisation × service, même forme que
-- organization_entitlements en Phase A. Réutilise le catalogue et les prix versionnés existants
-- (service_catalog/service_prices) plutôt que de dupliquer une notion de "plan" : un abonnement
-- est un organization_entitlements-like portant en plus des dates de période de facturation.
-- ---------------------------------------------------------------------------

create table organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references service_catalog(id),
  status subscription_status not null,
  price_id uuid references service_prices(id),
  activated_by_user_id uuid not null references users(id),
  activated_at timestamptz not null default now(),
  current_period_start timestamptz,
  current_period_end timestamptz,
  expires_at timestamptz, -- null = sans échéance tant qu'un Super Administrateur ne la fixe pas
  cancelled_at timestamptz,
  cancelled_by_user_id uuid references users(id),
  cancel_reason text,
  notes text,
  updated_at timestamptz not null default now(),
  unique (organization_id, service_id)
);

create index organization_subscriptions_service_id_idx on organization_subscriptions(service_id);

create trigger organization_subscriptions_set_updated_at before update on organization_subscriptions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Portefeuille de crédits prépayés — un solde par organisation, jamais négatif (contrainte check
-- en plus du contrôle applicatif de debit_credits() en 0049, défense en profondeur).
-- ---------------------------------------------------------------------------

create table credit_wallets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  expires_at timestamptz, -- null = sans échéance ; des crédits promotionnels peuvent expirer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger credit_wallets_set_updated_at before update on credit_wallets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Consommation mesurée — ce qui sera débité (ex: appel IA, génération de document). Une ligne par
-- opération source, protégée par une clé d'idempotence unique par organisation pour qu'un retry
-- réseau ne crée jamais deux lignes (donc jamais deux débits) pour la même opération. Créée avant
-- credit_transactions pour que cette dernière puisse y référencer sa ligne source sans dépendance
-- circulaire.
-- ---------------------------------------------------------------------------

create table usage_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid references service_catalog(id), -- null = consommation non rattachée au catalogue
  usage_type text not null, -- ex: 'AI_CALL', 'DOCUMENT_GENERATION'
  quantity integer not null default 1 check (quantity > 0),
  credits_cost integer not null check (credits_cost >= 0),
  idempotency_key text not null,
  recorded_by_user_id uuid not null references users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index usage_records_service_id_idx on usage_records(service_id);

-- ---------------------------------------------------------------------------
-- Historique immuable (append-only) de chaque mouvement de crédit — jamais modifié/supprimé,
-- même esprit que entitlement_grants en Phase A. `amount` est signé (positif = crédit ajouté par
-- un Super Administrateur, négatif = débit de consommation) ; `balance_after` fige le solde
-- résultant pour un affichage d'historique sans recalcul. `idempotency_key` est unique par
-- organisation quand fourni : un retry avec la même clé ne crée jamais une deuxième ligne, donc
-- jamais un deuxième débit — voir debit_credits() en 0049.
-- ---------------------------------------------------------------------------

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  wallet_id uuid not null references credit_wallets(id) on delete cascade,
  transaction_type credit_transaction_type not null,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  usage_record_id uuid references usage_records(id), -- référence vers l'opération source si pertinent
  idempotency_key text,
  performed_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index credit_transactions_wallet_id_idx on credit_transactions(wallet_id);
create index credit_transactions_usage_record_id_idx on credit_transactions(usage_record_id);
create index credit_transactions_organization_id_idx on credit_transactions(organization_id);
-- Index partiel : la contrainte ne porte que sur les transactions qui portent effectivement une
-- clé d'idempotence (les ajouts manuels ADMIN_PLATEFORME n'en ont pas toujours besoin).
create unique index credit_transactions_org_idempotency_key_idx
  on credit_transactions(organization_id, idempotency_key) where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- RLS — lecture par l'organisation concernée uniquement. Aucune policy INSERT/UPDATE/DELETE sur
-- ces quatre tables : toute écriture passe exclusivement par les fonctions SECURITY DEFINER de
-- 0048 (abonnements) et 0049 (crédits/usage), qui portent elles-mêmes les contrôles
-- d'autorisation (ADMIN_PLATEFORME pour l'état commercial, appartenance à l'organisation pour la
-- consommation).
-- ---------------------------------------------------------------------------

alter table organization_subscriptions enable row level security;
alter table credit_wallets enable row level security;
alter table usage_records enable row level security;
alter table credit_transactions enable row level security;

create policy organization_subscriptions_select on organization_subscriptions for select using (can_access_organization(organization_id));
create policy credit_wallets_select on credit_wallets for select using (can_access_organization(organization_id));
create policy usage_records_select on usage_records for select using (can_access_organization(organization_id));
create policy credit_transactions_select on credit_transactions for select using (can_access_organization(organization_id));
