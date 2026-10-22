-- Tranche C : visa de plans, réserves, journal de chantier, comptes-rendus, avancement.

create type task_source_type_new as enum ('MANUEL', 'MAIL', 'PHASE', 'VALIDATION', 'AUTOMATISATION', 'MEETING');
alter table tasks alter column source_type drop default;
alter table tasks alter column source_type type task_source_type_new using source_type::text::task_source_type_new;
drop type task_source_type;
alter type task_source_type_new rename to task_source_type;
alter table tasks alter column source_type set default 'MANUEL'::task_source_type;

-- Journal de chantier — cité comme motif d'un OS ou d'un avenant, jamais généré automatiquement.
create type site_log_entry_kind as enum ('INTEMPERIE', 'ARRET', 'LIVRAISON', 'INCIDENT', 'AUTRE');

create table site_log_entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  entry_date date not null,
  kind site_log_entry_kind not null,
  description text not null,
  author_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index site_log_entries_site_id_idx on site_log_entries(site_id);
create index site_log_entries_author_user_id_idx on site_log_entries(author_user_id);

alter table site_log_entries enable row level security;
create policy site_log_entries_select on site_log_entries for select using (can_access_site(site_id));
create policy site_log_entries_insert on site_log_entries for insert with check (can_access_site(site_id));

alter table documents add column source_log_entry_id uuid references site_log_entries(id);
alter table amendments add column source_log_entry_id uuid references site_log_entries(id);
create index documents_source_log_entry_id_idx on documents(source_log_entry_id);
create index amendments_source_log_entry_id_idx on amendments(source_log_entry_id);

-- Visa de plans — file d'attente MOE, diffusion après visa ciblée sur le lot (documents.lot_id).
create type plan_submission_status as enum ('DEPOSE', 'VISE_BPE', 'VISE_AVEC_REMARQUES', 'REFUSE');

create table plan_submissions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  lot_id uuid references lots(id),
  document_id uuid not null references documents(id),
  author_user_id uuid not null references users(id),
  status plan_submission_status not null default 'DEPOSE',
  reviewed_by_user_id uuid references users(id),
  reviewed_at timestamptz,
  remarks text,
  created_at timestamptz not null default now()
);

create index plan_submissions_site_id_idx on plan_submissions(site_id);
create index plan_submissions_lot_id_idx on plan_submissions(lot_id);
create index plan_submissions_document_id_idx on plan_submissions(document_id);
create index plan_submissions_author_user_id_idx on plan_submissions(author_user_id);
create index plan_submissions_reviewed_by_user_id_idx on plan_submissions(reviewed_by_user_id);

alter table plan_submissions enable row level security;
create policy plan_submissions_select on plan_submissions for select using (can_access_site(site_id));
create policy plan_submissions_insert on plan_submissions for insert with check (can_access_site(site_id));
create policy plan_submissions_update on plan_submissions for update using (can_access_site(site_id)) with check (can_access_site(site_id));

-- Réserves — liste structurée, la catégorie RESERVES existante reste un export, pas la donnée elle-même.
create type reserve_severity as enum ('MINEURE', 'MAJEURE', 'BLOQUANTE');
create type reserve_status as enum ('OUVERTE', 'LEVEE', 'CONTESTEE');

create table reserve_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  lot_id uuid references lots(id),
  location text,
  description text not null,
  severity reserve_severity not null,
  due_date date,
  status reserve_status not null default 'OUVERTE',
  document_id uuid references documents(id),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reserve_items_site_id_idx on reserve_items(site_id);
create index reserve_items_lot_id_idx on reserve_items(lot_id);
create index reserve_items_document_id_idx on reserve_items(document_id);

create trigger reserve_items_set_updated_at before update on reserve_items
  for each row execute function set_updated_at();

alter table reserve_items enable row level security;
create policy reserve_items_select on reserve_items for select using (can_access_site(site_id));
create policy reserve_items_insert on reserve_items for insert with check (can_access_site(site_id));
create policy reserve_items_update on reserve_items for update using (can_access_site(site_id)) with check (can_access_site(site_id));

-- Comptes-rendus — le PDF (catégorie COMPTE_RENDU existante) est généré depuis ces lignes.
create table meeting_notes (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  meeting_date date not null,
  created_by_user_id uuid not null references users(id),
  document_id uuid references documents(id),
  created_at timestamptz not null default now()
);

create index meeting_notes_site_id_idx on meeting_notes(site_id);
create index meeting_notes_document_id_idx on meeting_notes(document_id);

alter table meeting_notes enable row level security;
create policy meeting_notes_select on meeting_notes for select using (can_access_site(site_id));
create policy meeting_notes_insert on meeting_notes for insert with check (can_access_site(site_id));
create policy meeting_notes_update on meeting_notes for update using (can_access_site(site_id)) with check (can_access_site(site_id));

create table meeting_attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meeting_notes(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  name text not null
);

create index meeting_attendees_meeting_id_idx on meeting_attendees(meeting_id);
create index meeting_attendees_organization_id_idx on meeting_attendees(organization_id);

alter table meeting_attendees enable row level security;
create policy meeting_attendees_select on meeting_attendees for select using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);
create policy meeting_attendees_insert on meeting_attendees for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);

-- Chaque décision peut créer une tâche existante (task_id renseigné une fois créée).
create table meeting_decisions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meeting_notes(id) on delete cascade,
  lot_id uuid references lots(id),
  text text not null,
  task_id uuid references tasks(id)
);

create index meeting_decisions_meeting_id_idx on meeting_decisions(meeting_id);
create index meeting_decisions_lot_id_idx on meeting_decisions(lot_id);
create index meeting_decisions_task_id_idx on meeting_decisions(task_id);

alter table meeting_decisions enable row level security;
create policy meeting_decisions_select on meeting_decisions for select using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);
create policy meeting_decisions_insert on meeting_decisions for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);
create policy meeting_decisions_update on meeting_decisions for update using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
) with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);

-- Avancement déclaré — comparé côté UI au cumul HT facturé, pas un moteur de planning.
create table lot_progress (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  record_date date not null,
  declared_percent numeric not null check (declared_percent >= 0 and declared_percent <= 100),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index lot_progress_lot_id_idx on lot_progress(lot_id);
create index lot_progress_created_by_user_id_idx on lot_progress(created_by_user_id);

alter table lot_progress enable row level security;
create policy lot_progress_select on lot_progress for select using (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
create policy lot_progress_insert on lot_progress for insert with check (
  exists (select 1 from lots l where l.id = lot_id and can_access_site(l.site_id))
);
