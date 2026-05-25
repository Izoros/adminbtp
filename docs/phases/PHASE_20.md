# Phase 20 — Cockpit admin multi-rails

## Objectif

Faire passer le cockpit admin d'un dashboard de lecture a un poste de pilotage plus actionnable, avec trois rails supplementaires :

- priorites direction
- sante plateforme
- actions rapides vers les modules critiques

## Livrables

- priorites calculees depuis les validations, relances, IA et missions
- radar de sante du socle sur la source, le perimetre et l'archive documentaire
- liens d'execution rapides vers `emails`, `followups`, `signatures` et `ai`
- extension du contrat de donnees du cockpit
- tests de regression sur les nouveaux blocs

## Fichiers principaux

- `apps/web/src/components/dashboard/admin-cockpit.types.ts`
- `apps/web/src/components/dashboard/admin-cockpit-data.ts`
- `apps/web/src/components/dashboard/admin-cockpit.tsx`
- `apps/web/src/components/dashboard/admin-cockpit-data.test.ts`
- `apps/web/src/components/dashboard/admin-cockpit.test.tsx`

## Resultat

- le cockpit expose maintenant un bloc de priorisation immediate pour la direction
- la page affiche aussi un radar de sante plus lisible pour le socle et le scope courant
- les equipes peuvent basculer plus vite vers les modules a traiter depuis les actions rapides

## Validation

- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/components/dashboard/admin-cockpit-data.test.ts src/components/dashboard/admin-cockpit.test.tsx src/app/admin/page.test.tsx`
- verification HTTP locale `GET /admin?range=30d` en `200`
- `npm run verify`
- `npm run verify:prod`
