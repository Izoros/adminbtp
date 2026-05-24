# Phase 10 - Expertise ingenieur / architecte HMONP

## Perimetre livre

- schema SQL de reference `database/adminbtp_consulting_foundation.sql`
- types TypeScript pour `expert_profiles`, `expert_requests`, `consulting_missions`, `consulting_hours` et `technical_reviews`
- services de liaison entre demande expert, mission, heures et avis technique
- jeu de donnees local pour la demonstration du parcours de conseil
- page `/consulting`
- tests du parcours demande -> mission -> revue technique

## Validation cible

- un client peut demander un avis expert sur un chantier ou un document

## Validation locale

La page `/consulting` expose une demande d'expertise reliee a un chantier,
sa mission de conseil associee, le suivi des heures et l'avis technique
produit par l'expert assigne. La transformation d'une demande en mission
et la saisie d'heures de conseil sont maintenant persistees dans Supabase
avec controle de scope organisation serveur. Quand Supabase est accessible
mais qu'aucune demande n'existe encore sur l'organisation courante, le module
reste maintenant en etat Supabase vide au lieu de rebasculer ou de melanger
des donnees d'une autre organisation accessible.

## Points de securite

- aucune automatisation ne produit d'avis sans pilotage humain
- le modele separe bien la demande client, la mission commercialisee et le livrable technique
- la structure est prete pour une isolation multi-organisation au niveau base et services

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du parcours de demande d'avis expert : OK
