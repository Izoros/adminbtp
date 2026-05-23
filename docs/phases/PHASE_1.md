# Phase 1 - Authentification et multi-tenant

## Perimetre livre

- base Next.js/Supabase SSR avec `@supabase/ssr`
- `proxy.ts` pour la mise a jour de session
- utilitaires `client`, `server` et `proxy` pour Supabase
- schema SQL pour `user_profiles`, `organizations`, `organization_members`
- enums de roles internes et roles d'organisation
- politiques RLS de base
- page `login`
- page `organizations`
- tests d'acces organisationnel

## Validation cible

- un utilisateur appartient a une ou plusieurs organisations
- un utilisateur ne voit pas les donnees d'une autre organisation

## Verification locale

Sans projet Supabase branche, la validation locale s'appuie sur :

- le schema SQL versionne pour la vraie base
- le routage SSR et le proxy d'authentification
- une simulation locale de droits d'acces pour verifier le comportement UI

## Points de securite

- utilisation du couple `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- aucune utilisation de `user_metadata` pour l'autorisation
- RLS active sur les tables exposees
- mise a jour de session via proxy
- reponses d'auth non cachees via en-tetes transmis par `@supabase/ssr`

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- verification logique locale de l'isolation organisationnelle : OK
- scan de secret sensible : OK
- `npm audit --omit=dev` : 2 vulnerabilites moderes detectees dans la chaine `next -> postcss`, sans correctif non cassant propose localement
