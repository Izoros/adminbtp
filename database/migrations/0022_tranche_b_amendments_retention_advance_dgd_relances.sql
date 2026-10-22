-- Tranche B : avenants, retenue de garantie, avance, DGD, relances tracées.

create type amendment_status as enum ('BROUILLON', 'VALIDE', 'REFUSE');

create table amendments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  lot_id uuid references lots(id),
  number integer not null,
  reason text not null,
  delta_ht numeric not null,
  status amendment_status not null default 'BROUILLON',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by_user_id uuid references users(id)
);

create index amendments_site_id_idx on amendments(site_id);
create index amendments_lot_id_idx on amendments(lot_id);
create index amendments_validated_by_user_id_idx on amendments(validated_by_user_id);

create trigger amendments_set_updated_at before update on amendments
  for each row execute function set_updated_at();

alter table amendments enable row level security;
create policy amendments_select on amendments for select using (can_access_site(site_id));
create policy amendments_insert on amendments for insert with check (can_access_site(site_id));
create policy amendments_update on amendments for update using (can_access_site(site_id)) with check (can_access_site(site_id));

-- Une ligne de prix issue d'un avenant VALIDE est distincte du DPGF d'origine.
alter table price_lines add column amendment_id uuid references amendments(id);
create index price_lines_amendment_id_idx on price_lines(amendment_id);

-- Retenue de garantie et avance — aucune valeur par défaut implicite, tout vient du contrat saisi.
alter table market_contracts
  add column retention_basis_amount_ht numeric check (retention_basis_amount_ht >= 0),
  add column retention_release_due_on date,
  add column retention_substituted_by_caution boolean not null default false,
  add column caution_document_id uuid references documents(id),
  add column advance_amount_ht numeric check (advance_amount_ht >= 0);

-- DGD : situation de solde, document DGD existant s'y rattache — pas un second workflow.
alter table situations add column is_final boolean not null default false;

-- Le solde d'avance ne peut jamais devenir négatif : la somme des advance_recovered de toutes les
-- situations d'un même lot/chantier ne peut pas dépasser le montant d'avance versé sur le contrat
-- correspondant (apparié par site_id + lot_id, au mieux disponible sans contract_id sur situations).
create or replace function check_advance_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_advance_amount numeric;
  v_recovered_total numeric;
begin
  if new.advance_recovered is null or new.advance_recovered = 0 then
    return new;
  end if;

  select advance_amount_ht into v_advance_amount
  from market_contracts
  where site_id = new.site_id
    and (lot_id is not distinct from new.lot_id)
  order by created_at desc
  limit 1;

  if v_advance_amount is null then
    raise exception 'Aucune avance définie sur le contrat de ce lot — impossible de récupérer une avance' using errcode = '42501';
  end if;

  select coalesce(sum(advance_recovered), 0) into v_recovered_total
  from situations
  where site_id = new.site_id
    and (lot_id is not distinct from new.lot_id)
    and id <> new.id;

  v_recovered_total := v_recovered_total + new.advance_recovered;

  if v_recovered_total > v_advance_amount then
    raise exception 'Le solde d''avance ne peut pas devenir négatif (récupération cumulée % > avance versée %)', v_recovered_total, v_advance_amount
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger situations_check_advance_balance
  before insert or update of advance_recovered on situations
  for each row execute function check_advance_balance();

-- Relances — chaque envoi crée une trace (date, canal, situation). Le WhatsApp ne constitue
-- jamais une signature électronique (voir ValidationRecord).
create table reminder_logs (
  id uuid primary key default gen_random_uuid(),
  situation_id uuid not null references situations(id) on delete cascade,
  reminder_rule_id uuid references reminder_rules(id),
  channel reminder_channel not null,
  sent_at timestamptz not null default now(),
  created_by_user_id uuid references users(id)
);

create index reminder_logs_situation_id_idx on reminder_logs(situation_id);
create index reminder_logs_reminder_rule_id_idx on reminder_logs(reminder_rule_id);
create index reminder_logs_created_by_user_id_idx on reminder_logs(created_by_user_id);

alter table reminder_logs enable row level security;
create policy reminder_logs_select on reminder_logs for select using (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);
create policy reminder_logs_insert on reminder_logs for insert with check (
  exists (select 1 from situations s where s.id = situation_id and can_access_site(s.site_id))
);

-- Fonction trigger pure (dépend de NEW) : aucun usage RPC légitime.
revoke execute on function check_advance_balance() from public, anon, authenticated;
