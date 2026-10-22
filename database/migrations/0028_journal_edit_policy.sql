-- Comble une lacune des Tranches A-D (voir docs/ROADMAP.md) : une entrée de journal de chantier
-- ne pouvait être que créée, jamais corrigée. reserve_items et meeting_notes ont déjà une policy
-- update (posée en 0023, non exploitée côté UI jusqu'ici) ; seule site_log_entries en manquait.
create policy site_log_entries_update on site_log_entries for update
  using (can_access_site(site_id))
  with check (can_access_site(site_id));
