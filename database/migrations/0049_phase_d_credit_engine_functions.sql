-- AdminBTP — Phase D : moteur de crédits prépayés.
--
-- Deux familles de fonctions SECURITY DEFINER, avec deux régimes d'autorisation différents :
--   - add_credits() : geste commercial (contrepartie en crédits d'un achat — le paiement réel est
--     hors Phase D, voir docs/ROADMAP.md Phase E/7). Réservé à ADMIN_PLATEFORME, même pattern que
--     grant_entitlement/activate_subscription : vérification explicite en première ligne.
--   - debit_credits() / record_usage() : consommation d'une fonctionnalité payante par un membre
--     ordinaire de l'organisation (ce n'est pas une mutation de l'état commercial — l'accès a déjà
--     été accordé par un Super Administrateur en amont). Ouvertes à authenticated, protégées par
--     can_access_organization() : un utilisateur ne peut débiter que le portefeuille de sa propre
--     organisation.
--
-- Toute écriture sur credit_wallets/credit_transactions/usage_records passe exclusivement par ces
-- fonctions (voir 0046 : aucune policy INSERT/UPDATE sur ces tables).

-- ---------------------------------------------------------------------------
-- Ajout de crédits — réservé à ADMIN_PLATEFORME. Crée le portefeuille de l'organisation s'il
-- n'existe pas encore.
-- ---------------------------------------------------------------------------

create or replace function add_credits(
  p_organization_id uuid,
  p_amount integer,
  p_reason text,
  p_wallet_expires_at timestamptz default null
) returns credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet credit_wallets;
  v_actor uuid := current_app_user_id();
  v_new_balance integer;
  v_transaction credit_transactions;
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut créditer un portefeuille' using errcode = '42501';
  end if;

  if p_amount <= 0 then
    raise exception 'Le montant à créditer doit être strictement positif' using errcode = '22023';
  end if;

  insert into credit_wallets (organization_id, balance, expires_at)
  values (p_organization_id, 0, p_wallet_expires_at)
  on conflict (organization_id) do update set
    expires_at = coalesce(p_wallet_expires_at, credit_wallets.expires_at);

  -- Verrou de ligne : sérialise cet ajout avec tout débit/ajout concurrent sur la même
  -- organisation avant de lire puis d'écrire le solde.
  select * into v_wallet from credit_wallets where organization_id = p_organization_id for update;

  v_new_balance := v_wallet.balance + p_amount;

  update credit_wallets set balance = v_new_balance, updated_at = now() where id = v_wallet.id;

  insert into credit_transactions (
    organization_id, wallet_id, transaction_type, amount, balance_after, reason, performed_by_user_id
  ) values (
    p_organization_id, v_wallet.id, 'TOPUP', p_amount, v_new_balance, p_reason, v_actor
  ) returning * into v_transaction;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (p_organization_id, v_actor, 'USER', 'credit.topup', 'credit_transactions', v_transaction.id::text,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'balance_after', v_new_balance));

  return v_transaction;
end;
$$;

-- ---------------------------------------------------------------------------
-- Débit de crédits — fonction centrale, appelée directement ou via record_usage() ci-dessous.
-- Idempotente (une clé d'idempotence unique par organisation ne débite jamais deux fois),
-- transactionnelle (débit + ligne credit_transactions dans la même transaction : toute exception
-- avant le `return` annule aussi la mise à jour du solde), et refuse tout débit qui mettrait le
-- solde en négatif.
-- ---------------------------------------------------------------------------

create or replace function debit_credits(
  p_organization_id uuid,
  p_amount integer,
  p_reason text,
  p_idempotency_key text,
  p_usage_record_id uuid default null
) returns credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet credit_wallets;
  v_existing credit_transactions;
  v_actor uuid := current_app_user_id();
  v_new_balance integer;
  v_transaction credit_transactions;
begin
  if not can_access_organization(p_organization_id) then
    raise exception 'Organisation non accessible' using errcode = '42501';
  end if;

  if p_amount <= 0 then
    raise exception 'Le montant à débiter doit être strictement positif' using errcode = '22023';
  end if;

  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'Une clé d''idempotence est obligatoire pour tout débit de crédits' using errcode = '22023';
  end if;

  -- Verrou de ligne pris avant la vérification d'idempotence : sérialise tous les débits
  -- concurrents d'une même organisation, condition nécessaire pour que cette vérification soit
  -- fiable (un retry simultané ne peut jamais passer deux fois le contrôle "clé déjà vue").
  select * into v_wallet from credit_wallets where organization_id = p_organization_id for update;
  if not found then
    raise exception 'Aucun portefeuille de crédits pour cette organisation' using errcode = '42501';
  end if;

  select * into v_existing from credit_transactions
  where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
  if found then
    -- Idempotence : un retry avec la même clé renvoie la transaction déjà créée, sans débiter une
    -- deuxième fois.
    return v_existing;
  end if;

  if v_wallet.expires_at is not null and v_wallet.expires_at <= now() then
    raise exception 'Le portefeuille de crédits de cette organisation a expiré' using errcode = '42501';
  end if;

  if v_wallet.balance < p_amount then
    raise exception 'Solde de crédits insuffisant (solde %, débit demandé %)', v_wallet.balance, p_amount using errcode = '42501';
  end if;

  v_new_balance := v_wallet.balance - p_amount;

  update credit_wallets set balance = v_new_balance, updated_at = now() where id = v_wallet.id;

  insert into credit_transactions (
    organization_id, wallet_id, transaction_type, amount, balance_after, reason,
    usage_record_id, idempotency_key, performed_by_user_id
  ) values (
    p_organization_id, v_wallet.id, 'DEBIT', -p_amount, v_new_balance, p_reason,
    p_usage_record_id, p_idempotency_key, v_actor
  ) returning * into v_transaction;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (p_organization_id, v_actor, 'USER', 'credit.debit', 'credit_transactions', v_transaction.id::text,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'balance_after', v_new_balance));

  return v_transaction;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enregistrement d'une consommation mesurée (ex: appel IA, génération de document) + débit
