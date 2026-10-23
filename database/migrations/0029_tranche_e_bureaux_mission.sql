-- Tranche E : bureaux de mission (OPC, CT, SPS, BET) — voir docs/ROADMAP.md.
-- Généralise meeting_notes/meeting_attendees/meeting_decisions (posés en 0023) au lieu de créer
-- un second objet. Pas d'application séparée, pas de déploiement distinct.

-- Nouveaux rôles chantier — jamais fusionnés avec MOE/OPC, aucun droit plateforme implicite.
-- Pas de littéral CT/SPS/CSSI utilisé plus loin dans cette même migration : ADD VALUE seul évite
-- l'écueil "unsafe use of new value of enum type" dans la même transaction.
alter type mission_role add value if not exists 'CT';
alter type mission_role add value if not exists 'SPS';
alter type mission_role add value if not exists 'CSSI';

-- Réunions généralisées ------------------------------------------------------------------------

create type meeting_kind as enum ('OPC', 'SYNTHESE', 'RECEPTION');
create type meeting_status as enum ('BROUILLON', 'VALIDE');
create type attendee_status as enum ('PRESENT', 'EXCUSE', 'ABSENT');

alter table meeting_notes
  add column kind meeting_kind not null default 'OPC',
  add column number integer,
  add column author_organization_id uuid references organizations(id),
  add column status meeting_status not null default 'BROUILLON',
  add column validated_at timestamptz,
  add column validated_by_user_id uuid references users(id);

create index meeting_notes_author_organization_id_idx on meeting_notes(author_organization_id);

alter table meeting_attendees
  add column status attendee_status not null default 'PRESENT';

-- Points d'ordre du jour — référencent une tâche, un document, une entrée de journal, ou un texte
-- libre. Distincts des décisions (meeting_decisions), qui créent toujours une tâche.
create table meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meeting_notes(id) on delete cascade,
  task_id uuid references tasks(id),
  document_id uuid references documents(id),
  source_log_entry_id uuid references site_log_entries(id),
  text text,
  created_at timestamptz not null default now()
);

create index meeting_agenda_items_meeting_id_idx on meeting_agenda_items(meeting_id);
create index meeting_agenda_items_task_id_idx on meeting_agenda_items(task_id);
create index meeting_agenda_items_document_id_idx on meeting_agenda_items(document_id);
create index meeting_agenda_items_source_log_entry_id_idx on meeting_agenda_items(source_log_entry_id);

alter table meeting_agenda_items enable row level security;
create policy meeting_agenda_items_select on meeting_agenda_items for select using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);
create policy meeting_agenda_items_insert on meeting_agenda_items for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);

-- Notes de coordination OPC par lot — pas de Gantt, juste une consigne courte par semaine.
create table lot_schedule_notes (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  week date not null,
  note text not null,
  needs_lot_id uuid references lots(id),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index lot_schedule_notes_lot_id_idx on lot_schedule_notes(lot_id);
create index lot_schedule_notes_needs_lot_id_idx on lot_schedule_notes(needs_lot_id);

alter table lot_schedule_notes enable row level security;
create policy lot_schedule_notes_select on lot_schedule_notes for select using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy lot_schedule_notes_insert on lot_schedule_notes for insert with check (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);

-- Avis techniques (CT/SPS/BET/CSSI) — un avis CT suspendu/défavorable s'affiche sur l'écran de
-- visa MOE sans bloquer le visa : la MOE tranche, la mention reste. Le rôle de l'émetteur est
-- vérifié côté Server Action (site_participants), pas par une policy RLS — le rôle chantier n'est
-- pas un axe d'isolation multi-tenant, voir le même choix pour les actes (acts.ts).
create type technical_opinion_issuer_role as enum ('CT', 'SPS', 'BET', 'CSSI');
create type technical_opinion_kind as enum ('AVIS', 'VISITE', 'OBSERVATION');
create type technical_opinion_verdict as enum (
  'FAVORABLE', 'FAVORABLE_AVEC_OBSERVATIONS', 'SUSPENDU', 'DEFAVORABLE'
);
create type technical_opinion_status as enum ('BROUILLON', 'EMIS');

create table technical_opinions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  lot_id uuid references lots(id),
  document_id uuid references documents(id),
  issuer_organization_id uuid not null references organizations(id),
  issuer_role technical_opinion_issuer_role not null,
  kind technical_opinion_kind not null,
  verdict technical_opinion_verdict,
  text text not null,
  status technical_opinion_status not null default 'BROUILLON',
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index technical_opinions_site_id_idx on technical_opinions(site_id);
create index technical_opinions_lot_id_idx on technical_opinions(lot_id);
create index technical_opinions_document_id_idx on technical_opinions(document_id);
create index technical_opinions_issuer_organization_id_idx on technical_opinions(issuer_organization_id);

alter table technical_opinions enable row level security;
create policy technical_opinions_select on technical_opinions for select using (can_access_site(site_id));
create policy technical_opinions_insert on technical_opinions for insert with check (can_access_site(site_id));
