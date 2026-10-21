-- AdminBTP — Provisioning automatique des profils utilisateur (Phase 2)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21.
--
-- Remplace un trigger hérité d'un projet précédent (private.handle_new_user, qui référençait
-- la table public.user_profiles supprimée — voir docs/DECISIONS.md).

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists private.handle_new_user() cascade;

-- Crée automatiquement un profil public.users (rôle le plus restrictif, sans organisation)
-- à chaque inscription Supabase Auth. L'affectation à une organisation et l'élévation de rôle
-- se font ensuite manuellement (back-office ADMIN_PLATEFORME) — pas d'auto-élévation de privilège
-- à l'inscription, par principe de sécurité.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, permission_role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'OBSERVATEUR'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
