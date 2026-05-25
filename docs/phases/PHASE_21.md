# Phase 21 — Focus portefeuille admin

## Objectif

Ajouter au cockpit admin une lecture portefeuille pour visualiser rapidement quelles organisations et quels chantiers concentrent la charge metier.

## Livrables

- focus `organisations sous charge`
- focus `projets les plus exposes`
- calcul des signaux portefeuille a partir des flux `projects`, `documents`, `followups`, `consulting`, `emails`, `situations`, `ai`
- extension du typage du cockpit admin
- tests de regression sur l'agregation portefeuille

## Fichiers principaux

- `apps/web/src/components/dashboard/admin-cockpit.types.ts`
- `apps/web/src/components/dashboard/admin-cockpit-data.ts`
- `apps/web/src/components/dashboard/admin-cockpit.tsx`
- `apps/web/src/components/dashboard/admin-cockpit-data.test.ts`
- `apps/web/src/components/dashboard/admin-cockpit.test.tsx`

## Resultat

- la direction peut maintenant reperer plus vite les poles d'activite les plus denses
- le cockpit expose un angle `ou agir` en plus du `quoi traiter`
- les blocs restent relies aux modules existants via des liens rapides

## Validation

- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/components/dashboard/admin-cockpit-data.test.ts src/components/dashboard/admin-cockpit.test.tsx src/app/admin/page.test.tsx`
- verification HTTP locale `GET /admin?range=30d` en `200`
- `npm run verify`
- `npm run verify:prod`
