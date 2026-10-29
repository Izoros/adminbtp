-- AdminBTP — Synchronisation de public.users.mfa_enabled avec les facteurs MFA Supabase Auth
-- (Phase 2 : écran MFA natif, cf. docs/ROADMAP.md).
--
-- L'authentification à deux facteurs (TOTP) est entièrement gérée par Supabase Auth
-- (`auth.mfa_factors`/`auth.mfa_challenges`) — aucune table applicative n'est créée pour stocker
-- un secret ou un code. `public.users.mfa_enabled` existe déjà depuis 0001_init_core_schema.sql
-- mais n'était encore jamais écrit : c'est une simple colonne de cache en lecture pour l'UI
-- (badge "MFA activé" dans la topbar et `/parametres`), qui évite de rappeler
-- `supabase.auth.mfa.listFactors()` à chaque rendu de page.
--
-- Volontairement, aucune policy RLS d'UPDATE n'est ajoutée sur `users` pour que le client puisse
-- écrire cette colonne lui-même (cela ouvrirait la porte à l'auto-modification d'autres colonnes
-- sensibles comme `permission_role` ou `organization_id` — voir le skill
-- adminbtp-multitenant-security). La seule écriture possible est ce trigger SECURITY DEFINER,
-- déclenché par Supabase Auth lui-même à chaque changement d'état d'un facteur MFA, suivant le
-- même principe que `handle_new_user()` (0002_auth_user_sync.sql) pour `on_auth_user_created`.

create or replace function public.handle_mfa_factor_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  affected_user_id uuid;
begin
  affected_user_id := coalesce(new.user_id, old.user_id);

  update public.users
  set mfa_enabled = exists (
    select 1
    from auth.mfa_factors f
    where f.user_id = affected_user_id
      and f.status = 'verified'
  )
  where id = affected_user_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_auth_mfa_factor_change on auth.mfa_factors;
create trigger on_auth_mfa_factor_change
  after insert or update or delete on auth.mfa_factors
  for each row execute function public.handle_mfa_factor_change();

-- Fonction interne déclenchée uniquement par le trigger ci-dessus, jamais destinée à un appel
-- RPC direct — même règle que handle_new_user()/rls_auto_enable() (0003_security_hardening.sql).
revoke execute on function public.handle_mfa_factor_change() from public, anon, authenticated;

-- Rattrapage ponctuel : aligne la colonne pour tout facteur déjà vérifié avant la création de ce
-- trigger (aucun effet si le projet ne contient encore aucun facteur MFA).
update public.users u
set mfa_enabled = true
where exists (
  select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified'
)
and u.mfa_enabled = false;
