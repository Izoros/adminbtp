-- Phase 3 : stockage réel des documents (Supabase Storage) et garantie technique — pas
-- seulement conventionnelle — qu'un PPSPS naît toujours en PREEDITION. Voir docs/ROADMAP.md.

insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- Chemin d'objet conventionnel : {organization_id}/{document_id}.pdf — can_access_organization()
-- réutilise exactement la même règle d'isolation multi-tenant que la table documents elle-même.
create policy documents_storage_select on storage.objects for select using (
  bucket_id = 'documents' and can_access_organization((storage.foldername(name))[1]::uuid)
);
create policy documents_storage_insert on storage.objects for insert with check (
  bucket_id = 'documents' and can_access_organization((storage.foldername(name))[1]::uuid)
);
create policy documents_storage_update on storage.objects for update using (
  bucket_id = 'documents' and can_access_organization((storage.foldername(name))[1]::uuid)
) with check (
  bucket_id = 'documents' and can_access_organization((storage.foldername(name))[1]::uuid)
);
create policy documents_storage_delete on storage.objects for delete using (
  bucket_id = 'documents' and can_access_organization((storage.foldername(name))[1]::uuid)
);

-- Un PPSPS généré (par l'IA ou toute autre voie présente ou future) naît toujours en PREEDITION,
-- quel que soit le statut demandé par le code appelant — un bug applicatif ne peut pas le
-- contourner, la garantie est portée par la base, pas seulement par la convention suivie dans
-- createDocument()/generateDocumentFromTemplate().
create or replace function enforce_ppsps_preedition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category = 'PPSPS' then
    new.status := 'PREEDITION';
  end if;
  return new;
end;
$$;

create trigger documents_enforce_ppsps_preedition
before insert on documents
for each row execute function enforce_ppsps_preedition();
