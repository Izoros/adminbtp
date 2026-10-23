-- Suppression a posteriori d'une entrée de journal, d'une réserve ou d'un compte-rendu (voir
-- docs/ROADMAP.md). Suppression douce : la ligne reste en base, masquée des écrans, avec auteur,
-- date et motif obligatoire, et une trace dans audit_log. Le journal et les CR servent de preuve en
-- cas de litige : rien n'est effacé physiquement.
--
-- Les trois suppressions passent par des fonctions SECURITY DEFINER (comme les entitlements, voir
-- 0010) : tout est fait en une transaction, et la suppression d'un CR doit pouvoir annuler des
-- tâches assignées à une autre organisation que celle de l'utilisateur, et marquer un CR VALIDE
-- que la policy meeting_notes_update (0031) ne laisse plus modifier.

alter table site_log_entries
  add column deleted_at timestamptz,
  add column deleted_by_user_id uuid references users(id),
  add column deletion_reason text,
  add constraint site_log_entries_deletion_consistency check (
    (deleted_at is null and deleted_by_user_id is null and deletion_reason is null)
    or (deleted_at is not null and deleted_by_user_id is not null and deletion_reason is not null)
  );

alter table reserve_items
  add column deleted_at timestamptz,
  add column deleted_by_user_id uuid references users(id),
  add column deletion_reason text,
  add constraint reserve_items_deletion_consistency check (
    (deleted_at is null and deleted_by_user_id is null and deletion_reason is null)
    or (deleted_at is not null and deleted_by_user_id is not null and deletion_reason is not null)
  );

alter table meeting_notes
  add column deleted_at timestamptz,
  add column deleted_by_user_id uuid references users(id),
  add column deletion_reason text,
  add constraint meeting_notes_deletion_consistency check (
    (deleted_at is null and deleted_by_user_id is null and deletion_reason is null)
    or (deleted_at is not null and deleted_by_user_id is not null and deletion_reason is not null)
  );

create index site_log_entries_deleted_by_user_id_idx on site_log_entries(deleted_by_user_id);
create index reserve_items_deleted_by_user_id_idx on reserve_items(deleted_by_user_id);
create index meeting_notes_deleted_by_user_id_idx on meeting_notes(deleted_by_user_id);

-- ---------------------------------------------------------------------------
-- Garde-fou : un client (rôles anon/authenticated) ne peut ni poser ni retirer les colonnes de
-- suppression par un UPDATE direct, ni modifier une ligne déjà supprimée. Seules les fonctions
-- ci-dessous (exécutées sous le rôle propriétaire) le peuvent.
-- ---------------------------------------------------------------------------

create or replace function _guard_soft_delete_columns() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if old.deleted_at is not null then
      raise exception 'Cet élément a été supprimé : il ne peut plus être modifié.' using errcode = '42501';
    end if;
    if new.deleted_at is distinct from old.deleted_at
      or new.deleted_by_user_id is distinct from old.deleted_by_user_id
      or new.deletion_reason is distinct from old.deletion_reason then
      raise exception 'La suppression passe obligatoirement par la fonction dédiée.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger site_log_entries_guard_soft_delete before update on site_log_entries
  for each row execute function _guard_soft_delete_columns();
create trigger reserve_items_guard_soft_delete before update on reserve_items
  for each row execute function _guard_soft_delete_columns();
create trigger meeting_notes_guard_soft_delete before update on meeting_notes
  for each row execute function _guard_soft_delete_columns();

revoke execute on function _guard_soft_delete_columns() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions publiques — chacune vérifie explicitement l'accès au chantier avant toute écriture
-- (SECURITY DEFINER contourne RLS : ce contrôle explicite est la seule protection réelle).
-- ---------------------------------------------------------------------------

