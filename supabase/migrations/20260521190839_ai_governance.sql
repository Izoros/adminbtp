create table if not exists ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid,
  source_entity_type text not null,
  source_entity_id uuid not null,
  suggestion_kind text not null check (
    suggestion_kind in (
      'email_summary',
      'document_classification',
      'letter_draft',
      'ppsps_assistance',
      'dc4_assistance',
      'smart_search'
    )
  ),
  title text not null,
  prompt_snapshot text not null,
  output_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending_human_validation' check (
    status in (
      'proposed',
      'pending_human_validation',
      'approved',
      'rejected',
      'applied'
    )
  ),
  proposed_by text not null default 'ai',
  validated_by uuid,
  validated_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists ai_suggestion_audit_logs (
  id uuid primary key default gen_random_uuid(),
  ai_suggestion_id uuid not null references ai_suggestions(id) on delete cascade,
  actor_type text not null check (actor_type in ('ai', 'user', 'system')),
  actor_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ai_suggestions_organization
  on ai_suggestions (organization_id, status, suggestion_kind);

create index if not exists idx_ai_suggestion_audit_logs_suggestion
  on ai_suggestion_audit_logs (ai_suggestion_id, created_at desc);
