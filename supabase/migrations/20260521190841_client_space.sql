create table if not exists client_portal_accesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_organization_id uuid not null,
  project_id uuid,
  access_scope text not null check (
    access_scope in ('documents', 'validations', 'followups', 'tickets', 'dashboard')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists client_feedback_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_organization_id uuid not null,
  project_id uuid,
  related_entity_type text not null,
  related_entity_id uuid not null,
  author_role text not null check (author_role in ('client', 'adminbtp')),
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_client_portal_accesses_client_org
  on client_portal_accesses (client_organization_id, organization_id, project_id);

create index if not exists idx_client_feedback_threads_client_org
  on client_feedback_threads (client_organization_id, organization_id, created_at desc);
