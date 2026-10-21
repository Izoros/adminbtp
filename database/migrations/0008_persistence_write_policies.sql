-- AdminBTP — Policies d'écriture pour la persistance réelle (Phase 2, suite)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21. Les actions "Approuver/Refuser une
-- validation" et "Enregistrer un paramètre d'organisation", jusqu'ici visuelles sans effet (voir
-- docs/ROADMAP.md), nécessitent des policies d'écriture qui n'existaient pas encore sur
-- validation_records et organizations.

create policy validation_records_insert on validation_records
  for insert with check (
    exists (select 1 from documents d where d.id = validation_records.document_id and can_access_organization(d.organization_id))
  );

create policy validation_records_update on validation_records
  for update using (
    exists (select 1 from documents d where d.id = validation_records.document_id and can_access_organization(d.organization_id))
  ) with check (
    exists (select 1 from documents d where d.id = validation_records.document_id and can_access_organization(d.organization_id))
  );

create policy organizations_update on organizations
  for update using (can_access_organization(id)) with check (can_access_organization(id));
