# Phase 14 - Supabase local et migrations versionnees

## Perimetre livre

- installation du CLI `supabase` dans le projet
- initialisation du dossier `supabase/`
- migrations versionnees dans `supabase/migrations`
- seed neutre local
- scripts npm pour `start`, `reset`, `lint` et generation de types
- documentation locale Supabase

## Validation cible

- le depot peut porter une vraie base Supabase versionnee
- l'equipe dispose d'un workflow local reproductible

## Validation locale

Le CLI est installe, la structure `supabase/` existe et les migrations
couvrent le socle multi-tenant, les modules metier et le durcissement
de securite.

## Points de securite

- RLS ajoutee ou completee sur les modules `consulting`, `ai` et `client-space`
- vue `consulting_mission_capacity` definie avec `security_invoker = true`
- les contraintes de liaison organisation/projet sont explicites sur les modules tardifs

## Resultat d'execution

- `npm run verify` : OK
- `npx supabase --version` : OK
- `npm run supabase:start` : OK
- `npm run supabase:reset` : OK
- `npm run supabase:types` : OK
- validation structurelle des migrations : OK
- deploiement Vercel public : OK
- verification distante `/` : `200`
- verification distante `/api/health` : `200`
