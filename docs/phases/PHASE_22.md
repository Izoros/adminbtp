# Phase 22 — Archivage 25 ans et sauvegarde LWS

## Objectif

Poser le socle d'archivage longue duree des marches AdminBTP, avec une sauvegarde quotidienne externalisee vers un serveur cloud `LWS` bien classe.

## Livrables

- service d'archivage `market-archive`
- route cron protegee `/api/cron/market-archive`
- cron Vercel quotidien dans `vercel.json`
- export structure `json.gz`
- support `local` pour tests et `SFTP` pour LWS
- variables d'environnement d'archivage
- runbook 25 ans

## Fichiers principaux

- `apps/web/src/modules/archival/services/market-archive.ts`
- `apps/web/src/modules/archival/types/archival.ts`
- `apps/web/src/modules/archival/tests/market-archive.test.ts`
- `apps/web/src/app/api/cron/market-archive/route.ts`
- `apps/web/src/app/api/cron/market-archive/route.test.ts`
- `vercel.json`
- `.env.example`
- `docs/ARCHIVAL_25Y.md`

## Resultat

- l'application sait maintenant generer une archive logique quotidienne des marches
- le transport cible est prevu vers `LWS` en `SFTP`
- le cron est securise par `CRON_SECRET`
- le mode local permet de valider le flux sans toucher au serveur distant

## Validation

- `npm install`
- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/app/api/cron/market-archive/route.test.ts src/modules/archival/tests/market-archive.test.ts`
- `npm run verify`
- `npm run verify:prod`
