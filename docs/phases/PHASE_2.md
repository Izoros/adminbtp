# Phase 2 - Chantiers et roles projet

## Perimetre livre

- schema SQL `projects`
- schema SQL `project_organizations`
- type `project_role`
- politiques RLS d'acces chantier
- types TypeScript du module `projects`
- service local de demonstration des chantiers
- reader Supabase conserve maintenant un vrai etat vide quand aucun chantier n'existe encore
- logique de vues differentes selon le role chantier
- page `/projects`
- tests de filtrage chantier et de variation de vue

## Validation cible

- une organisation peut avoir plusieurs roles selon le chantier
- les vues changent selon le role

## Validation locale

La validation locale couvre maintenant deux parcours distincts : un chantier de
demonstration relie a plusieurs organisations pour l'affichage par role, et un
etat vide Supabase reel quand aucun chantier exploitable n'existe encore sur le
perimetre courant.

## Points de securite

- acces chantier derive des rattachements `organization_members` + `project_organizations`
- RLS active sur `projects` et `project_organizations`
- creation et mise a jour de chantier reservees aux gestionnaires de l'organisation proprietaire
- aucun chantier non rattache n'est expose dans la demo locale
- un perimetre Supabase vide n'est plus masque par un faux chantier de demonstration

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale des vues par role chantier : OK
- validation locale de l'etat vide Supabase pour les chantiers : OK
