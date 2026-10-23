-- Un compte-rendu validé est figé : plus de modification de l'en-tête, ni d'ajout de présence,
-- de point d'ordre du jour ou de décision. Seul un brouillon peut passer à VALIDE.

alter table meeting_notes add constraint meeting_notes_validation_consistency check (
  (status = 'BROUILLON' and validated_at is null and validated_by_user_id is null)
  or (status = 'VALIDE' and validated_at is not null and validated_by_user_id is not null)
);

drop policy meeting_notes_update on meeting_notes;
create policy meeting_notes_update on meeting_notes for update
  using (can_access_site(site_id) and status = 'BROUILLON')
  with check (can_access_site(site_id));

drop policy meeting_attendees_insert on meeting_attendees;
create policy meeting_attendees_insert on meeting_attendees for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'BROUILLON')
);

drop policy meeting_decisions_insert on meeting_decisions;
create policy meeting_decisions_insert on meeting_decisions for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'BROUILLON')
);

drop policy meeting_decisions_update on meeting_decisions;
create policy meeting_decisions_update on meeting_decisions for update using (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'BROUILLON')
) with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'BROUILLON')
);

drop policy meeting_agenda_items_insert on meeting_agenda_items;
create policy meeting_agenda_items_insert on meeting_agenda_items for insert with check (
  exists (select 1 from meeting_notes m where m.id = meeting_id and can_access_site(m.site_id) and m.status = 'BROUILLON')
);
