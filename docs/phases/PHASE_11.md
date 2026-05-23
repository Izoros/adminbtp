# Phase 11 - IA metier

## Perimetre livre

- schema SQL `ai_suggestions`
- schema SQL `ai_suggestion_audit_logs`
- types TypeScript pour les suggestions IA et leur audit
- services de gouvernance pour proposer, approuver, rejeter et appliquer
- page `/ai`
- tests des garde-fous de validation humaine et de tracabilite

## Validation cible

- IA ne modifie rien sans validation humaine
- toutes les propositions IA sont tracables

## Validation locale

La page `/ai` expose des suggestions de resume de mail, de classification
documentaire, de projet de courrier et de recherche intelligente, avec un
etat de validation humaine et un journal d'audit associe.

## Points de securite

- aucune suggestion IA n'est appliquee sans approbation explicite
- chaque proposition conserve un `promptSnapshot` et un audit associe
- la couche IA reste non destructive et preparee pour des integrations futures

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale des garde-fous IA : OK
