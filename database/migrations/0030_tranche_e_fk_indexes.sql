-- Index manquants sur les FK ajoutées en 0029, relevés par les advisors de performance Supabase.
create index lot_schedule_notes_created_by_user_id_idx on lot_schedule_notes(created_by_user_id);
create index meeting_notes_validated_by_user_id_idx on meeting_notes(validated_by_user_id);
create index technical_opinions_created_by_user_id_idx on technical_opinions(created_by_user_id);
