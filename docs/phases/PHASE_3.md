# Phase 3 - Phases chantier configurables

## Perimetre livre

- schema SQL `project_phase_templates`
- schema SQL `project_phases`
- schema SQL `phase_checklist_items`
- schema SQL `phase_alerts`
- fonction SQL `can_complete_phase`
- types TypeScript du module `phases`
- moteur local de profils metier MOE, MOA, TCE et entreprise de lot
- blocage de transition si checklist incomplète
- page `/phases`
- tests de profils differencies et de transition

## Validation cible

- MOE, MOA, TCE et entreprise de lot ont des phases differentes
- passage de phase possible avec checklist

## Validation locale

La vue locale affiche un parcours MOE par defaut et expose des jeux de donnees
distincts pour MOA, TCE et entreprise de lot dans les tests de module.

## Points de securite

- lecture des phases reservee aux membres du chantier
- gestion reservee aux gestionnaires du chantier
- aucune transition finale sans checklist obligatoire complete
- alertes rattachees a la phase et heritant des droits chantier

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale des profils MOE, MOA, TCE et entreprise de lot : OK
