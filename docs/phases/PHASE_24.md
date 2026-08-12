# Phase 24 - Journal et verification des archives

## Objectif

Rendre l'archivage longue duree observable et verifiable avant de considerer un
fichier local ou LWS comme une sauvegarde reussie.

## Livrables

- migration Supabase `archive_runs`
- journalisation serveur des executions actives
- statuts `running`, `succeeded` et `failed`
- checksum SHA-256, taille, chemin, synthese et erreur eventuelle
- relecture de l'artefact apres stockage local ou SFTP
- restauration logique gzip/JSON et controle du contrat minimal
- tests de succes local, corruption et erreur de lecture metier

## Fichiers principaux

- `supabase/migrations/20260811194500_archive_runs.sql`
- `apps/web/src/modules/archival/services/market-archive.ts`
- `apps/web/src/modules/archival/types/archival.ts`
- `apps/web/src/modules/archival/tests/market-archive.test.ts`
- `apps/web/src/modules/archival/tests/market-archive-run.test.ts`
- `apps/web/src/app/api/cron/market-archive/route.ts`
- `docs/ARCHIVAL_25Y.md`

## Securite

- `archive_runs` active la RLS sans politique utilisateur
- les droits sont retires a `anon` et `authenticated`
- seul `service_role` peut lire ou ecrire directement le journal
- aucun secret SFTP ou Supabase n'est stocke dans le journal
- le message d'erreur est borne a 2 000 caracteres

## Resultat

- le cron cree un journal `running` avant l'extraction
- l'archive stockee est relue depuis sa cible
- le succes exige une taille et un checksum identiques, un gzip lisible et un
  payload conforme au contrat minimal
- les metadonnees de succes ou d'echec sont inscrites dans `archive_runs`
- le resultat HTTP expose l'identifiant du journal et le statut de verification

## Limites explicites

- aucun transfert reel ni test de restauration sur LWS n'a ete declenche
- la restauration automatisee dans une base vierge reste une phase ulterieure

## Validation Supabase locale

- Docker Desktop demarre et base locale reprise sans suppression de volume
- migration appliquee avec `supabase migration up --local`
- `14` migrations locales alignees
- `supabase db lint` : aucune erreur de schema
- RLS active sur `archive_runs`
- droits `SELECT` refuses a `anon` et `authenticated`
- droits `SELECT`, `INSERT` et `UPDATE` confirmes pour `service_role`
- types TypeScript regeneres depuis le schema local

## Validation

- `npm run test --workspace web -- src/modules/archival/tests/market-archive.test.ts src/modules/archival/tests/market-archive-run.test.ts src/app/api/cron/market-archive/route.test.ts`
- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run supabase:lint`
- `npm run supabase:types`
- `npm run verify`
