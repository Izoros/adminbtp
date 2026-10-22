-- Tranche A (complément) : pièces d'entreprise datées, groupement de lot, clôture de
-- participation, diffusion ciblée des actes par lot, durcissement de l'allocation sous-traitant.

create type credential_kind as enum ('ASSURANCE_RC', 'ASSURANCE_DECENNALE', 'URSSAF', 'QUALIFICATION', 'AUTRE');
create type credential_status as enum ('VALIDE', 'EXPIRE', 'MANQUANT');

create table organization_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  kind credential_kind not null,
  expires_on date,
  document_id uuid references documents(id),
  status credential_status not null default 'MANQUANT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_credentials_organization_id_idx on organization_credentials(organization_id);
create index organization_credentials_document_id_idx on organization_credentials(document_id);

create trigger organization_credentials_set_updated_at before update on organization_credentials
  for each row execute function set_updated_at();

alter table organization_credentials enable row level security;
create policy organization_credentials_select on organization_credentials for select using (can_access_organization(organization_id));
create policy organization_credentials_insert on organization_credentials for insert with check (can_access_organization(organization_id));
create policy organization_credentials_update on organization_credentials for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));
create policy organization_credentials_delete on organization_credentials for delete using (can_access_organization(organization_id));

-- Groupement titulaire d'un lot (mandataire/cotraitants) — distinct du sous-traitant, qui reste
-- modélisé par site_participants.mission_role = SOUS_TRAITANT.
create type lot_member_role as enum ('MANDATAIRE', 'COTRAITANT', 'TITULAIRE');

create table lot_members (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role lot_member_role not null,
  share_percent numeric check (share_percent >= 0 and share_percent <= 100),
  unique (lot_id, organization_id)
);

create index lot_members_lot_id_idx on lot_members(lot_id);
create index lot_members_organization_id_idx on lot_members(organization_id);

alter table lot_members enable row level security;
create policy lot_members_select on lot_members for select using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy lot_members_insert on lot_members for insert with check (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy lot_members_update on lot_members for update using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
) with check (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy lot_members_delete on lot_members for delete using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);

-- Clôture de participation sans réécriture de l'historique (OS/décomptes référencent le
-- lot/l'organisation, pas la ligne de participation).
alter table site_participants add column left_at timestamptz;

-- Diffusion ciblée : un acte lié à un lot vise le titulaire de ce lot, pas tout le chantier.
alter table documents add column lot_id uuid references lots(id);
create index documents_lot_id_idx on documents(lot_id);

-- Durcissement : une allocation vers un sous-traitant est aussi refusée si une pièce
-- d'entreprise déclarée pour cette organisation est EXPIRE (en plus du DC4/agrément requis).
create or replace function check_subcontractor_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_is_subcontractor boolean;
  v_has_expired_credential boolean;
begin
  select s.site_id into v_site_id from situations s where s.id = new.situation_id;

  select exists (
    select 1 from site_participants sp
    where sp.site_id = v_site_id
      and sp.organization_id = new.payee_organization_id
      and sp.mission_role = 'SOUS_TRAITANT'
      and sp.left_at is null
  ) into v_is_subcontractor;

  if v_is_subcontractor then
    if not has_valid_subcontractor_agreement(v_site_id, new.payee_organization_id) then
      raise exception 'Aucun DC4 ou agrément de sous-traitance VALIDE pour cette organisation sur ce chantier' using errcode = '42501';
    end if;

    select exists (
      select 1 from organization_credentials oc
      where oc.organization_id = new.payee_organization_id and oc.status = 'EXPIRE'
    ) into v_has_expired_credential;

    if v_has_expired_credential then
      raise exception 'Une pièce d''entreprise de ce sous-traitant est expirée' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
