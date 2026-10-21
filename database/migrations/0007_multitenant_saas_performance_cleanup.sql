-- AdminBTP — Nettoyage performance suite aux exigences SaaS multi-tenant
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21, suite au rapport des advisors de
-- performance Supabase passé juste après 0005/0006.

-- Index manquants sur les nouvelles FK.
create index if not exists portfolio_grants_revoked_by_idx on portfolio_grants(revoked_by);
create index if not exists signature_profiles_created_by_user_id_idx on signature_profiles(created_by_user_id);

-- Les policies FOR ALL ci-dessous se recoupaient avec les nouvelles policies SELECT élargies de
-- 0006 (ex: sites_write couvrait déjà SELECT pour le propriétaire, en plus de
-- sites_select_shared). On les remplace par des policies INSERT/UPDATE/DELETE séparées : une
-- seule policy SELECT par table désormais (la version élargie), l'écriture reste scopée à
-- l'organisation propriétaire.

drop policy if exists sites_write on sites;
create policy sites_insert on sites for insert with check (can_access_organization(organization_id));
create policy sites_update on sites for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));
create policy sites_delete on sites for delete using (can_access_organization(organization_id));

drop policy if exists phase_instances_write on phase_instances;
create policy phase_instances_insert on phase_instances for insert with check (
  exists (select 1 from sites s where s.id = phase_instances.site_id and can_access_organization(s.organization_id))
);
create policy phase_instances_update on phase_instances for update using (
  exists (select 1 from sites s where s.id = phase_instances.site_id and can_access_organization(s.organization_id))
) with check (
  exists (select 1 from sites s where s.id = phase_instances.site_id and can_access_organization(s.organization_id))
);
create policy phase_instances_delete on phase_instances for delete using (
  exists (select 1 from sites s where s.id = phase_instances.site_id and can_access_organization(s.organization_id))
);

drop policy if exists documents_write on documents;
create policy documents_insert on documents for insert with check (can_access_organization(organization_id));
create policy documents_update on documents for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));
create policy documents_delete on documents for delete using (can_access_organization(organization_id));

drop policy if exists mail_threads_write on mail_threads;
create policy mail_threads_insert on mail_threads for insert with check (can_access_organization(organization_id));
create policy mail_threads_update on mail_threads for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));
create policy mail_threads_delete on mail_threads for delete using (can_access_organization(organization_id));

drop policy if exists tasks_write on tasks;
create policy tasks_insert on tasks for insert with check (can_access_organization(organization_id));
create policy tasks_update on tasks for update using (can_access_organization(organization_id)) with check (can_access_organization(organization_id));
create policy tasks_delete on tasks for delete using (can_access_organization(organization_id));

-- plan_features_write (créée dans 0006) souffrait du même recoupement avec plan_features_select.
drop policy if exists plan_features_write on plan_features;
create policy plan_features_insert on plan_features for insert with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy plan_features_update on plan_features for update using (current_user_permission_role() = 'ADMIN_PLATEFORME') with check (current_user_permission_role() = 'ADMIN_PLATEFORME');
create policy plan_features_delete on plan_features for delete using (current_user_permission_role() = 'ADMIN_PLATEFORME');
