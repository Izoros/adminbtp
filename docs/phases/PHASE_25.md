# Phase 25 - Supervision admin des archives

## Objectif

Donner aux administrateurs plateforme une lecture exploitable du journal
`archive_runs` sans exposer la cle serveur ni les metadonnees d'archivage aux
autres utilisateurs.

## Livrables

- protection de `/admin` et de ses sous-routes dans le proxy d'authentification
- client Supabase admin partage et marque `server-only`
- controle de session puis RPC `is_platform_admin`
- lecteur des 50 executions les plus recentes
- page `/admin/archives`
- indicateurs de succes, echec, retard et execution bloquee
- lien depuis le cockpit admin
- couverture smoke des routes admin

## Fichiers principaux

- `apps/web/src/lib/supabase/admin.ts`
- `apps/web/src/modules/auth/services/session-navigation.ts`
- `apps/web/src/modules/archival/services/archive-operations.ts`
- `apps/web/src/modules/archival/types/archive-operations.ts`
- `apps/web/src/modules/archival/components/archive-operations-dashboard.tsx`
- `apps/web/src/app/admin/archives/page.tsx`
- `apps/web/src/modules/archival/tests/archive-operations.test.ts`
- `apps/web/src/modules/archival/tests/archive-operations-dashboard.test.tsx`
- `apps/web/src/app/admin/archives/page.test.tsx`
- `scripts/verify-smoke.sh`

## Regles de sante

- `critical` : dernier run en echec ou au moins un run bloque
- `attention` : aucune archive reussie depuis plus de 26 heures
- `healthy` : archive reussie dans la fenetre quotidienne attendue
- `empty` : journal accessible mais sans execution
- une execution `running` depuis plus de 15 minutes est bloquee

## Securite

- la route est protegee par le proxy puis controlee de nouveau cote serveur
- une session absente est redirigee vers `/login`
- `is_platform_admin` est appelee avec la session utilisateur
- le client `service_role` n'est cree qu'apres une reponse positive
- un refus d'autorisation ne declenche aucune lecture de `archive_runs`
- `server-only` empeche l'import du client privilegie dans un composant client

## Limites explicites

- l'ecran n'envoie pas encore de notification externe
- la supervision ne teste pas elle-meme une restauration en base vierge
- les environnements distants doivent recevoir la migration de phase 24 avant le deploiement
- aucun secret ni transfert LWS n'a ete utilise pendant ce lot

## Validation

- tests archives et admin cibles : `8` fichiers et `28` tests passes
- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run verify`
