# Phase 2 - Chantiers et roles projet

## Perimetre livre

- schema SQL `projects`
- schema SQL `project_organizations`
- type `project_role`
- politiques RLS d'acces chantier
- types TypeScript du module `projects`
- service local de demonstration des chantiers
- logique de vues differentes selon le role chantier
- page `/projects`
- tests de filtrage chantier et de variation de vue

## Validation cible

- une organisation peut avoir plusieurs roles selon le chantier
- les vues changent selon le role

## Validation locale

La validation locale repose sur un chantier de demonstration relie a plusieurs
organisations, avec affichage adapte au role accessible pour l'utilisateur de
session locale.

## Points de securite

- acces chantier derive des rattachements `organization_members` + `project_organizations`
- RLS active sur `projects` et `project_organizations`
- creation et mise a jour de chantier reservees aux gestionnaires de l'organisation proprietaire
- aucun chantier non rattache n'est expose dans la demo locale

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale des vues par role chantier : OK
