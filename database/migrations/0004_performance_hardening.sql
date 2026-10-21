-- AdminBTP — Durcissement performance (Phase 2)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21, suite au rapport des advisors de
-- performance Supabase (mcp get_advisors, type: performance).

-- Index manquants sur les FK signalées (lint: unindexed_foreign_keys) — les index déjà posés
-- dans 0001_init_core_schema.sql sur organization_id/site_id (chemins d'accès RLS les plus
-- fréquents) couvraient l'essentiel, mais pas les FK secondaires (created_by, assigned_*, etc.).
create index if not exists audit_log_actor_user_id_idx on audit_log(actor_user_id);
create index if not exists document_templates_organization_id_idx on document_templates(organization_id);
create index if not exists documents_created_by_user_id_idx on documents(created_by_user_id);
create index if not exists documents_template_id_idx on documents(template_id);
create index if not exists expertise_requests_assigned_expert_user_id_idx on expertise_requests(assigned_expert_user_id);
create index if not exists expertise_requests_requested_by_user_id_idx on expertise_requests(requested_by_user_id);
create index if not exists expertise_requests_site_id_idx on expertise_requests(site_id);
create index if not exists lots_assigned_organization_id_idx on lots(assigned_organization_id);
create index if not exists mail_addresses_organization_id_idx on mail_addresses(organization_id);
create index if not exists mail_addresses_site_id_idx on mail_addresses(site_id);
create index if not exists mail_threads_assigned_user_id_idx on mail_threads(assigned_user_id);
create index if not exists mail_threads_mail_address_id_idx on mail_threads(mail_address_id);
create index if not exists mail_threads_site_id_idx on mail_threads(site_id);
create index if not exists phase_instances_phase_template_id_idx on phase_instances(phase_template_id);
create index if not exists phase_instances_responsible_user_id_idx on phase_instances(responsible_user_id);
create index if not exists portfolio_grants_granted_by_idx on portfolio_grants(granted_by);
create index if not exists portfolio_grants_organization_id_idx on portfolio_grants(organization_id);
create index if not exists reminder_rules_site_id_idx on reminder_rules(site_id);
create index if not exists reminder_rules_template_id_idx on reminder_rules(template_id);
create index if not exists site_access_site_id_idx on site_access(site_id);
create index if not exists site_participants_lot_id_idx on site_participants(lot_id);
create index if not exists sites_manager_user_id_idx on sites(manager_user_id);
create index if not exists situations_lot_id_idx on situations(lot_id);
create index if not exists tasks_assigned_user_id_idx on tasks(assigned_user_id);
create index if not exists tasks_site_id_idx on tasks(site_id);
create index if not exists validation_records_decided_by_user_id_idx on validation_records(decided_by_user_id);

-- Policies SELECT redondantes avec la policy FOR ALL (write) de la même table, sur la même
-- condition can_access_organization(...) — chaque SELECT évaluait deux policies identiques pour
-- rien (lint: multiple_permissive_policies). FOR ALL couvre déjà SELECT.
drop policy if exists documents_select on documents;
drop policy if exists mail_threads_select on mail_threads;
drop policy if exists phase_instances_select on phase_instances;
drop policy if exists sites_select on sites;
drop policy if exists tasks_select on tasks;
