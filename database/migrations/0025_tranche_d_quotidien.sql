-- Tranche D : classement de mail (via tables existantes), relances internes paramétrées par
-- chantier, préfiltre du catalogue de modèles par profil.

alter table sites add column internal_reminder_days integer not null default 7 check (internal_reminder_days > 0);

alter table document_templates
  add column audience_legal_kind legal_kind,
  add column audience_trade_code text references trade_codes(code);

-- Relances internes — scanne trois conditions et crée une tâche AUTOMATISATION par cas détecté,
-- idempotent (ne duplique pas une tâche déjà créée et non clôturée pour la même source). N vient
-- de sites.internal_reminder_days, jamais une constante UI.
create or replace function check_internal_reminders(p_site_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_reminder_days integer;
  v_created integer := 0;
  v_rec record;
begin
  if not can_access_site(p_site_id) then
    raise exception 'Chantier non accessible' using errcode = '42501';
  end if;

  select organization_id, internal_reminder_days into v_organization_id, v_reminder_days
  from sites where id = p_site_id;

  -- 1. Visa en attente depuis plus de N jours.
  for v_rec in
    select ps.id, ps.document_id, d.title
    from plan_submissions ps
    join documents d on d.id = ps.document_id
    where ps.site_id = p_site_id
      and ps.status = 'DEPOSE'
      and ps.created_at < now() - make_interval(days => v_reminder_days)
      and not exists (
        select 1 from tasks t
        where t.source_type = 'AUTOMATISATION' and t.source_id = ps.id
          and t.status not in ('FAIT', 'ANNULE')
      )
  loop
    insert into tasks (organization_id, site_id, title, status, priority, source_type, source_id)
    values (v_organization_id, p_site_id, 'Visa en attente depuis plus de ' || v_reminder_days || ' jours : ' || v_rec.title, 'A_FAIRE', 'HAUTE', 'AUTOMATISATION', v_rec.id);
    v_created := v_created + 1;
  end loop;

  -- 2. Situation due non transmise.
  for v_rec in
    select s.id, s.number
    from situations s
    where s.site_id = p_site_id
      and s.status = 'A_ETABLIR'
      and s.due_date is not null
      and s.due_date < current_date
      and not exists (
        select 1 from tasks t
        where t.source_type = 'AUTOMATISATION' and t.source_id = s.id
          and t.status not in ('FAIT', 'ANNULE')
      )
  loop
    insert into tasks (organization_id, site_id, title, status, priority, source_type, source_id)
    values (v_organization_id, p_site_id, 'Situation n°' || v_rec.number || ' due et non transmise', 'A_FAIRE', 'HAUTE', 'AUTOMATISATION', v_rec.id);
    v_created := v_created + 1;
  end loop;

  -- 3. Pièce d'agrément manquante pour un sous-traitant actif.
  for v_rec in
    select sp.id, sp.organization_id, o.name
    from site_participants sp
    join organizations o on o.id = sp.organization_id
    where sp.site_id = p_site_id
      and sp.mission_role = 'SOUS_TRAITANT'
      and sp.left_at is null
      and not has_valid_subcontractor_agreement(p_site_id, sp.organization_id)
      and not exists (
        select 1 from tasks t
        where t.source_type = 'AUTOMATISATION' and t.source_id = sp.id
          and t.status not in ('FAIT', 'ANNULE')
      )
  loop
    insert into tasks (organization_id, site_id, title, status, priority, source_type, source_id)
    values (v_organization_id, p_site_id, 'Pièce d''agrément manquante : ' || v_rec.name, 'A_FAIRE', 'HAUTE', 'AUTOMATISATION', v_rec.id);
    v_created := v_created + 1;
  end loop;

  return v_created;
end;
$$;
