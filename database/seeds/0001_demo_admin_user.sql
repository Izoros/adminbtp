-- AdminBTP — Compte de démonstration ADMIN_PLATEFORME (Phase 2)
-- APPLIQUÉ au projet Supabase "AdminBTP" le 2026-10-21, pour pouvoir tester la connexion réelle
-- sans dépendre de l'envoi d'email (le SMTP intégré Supabase en limite l'envoi à quelques
-- confirmations par heure en développement). Identifiants réels : voir apps/web/.env.local
-- (jamais committé — voir .gitignore).
--
-- Piège GoTrue à connaître : plusieurs colonnes "token" de auth.users (confirmation_token,
-- recovery_token, email_change_token_new, email_change, email_change_token_current,
-- phone_change, phone_change_token, reauthentication_token) sont nullable dans le schéma SQL
-- mais le driver Go de GoTrue échoue à la connexion si elles valent NULL au lieu de chaîne vide
-- ("sql: Scan error ... converting NULL to string is unsupported"). Toujours les insérer à ''.
--
-- Remplacer le mot de passe avant réexécution dans un autre environnement — ne jamais commiter
-- de vrai mot de passe en clair dans ce fichier (celui-ci est un exemple de structure, pas la
-- valeur réellement utilisée).

do $$
declare
  new_user_id uuid := gen_random_uuid();
  seed_password text := 'CHANGE_ME_BEFORE_RUNNING';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
    'demo.seed@adminbtp.test', crypt(seed_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Amina Chanfi"}'::jsonb,
    '', '', '', '', '', '', '', '',
    now(), now()
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, created_at, updated_at
  ) values (
    gen_random_uuid(), new_user_id::text, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'demo.seed@adminbtp.test'),
    'email', now(), now()
  );

  -- Le trigger on_auth_user_created (0002_auth_user_sync.sql) crée automatiquement la ligne
  -- public.users correspondante en OBSERVATEUR sans organisation ; on l'élève ensuite.
  update public.users set permission_role = 'ADMIN_PLATEFORME' where id = new_user_id;
end $$;
