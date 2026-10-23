-- Tranche E (complément) : diffusion réelle du compte-rendu validé et accusé de réception par
-- les organisations présentes ou titulaires d'un lot cité dans une décision — voir
-- docs/ROADMAP.md. Pas de nouveau moteur de notification : un envoi via IEmailProvider (Demo* en
-- l'absence de fournisseur réel), tracé une fois par organisation destinataire.

create type meeting_note_distribution_channel as enum ('EMAIL');

create table meeting_note_distributions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meeting_notes(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  channel meeting_note_distribution_channel not null default 'EMAIL',
  sent_at timestamptz not null default now(),
  sent_by_user_id uuid not null references users(id)
);

create index meeting_note_distributions_meeting_id_idx on meeting_note_distributions(meeting_id);
create index meeting_note_distributions_organization_id_idx on meeting_note_distributions(organization_id);

alter table meeting_note_distributions enable row level security;
create policy meeting_note_distributions_select on meeting_note_distributions for select using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);
-- Seul un CR validé peut être diffusé — le rôle OPC/MOE de l'émetteur est vérifié côté Server
-- Action (distributeMeetingNote), pas ici : le rôle chantier n'est pas un axe d'isolation RLS,
-- même choix que pour meeting_notes/meeting_decisions ailleurs dans cette tranche.
create policy meeting_note_distributions_insert on meeting_note_distributions for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'VALIDE')
);

-- Une organisation accuse réception au plus une fois par compte-rendu (idempotent côté action :
-- une violation de cette contrainte est traitée comme un succès silencieux).
create table meeting_note_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meeting_notes(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  acknowledged_at timestamptz not null default now(),
  acknowledged_by_user_id uuid not null references users(id),
  unique (meeting_id, organization_id)
);

create index meeting_note_acknowledgments_meeting_id_idx on meeting_note_acknowledgments(meeting_id);
create index meeting_note_acknowledgments_organization_id_idx on meeting_note_acknowledgments(organization_id);

alter table meeting_note_acknowledgments enable row level security;
create policy meeting_note_acknowledgments_select on meeting_note_acknowledgments for select using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id))
);
-- L'éligibilité (présent ou titulaire d'un lot cité) est vérifiée côté Server Action
-- (acknowledgeMeetingNote) : même raisonnement que ci-dessus, pas un axe d'isolation RLS.
create policy meeting_note_acknowledgments_insert on meeting_note_acknowledgments for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'VALIDE')
);
