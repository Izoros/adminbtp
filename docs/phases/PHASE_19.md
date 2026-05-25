# Phase 19 — Cockpit admin pilotable par periode

## Objectif

Rendre le cockpit admin plus utile pour la direction en ajoutant une fenetre d'analyse pilotable par URL, des cartes de synthese de periode et des graphes adaptes a `7`, `30` ou `90` jours.

## Livrables

- normalisation de la periode `7d | 30d | 90d`
- chargement du cockpit admin selon `searchParams`
- cartes de synthese direction sur la fenetre active
- graphes et barres recalcules selon la periode
- badges de mise a jour et contexte de lecture
- tests de regression de la page admin et de l'agregateur

## Fichiers principaux

- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/admin/page.test.tsx`
- `apps/web/src/components/dashboard/admin-cockpit.tsx`
- `apps/web/src/components/dashboard/admin-cockpit.types.ts`
- `apps/web/src/components/dashboard/admin-cockpit-data.ts`
- `apps/web/src/components/dashboard/admin-cockpit-data.test.ts`

## Resultat

- `/admin?range=7d`, `/admin?range=30d` et `/admin?range=90d` pilotent maintenant la meme page
- le cockpit expose une lecture plus honnete de la periode selectionnee
- les cartes de synthese completent les KPI globaux avec une lecture recentre sur l'activite recente
- le rendu reste server-first et compatible avec le build statique/dynamique existant

## Validation

- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/components/dashboard/admin-cockpit-data.test.ts src/components/dashboard/admin-cockpit.test.tsx src/app/admin/page.test.tsx`
- verification HTTP locale `GET /admin?range=90d` en `200`
- `npm run verify`
- `npm run verify:prod`
