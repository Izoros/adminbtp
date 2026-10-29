-- AdminBTP — Phase D : cycle de vie des abonnements (organization_subscriptions).
--
-- Même pattern que grant_entitlement/suspend_entitlement/reactivate_entitlement/
-- extend_entitlement/revoke_entitlement en 0010 : un seul helper interne _upsert_subscription
-- (aucun contrôle de rôle propre, EXECUTE révoqué de tous les rôles applicatifs ci-dessous) + une
-- fonction publique par action, qui vérifie explicitement
-- current_user_permission_role() = 'ADMIN_PLATEFORME' en première ligne avant tout appel au
-- helper — c'est cette vérification, pas une policy RLS, qui protège l'état commercial, puisque
-- SECURITY DEFINER contourne RLS.
--
-- Pas de table d'historique dédiée façon entitlement_grants : organization_subscriptions porte
-- déjà le statut courant et les dates, et chaque action écrit une ligne audit_log append-only
-- suffisante pour le scope de Phase D.

create or replace function _upsert_subscription(
  p_org_id uuid,
  p_service_id uuid,
  p_new_status subscription_status,
  p_expires_at timestamptz,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_note text,
  p_price_id uuid,
  p_action subscription_action
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_status subscription_status;
  v_actor uuid := current_app_user_id();
begin
  select status into v_previous_status
  from organization_subscriptions
  where organization_id = p_org_id and service_id = p_service_id;

  insert into organization_subscriptions (
    organization_id, service_id, status, price_id, activated_by_user_id, activated_at,
    current_period_start, current_period_end, expires_at, notes
  ) values (
    p_org_id, p_service_id, p_new_status, p_price_id, v_actor, now(),
    p_current_period_start, p_current_period_end, p_expires_at, p_note
  )
  on conflict (organization_id, service_id) do update set
    status = p_new_status,
    price_id = coalesce(p_price_id, organization_subscriptions.price_id),
    activated_by_user_id = case when p_action in ('ACTIVATE', 'REACTIVATE') then v_actor else organization_subscriptions.activated_by_user_id end,
    activated_at = case when p_action in ('ACTIVATE', 'REACTIVATE') then now() else organization_subscriptions.activated_at end,
    current_period_start = coalesce(p_current_period_start, organization_subscriptions.current_period_start),
    current_period_end = coalesce(p_current_period_end, organization_subscriptions.current_period_end),
    expires_at = case when p_action in ('ACTIVATE', 'REACTIVATE', 'EXTEND') then p_expires_at else organization_subscriptions.expires_at end,
    notes = coalesce(p_note, organization_subscriptions.notes),
    cancelled_at = case when p_action = 'CANCEL' then now() else null end,
    cancelled_by_user_id = case when p_action = 'CANCEL' then v_actor else null end,
    cancel_reason = case when p_action = 'CANCEL' then p_note else null end,
    updated_at = now();

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (
    p_org_id, v_actor, 'USER', 'subscription.' || lower(p_action::text), 'organization_subscriptions',
    p_service_id::text, jsonb_build_object('previous_status', v_previous_status, 'new_status', p_new_status, 'note', p_note)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Fonctions publiques — chacune vérifie explicitement ADMIN_PLATEFORME avant toute écriture.
-- ---------------------------------------------------------------------------

create or replace function activate_subscription(
  p_organization_id uuid, p_service_id uuid, p_expires_at timestamptz default null,
  p_current_period_start timestamptz default null, p_current_period_end timestamptz default null,
  p_note text default null, p_price_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut activer un abonnement' using errcode = '42501';
  end if;
  perform _upsert_subscription(p_organization_id, p_service_id, 'ACTIVE'::subscription_status, p_expires_at, p_current_period_start, p_current_period_end, p_note, p_price_id, 'ACTIVATE'::subscription_action);
end;
$$;

create or replace function suspend_subscription(
  p_organization_id uuid, p_service_id uuid, p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut suspendre un abonnement' using errcode = '42501';
  end if;
  perform _upsert_subscription(p_organization_id, p_service_id, 'SUSPENDED'::subscription_status, null, null, null, p_note, null, 'SUSPEND'::subscription_action);
end;
$$;

create or replace function reactivate_subscription(
  p_organization_id uuid, p_service_id uuid, p_expires_at timestamptz default null, p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut réactiver un abonnement' using errcode = '42501';
  end if;
  perform _upsert_subscription(p_organization_id, p_service_id, 'ACTIVE'::subscription_status, p_expires_at, null, null, p_note, null, 'REACTIVATE'::subscription_action);
end;
$$;

create or replace function extend_subscription(
  p_organization_id uuid, p_service_id uuid, p_new_expires_at timestamptz,
  p_new_current_period_end timestamptz default null, p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut prolonger un abonnement' using errcode = '42501';
  end if;
  perform _upsert_subscription(p_organization_id, p_service_id, 'ACTIVE'::subscription_status, p_new_expires_at, null, p_new_current_period_end, p_note, null, 'EXTEND'::subscription_action);
end;
$$;

create or replace function cancel_subscription(
  p_organization_id uuid, p_service_id uuid, p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut annuler un abonnement' using errcode = '42501';
  end if;
  perform _upsert_subscription(p_organization_id, p_service_id, 'CANCELLED'::subscription_status, null, null, null, p_reason, null, 'CANCEL'::subscription_action);
end;
$$;

-- ---------------------------------------------------------------------------
-- Vérification faisant foi d'un abonnement actif et non expiré — utilisée par record_usage() en
-- 0049 et réutilisable par toute future policy/vérification applicative, même forme que
-- has_entitlement() en Phase A. Un service sans ligne organization_subscriptions n'est pas
-- "abonné" : cette fonction renvoie alors false, ce qui n'empêche pas une consommation sur crédits
-- prépayés seuls (vérifiée indépendamment par debit_credits() en 0049).
-- ---------------------------------------------------------------------------

create or replace function is_subscription_active(target_org_id uuid, target_service_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_subscriptions
    where organization_id = target_org_id
      and service_id = target_service_id
      and status = 'ACTIVE'
      and (expires_at is null or expires_at > now())
  );
$$;

-- Le helper interne n'a aucune vérification de rôle propre : jamais appelable en RPC direct.
revoke execute on function _upsert_subscription(uuid, uuid, subscription_status, timestamptz, timestamptz, timestamptz, text, uuid, subscription_action) from public, anon, authenticated;

-- Fonctions publiques : réservées aux utilisateurs connectés (voir 0033, règle à conserver pour
-- toute nouvelle fonction SECURITY DEFINER — révoquer explicitement de public/anon, puis accorder
-- à authenticated, chaque fonction vérifiant ensuite le rôle en interne).
revoke execute on function activate_subscription(uuid, uuid, timestamptz, timestamptz, timestamptz, text, uuid) from public, anon;
revoke execute on function suspend_subscription(uuid, uuid, text) from public, anon;
revoke execute on function reactivate_subscription(uuid, uuid, timestamptz, text) from public, anon;
revoke execute on function extend_subscription(uuid, uuid, timestamptz, timestamptz, text) from public, anon;
revoke execute on function cancel_subscription(uuid, uuid, text) from public, anon;
revoke execute on function is_subscription_active(uuid, uuid) from public, anon;

grant execute on function activate_subscription(uuid, uuid, timestamptz, timestamptz, timestamptz, text, uuid) to authenticated;
grant execute on function suspend_subscription(uuid, uuid, text) to authenticated;
grant execute on function reactivate_subscription(uuid, uuid, timestamptz, text) to authenticated;
grant execute on function extend_subscription(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function cancel_subscription(uuid, uuid, text) to authenticated;
grant execute on function is_subscription_active(uuid, uuid) to authenticated;
