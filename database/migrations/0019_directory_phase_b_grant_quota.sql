-- Permet de fixer un quota (voir organization_entitlements.access_quota, Phase B annuaire) au
-- moment de l'octroi — paramètre additif par défaut null, rétrocompatible avec les appels
-- existants de grant_entitlement depuis la Phase A.

create or replace function _upsert_entitlement(
  p_org_id uuid,
  p_service_id uuid,
  p_new_status entitlement_status,
  p_expires_at timestamptz,
  p_note text,
  p_price_id uuid,
  p_source_request_id uuid,
  p_action entitlement_action,
  p_access_quota integer default null
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
    expires_at, source_access_request_id, notes, access_quota
  ) values (
    p_org_id, p_service_id, p_new_status, p_price_id, v_actor, now(),
    p_expires_at, p_source_request_id, p_note, p_access_quota
  )
  on conflict (organization_id, service_id) do update set
    status = p_new_status,
    price_id = coalesce(p_price_id, organization_entitlements.price_id),
    granted_by_user_id = case when p_action in ('GRANT', 'REACTIVATE') then v_actor else organization_entitlements.granted_by_user_id end,
    granted_at = case when p_action in ('GRANT', 'REACTIVATE') then now() else organization_entitlements.granted_at end,
    expires_at = case when p_action in ('GRANT', 'REACTIVATE', 'EXTEND') then p_expires_at else organization_entitlements.expires_at end,
    notes = coalesce(p_note, organization_entitlements.notes),
    access_quota = case when p_action in ('GRANT', 'REACTIVATE') then p_access_quota else organization_entitlements.access_quota end,
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

create or replace function grant_entitlement(
  p_organization_id uuid, p_service_id uuid, p_expires_at timestamptz default null,
  p_note text default null, p_price_id uuid default null, p_access_quota integer default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut accorder un entitlement' using errcode = '42501';
  end if;
  perform _upsert_entitlement(p_organization_id, p_service_id, 'ACTIVE'::entitlement_status, p_expires_at, p_note, p_price_id, null, 'GRANT'::entitlement_action, p_access_quota);
end;
$$;