-- associé. Orchestre usage_records et debit_credits dans une seule transaction : si le débit
-- échoue (solde insuffisant, portefeuille expiré...), l'exception annule aussi l'insertion dans
-- usage_records — jamais l'un sans l'autre. Idempotente de bout en bout : un retry avec la même
-- clé renvoie la ligne usage_records déjà créée sans jamais rappeler debit_credits.
-- ---------------------------------------------------------------------------

create or replace function record_usage(
  p_organization_id uuid,
  p_service_id uuid,
  p_usage_type text,
  p_credits_cost integer,
  p_idempotency_key text,
  p_quantity integer default 1,
  p_metadata jsonb default '{}'::jsonb
) returns usage_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := current_app_user_id();
  v_usage usage_records;
begin
  if not can_access_organization(p_organization_id) then
    raise exception 'Organisation non accessible' using errcode = '42501';
  end if;

  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'Une clé d''idempotence est obligatoire pour toute consommation' using errcode = '22023';
  end if;

  if p_credits_cost < 0 then
    raise exception 'Le coût en crédits ne peut pas être négatif' using errcode = '22023';
  end if;

  -- Idempotence : un retry avec la même clé renvoie la ligne déjà enregistrée sans jamais
  -- ré-exécuter le débit ci-dessous.
  select * into v_usage from usage_records
  where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
  if found then
    return v_usage;
  end if;

  -- Un abonnement expiré ou inactif sur ce service bloque toute nouvelle consommation, même si
  -- l'organisation dispose encore de crédits — vérifié ici, pas seulement côté UI. Un service sans
  -- ligne d'abonnement (consommation sur crédits prépayés seuls) n'est pas concerné par ce
  -- contrôle.
  if p_service_id is not null
     and exists (select 1 from organization_subscriptions where organization_id = p_organization_id and service_id = p_service_id)
     and not is_subscription_active(p_organization_id, p_service_id) then
    raise exception 'Abonnement expiré ou inactif pour ce service — consommation refusée' using errcode = '42501';
  end if;

  insert into usage_records (
    organization_id, service_id, usage_type, quantity, credits_cost, idempotency_key,
    recorded_by_user_id, metadata
  ) values (
    p_organization_id, p_service_id, p_usage_type, p_quantity, p_credits_cost, p_idempotency_key,
    v_actor, p_metadata
  )
  on conflict (organization_id, idempotency_key) do nothing
  returning * into v_usage;

  if v_usage.id is null then
    -- Un appel concurrent portant la même clé a gagné la course d'insertion : on relit sa ligne
    -- plutôt que de débiter une deuxième fois.
    select * into v_usage from usage_records
    where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
    return v_usage;
  end if;

  if p_credits_cost > 0 then
    perform debit_credits(p_organization_id, p_credits_cost, 'Consommation : ' || p_usage_type, p_idempotency_key, v_usage.id);
  end if;

  return v_usage;
end;
$$;

-- Fonctions publiques : réservées aux utilisateurs connectés (voir 0033, règle à conserver pour
-- toute nouvelle fonction SECURITY DEFINER — révoquer explicitement de public/anon, puis accorder
-- à authenticated, chaque fonction vérifiant ensuite le rôle/l'appartenance en interne).
revoke execute on function add_credits(uuid, integer, text, timestamptz) from public, anon;
revoke execute on function debit_credits(uuid, integer, text, text, uuid) from public, anon;
revoke execute on function record_usage(uuid, uuid, text, integer, text, integer, jsonb) from public, anon;

grant execute on function add_credits(uuid, integer, text, timestamptz) to authenticated;
grant execute on function debit_credits(uuid, integer, text, text, uuid) to authenticated;
grant execute on function record_usage(uuid, uuid, text, integer, text, integer, jsonb) to authenticated;
