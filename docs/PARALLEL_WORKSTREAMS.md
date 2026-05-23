# Workstreams paralleles

## Objectif

Ce document cadre l'utilisation de plusieurs agents ou developpeurs en
parallele pour accelerer l'avancement sans casser le core ni provoquer
de conflits d'integration.

## Regles communes

- le core reste gele sans validation centrale
- chaque workstream possede un perimetre d'ecriture strict
- aucun agent ne revert les changements d'un autre
- chaque lot doit conserver `lint`, `typecheck`, `test` et `build` au vert
- les commentaires de code restent en francais

## Workstream A - Organisations + Projets

- ownership :
  - `apps/web/src/modules/organizations/**`
  - `apps/web/src/modules/projects/**`
  - `apps/web/src/app/organizations/page.tsx`
  - `apps/web/src/app/projects/page.tsx`
- mission :
  - brancher un acces Supabase reel
  - conserver un fallback demo propre

## Workstream B - Documents + Signatures

- ownership :
  - `apps/web/src/modules/documents/**`
  - `apps/web/src/modules/signatures/**`
  - `apps/web/src/app/documents/page.tsx`
  - `apps/web/src/app/signatures/page.tsx`
- mission :
  - brancher un acces Supabase reel
  - conserver un fallback demo propre

## Workstream C - Emails + Tresorerie + n8n

- ownership :
  - `apps/web/src/modules/emails/**`
  - `apps/web/src/modules/followups/**`
  - `apps/web/src/app/emails/page.tsx`
  - `apps/web/src/app/followups/page.tsx`
  - `apps/web/src/app/n8n/page.tsx`
  - `apps/web/src/app/api/n8n/**`
- mission :
  - preparer un acces Supabase reel
  - conserver un fallback demo propre

## Workstream D - Consulting + IA + Espace client

- ownership :
  - `apps/web/src/modules/consulting/**`
  - `apps/web/src/modules/ai/**`
  - `apps/web/src/modules/client-space/**`
  - `apps/web/src/app/consulting/page.tsx`
  - `apps/web/src/app/ai/page.tsx`
  - `apps/web/src/app/client-space/page.tsx`
- mission :
  - preparer un acces Supabase reel
  - conserver un fallback demo propre

## Coordination centrale

- consolidation des changements
- arbitrage des points core
- validation globale avant merge

## Resultat de la consolidation

- Workstream A : creation reelle d'organisation et de projet dans Supabase, avec fonctions SQL dediees et fallback demo conserve
- Workstream B : actions serveur reelles pour documents et signatures, avec journaux d'audit et fallback explicite
- Workstream C : lectures Supabase reelles pour emails et relances, plus durcissement des webhooks `n8n`
- Workstream D : lectures/ecritures reelles minimales pour consulting, gouvernance IA et espace client
- validation centrale finale : `npm run verify` OK et `npm run verify:prod` OK

## Consolidation phase 16

- le lot phase 16 ne redecoupe pas de nouveaux perimetres d'ecriture applicatifs
- la consolidation porte sur le socle commun deja present : auth Supabase reelle, predicates d'autorisation, fonctions SQL bornees et observabilite initiale
- les evolutions futures sur ce socle doivent rester centralisees car elles touchent `auth`, `permissions`, `RLS`, webhooks et verification production
- les workstreams metier peuvent continuer module par module tant qu'ils reutilisent ces garde-fous sans les contourner
