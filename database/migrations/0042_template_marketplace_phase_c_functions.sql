-- AdminBTP — Phase C : flux d'achat (demande → approbation ADMIN_PLATEFORME) et vérification
-- d'accès à la génération.
--
-- Réutilise sans modification cancel_access_request() et reject_access_request() (Phase A,
-- migration 0010) : ces deux fonctions sont déjà génériques (elles opèrent sur n'importe quelle
-- ligne access_requests PENDING) et n'ont besoin d'aucune distinction entre une demande de
-- service générique et une demande d'achat de modèle premium. Seules l'approbation (qui doit
-- créer template_purchases, jamais organization_entitlements) et la vérification de génération
-- sont spécifiques à cette phase.

create or replace function request_template_purchase(
  p_organization_id uuid, p_template_catalog_id uuid, p_message text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := current_app_user_id();
  v_request_id uuid;
  v_service_id uuid;
begin
  if not can_access_organization(p_organization_id) then
    raise exception 'Organisation non accessible' using errcode = '42501';
  end if;

  select sc.id into v_service_id
  from document_template_catalog dtc
  join service_catalog sc on sc.code = dtc.service_code
  where dtc.id = p_template_catalog_id and dtc.is_active;
  if v_service_id is null then
    raise exception 'Modèle introuvable ou retiré du catalogue';
  end if;

  if has_template_purchase(p_organization_id, p_template_catalog_id) then
    raise exception 'Ce modèle est déjà acheté par cette organisation';
  end if;

  insert into access_requests (
    organization_id, service_id, document_template_catalog_id, requested_by_user_id, status, message
  ) values (
    p_organization_id, v_service_id, p_template_catalog_id, v_actor, 'PENDING', p_message
  )
  returning id into v_request_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (
    p_organization_id, v_actor, 'USER', 'template_purchase.request', 'access_requests', v_request_id::text,
    jsonb_build_object('template_catalog_id', p_template_catalog_id)
  );

  return v_request_id;
end;
$$;

-- Seul ADMIN_PLATEFORME peut approuver un achat (vérification explicite en première instruction
-- — SECURITY DEFINER contourne RLS, donc c'est la seule protection réelle, même raisonnement que
-- grant_entitlement() en Phase A). Crée (ou met à jour, si l'organisation avait déjà acheté une
-- version antérieure du même modèle) la ligne template_purchases en pointant vers la version la
-- plus récente disponible au moment de l'approbation.
create or replace function approve_template_purchase_request(
  p_request_id uuid, p_admin_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_actor uuid := current_app_user_id();
  v_version_id uuid;
begin
  if current_user_permission_role() is distinct from 'ADMIN_PLATEFORME' then
    raise exception 'Seul un Super Administrateur peut approuver un achat de modèle' using errcode = '42501';
  end if;

  select * into v_request from access_requests where id = p_request_id for update;
  if not found then
    raise exception 'Demande introuvable';
  end if;
  if v_request.document_template_catalog_id is null then
    raise exception 'Cette demande ne concerne pas un achat de modèle premium';
  end if;
  if v_request.status <> 'PENDING' then
    raise exception 'Cette demande a déjà été traitée';
  end if;

  select id into v_version_id
  from template_versions
  where template_catalog_id = v_request.document_template_catalog_id
  order by version_number desc
  limit 1;
  if v_version_id is null then
    raise exception 'Aucune version disponible pour ce modèle';
  end if;

  insert into template_purchases (
    organization_id, template_catalog_id, version_id, purchased_by_user_id, source_access_request_id, note
  ) values (
    v_request.organization_id, v_request.document_template_catalog_id, v_version_id, v_actor, p_request_id, p_admin_note
  )
  on conflict (organization_id, template_catalog_id) do update set
    version_id = excluded.version_id,
    purchased_by_user_id = excluded.purchased_by_user_id,
    purchased_at = now(),
    source_access_request_id = excluded.source_access_request_id,
    note = coalesce(excluded.note, template_purchases.note);

  update access_requests
  set status = 'APPROVED', admin_decision_by_user_id = v_actor, admin_decision_at = now(), admin_note = p_admin_note
  where id = p_request_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (
    v_request.organization_id, v_actor, 'USER', 'template_purchase.approve', 'template_purchases',
    v_request.document_template_catalog_id::text,
    jsonb_build_object('version_id', v_version_id, 'request_id', p_request_id)
  );
end;
$$;

-- Vérification explicite appelée par la Server Action avant toute génération à partir d'un modèle
-- premium (apps/web/src/lib/actions/documents.ts::generateDocumentFromPremiumTemplate) — défense
-- en profondeur, même principe que get_directory_company_detail() en Phase B : revérifie l'achat
-- indépendamment de la policy RLS SELECT déjà posée sur template_versions, et retourne
-- exactement la version achetée par cette organisation (jamais une version plus récente non
-- payée, jamais celle d'une autre organisation).
create or replace function get_purchased_template_version(p_organization_id uuid, p_template_catalog_id uuid)
returns table (
  version_id uuid,
  template_catalog_id uuid,
  name text,
  category document_category,
  file_url text,
  variables text[],
  requires_expert_review boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_access_organization(p_organization_id) then
    raise exception 'Organisation non accessible' using errcode = '42501';
  end if;
  if not has_template_purchase(p_organization_id, p_template_catalog_id) then
    raise exception 'Ce modèle n''a pas été acheté par cette organisation' using errcode = '42501';
  end if;

  return query
    select tv.id, dtc.id, dtc.name, dtc.category, tv.file_url, tv.variables, tv.requires_expert_review
    from template_purchases tp
    join template_versions tv on tv.id = tp.version_id
    join document_template_catalog dtc on dtc.id = tp.template_catalog_id
    where tp.organization_id = p_organization_id
      and tp.template_catalog_id = p_template_catalog_id;
end;
$$;

-- Durcissement 0033 (oublié dans le reste de cette migration) : révoquer public/anon, accorder
-- explicitement authenticated.
revoke execute on function request_template_purchase(uuid, uuid, text) from public, anon;
revoke execute on function approve_template_purchase_request(uuid, text) from public, anon;
revoke execute on function get_purchased_template_version(uuid, uuid) from public, anon;

grant execute on function request_template_purchase(uuid, uuid, text) to authenticated;
grant execute on function approve_template_purchase_request(uuid, text) to authenticated;
grant execute on function get_purchased_template_version(uuid, uuid) to authenticated;
