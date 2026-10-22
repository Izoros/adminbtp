-- site_participants n'avait qu'une policy SELECT : nécessaire pour ajouter/clôturer un
-- intervenant (remplacement, Tranche A5) sans réécrire l'historique.
create policy site_participants_insert on site_participants for insert with check (can_access_site(site_id));
create policy site_participants_update on site_participants for update using (can_access_site(site_id)) with check (can_access_site(site_id));
