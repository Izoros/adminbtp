# Phase 18 — Cockpit admin alimente par les donnees metier

## Objectif

Faire evoluer le dashboard admin vers un vrai poste de pilotage AdminBTP, branche sur les donnees accessibles en base au lieu de s'appuyer uniquement sur des series statiques.

## Livrables

- agregateur serveur du cockpit admin
- indicateurs reels `projects`, `documents`, `signatures`, `followups`, `consulting`, `emails`, `ai`, `situations`
- affichage explicite de la source `supabase` ou `demonstration`
- kanban d'exploitation construit a partir des flux accessibles
- tests de construction de l'agregation

## Fichiers principaux

- `apps/web/src/components/dashboard/admin-cockpit-data.ts`
- `apps/web/src/components/dashboard/admin-cockpit.types.ts`
- `apps/web/src/components/dashboard/admin-cockpit.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/components/dashboard/admin-cockpit-data.test.ts`
- `apps/web/src/app/admin/page.test.tsx`

## Resultat

- `/admin` charge maintenant un cockpit alimente par Supabase quand le scope serveur est disponible
- l'interface garde un etat vide honnete quand la base est joignable mais peu peuplee
- la home conserve son cockpit statique de demonstration pour rester legere
- les graphes et le kanban affichent des signaux reels sur la page admin dediee

## Validation

- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/components/dashboard/admin-cockpit-data.test.ts src/components/dashboard/admin-cockpit.test.tsx src/app/admin/page.test.tsx`
- `npm run verify`
- `npm run verify:prod`