-- Une entrée citée comme motif d'un document, d'un avenant ou d'un point d'ordre du jour d'un CR
-- non supprimé reste une preuve en usage : elle ne peut pas être supprimée.
create or replace function soft_delete_site_log_entry(p_entry_id uuid, p_reason text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_org_id uuid;
  v_actor uuid := current_app_user_id();
  v_reason text := nullif(trim(p_reason), '');
begin
  if v_reason is null then
    raise exception 'Le motif de suppression est obligatoire.' using errcode = '22023';
  end if;

  select e.site_id, s.organization_id into v_site_id, v_org_id
  from site_log_entries e join sites s on s.id = e.site_id
  where e.id = p_entry_id and e.deleted_at is null
  for update of e;
  if v_site_id is null or not can_access_site(v_site_id) then
    raise exception 'Entrée de journal introuvable ou déjà supprimée.' using errcode = 'P0002';
  end if;

  if exists (select 1 from documents d where d.source_log_entry_id = p_entry_id)
    or exists (select 1 from amendments a where a.source_log_entry_id = p_entry_id)
    or exists (
      select 1 from meeting_agenda_items ai join meeting_notes m on m.id = ai.meeting_id
      where ai.source_log_entry_id = p_entry_id and m.deleted_at is null
    ) then
    raise exception 'Cette entrée est citée par un document, un avenant ou un compte-rendu : elle ne peut pas être supprimée.'
      using errcode = '23503';
  end if;

  update site_log_entries
  set deleted_at = now(), deleted_by_user_id = v_actor, deletion_reason = v_reason
  where id = p_entry_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (v_org_id, v_actor, 'USER', 'site_log_entry.soft_delete', 'site_log_entries', p_entry_id::text,
    jsonb_build_object('site_id', v_site_id, 'reason', v_reason));
end;
$$;

create or replace function soft_delete_reserve_item(p_reserve_id uuid, p_reason text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_org_id uuid;
  v_actor uuid := current_app_user_id();
  v_reason text := nullif(trim(p_reason), '');
begin
  if v_reason is null then
    raise exception 'Le motif de suppression est obligatoire.' using errcode = '22023';
  end if;

  select r.site_id, s.organization_id into v_site_id, v_org_id
  from reserve_items r join sites s on s.id = r.site_id
  where r.id = p_reserve_id and r.deleted_at is null
  for update of r;
  if v_site_id is null or not can_access_site(v_site_id) then
    raise exception 'Réserve introuvable ou déjà supprimée.' using errcode = 'P0002';
  end if;

  update reserve_items
  set deleted_at = now(), deleted_by_user_id = v_actor, deletion_reason = v_reason
  where id = p_reserve_id;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (v_org_id, v_actor, 'USER', 'reserve_item.soft_delete', 'reserve_items', p_reserve_id::text,
    jsonb_build_object('site_id', v_site_id, 'reason', v_reason));
end;
$$;

-- Réservée, comme la création et la validation, à une organisation OPC ou MOE active sur le
-- chantier (p_organization_id, dont l'utilisateur doit être membre). Les tâches nées des décisions
-- du CR et encore ouvertes passent en ANNULE ; celles déjà faites ou annulées ne bougent pas.
-- Renvoie le nombre de tâches annulées.
create or replace function soft_delete_meeting_note(
  p_meeting_id uuid, p_organization_id uuid, p_reason text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_org_id uuid;
  v_status meeting_status;
  v_actor uuid := current_app_user_id();
  v_reason text := nullif(trim(p_reason), '');
  v_cancelled_task_ids uuid[];
begin
  if v_reason is null then
    raise exception 'Le motif de suppression est obligatoire.' using errcode = '22023';
  end if;

  select m.site_id, s.organization_id, m.status into v_site_id, v_org_id, v_status
  from meeting_notes m join sites s on s.id = m.site_id
  where m.id = p_meeting_id and m.deleted_at is null
  for update of m;
  if v_site_id is null or not can_access_site(v_site_id) then
    raise exception 'Compte-rendu introuvable ou déjà supprimé.' using errcode = 'P0002';
  end if;

  if not can_access_organization(p_organization_id) or not exists (
    select 1 from site_participants sp
    where sp.site_id = v_site_id and sp.organization_id = p_organization_id
      and sp.mission_role in ('OPC', 'MOE') and sp.left_at is null
  ) then
    raise exception 'Seule une organisation avec le rôle OPC ou MOE actif sur ce chantier peut supprimer un compte-rendu.'
      using errcode = '42501';
  end if;

  update meeting_notes
  set deleted_at = now(), deleted_by_user_id = v_actor, deletion_reason = v_reason
  where id = p_meeting_id;

  with cancelled as (
    update tasks
    set status = 'ANNULE'
    where source_type = 'MEETING' and source_id = p_meeting_id
      and status in ('A_FAIRE', 'EN_COURS', 'EN_ATTENTE')
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_cancelled_task_ids from cancelled;

  insert into audit_log (organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata)
  values (v_org_id, v_actor, 'USER', 'meeting_note.soft_delete', 'meeting_notes', p_meeting_id::text,
    jsonb_build_object(
      'site_id', v_site_id, 'reason', v_reason, 'status', v_status,
      'organization_id', p_organization_id, 'cancelled_task_ids', to_jsonb(v_cancelled_task_ids)
    ));

  return coalesce(array_length(v_cancelled_task_ids, 1), 0);
end;
$$;

revoke execute on function soft_delete_site_log_entry(uuid, text) from public, anon;
revoke execute on function soft_delete_reserve_item(uuid, text) from public, anon;
revoke execute on function soft_delete_meeting_note(uuid, uuid, text) from public, anon;
grant execute on function soft_delete_site_log_entry(uuid, text) to authenticated;
grant execute on function soft_delete_reserve_item(uuid, text) to authenticated;
grant execute on function soft_delete_meeting_note(uuid, uuid, text) to authenticated;
