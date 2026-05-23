# Phase 3 - Phases chantier configurables

## Perimetre livre

- schema SQL `project_phase_templates`
- schema SQL `project_phases`
- schema SQL `phase_checklist_items`
- schema SQL `phase_alerts`
- fonction SQL `can_complete_phase`
- types TypeScript du module `phases`
- moteur local de profils metier MOE, MOA, TCE et entreprise de lot
- reader Supabase pour `project_phases`, `phase_checklist_items` et `phase_alerts`
- actions serveur Supabase pour cocher une checklist, faire evoluer un statut de phase et resoudre une alerte
- fallback demonstration si le scope chantier ou la lecture base ne sont pas exploitables
- blocage de transition si checklist incomplète
- page `/phases`
- tests de profils differencies et de transition
- tests de resolution `supabase/demo` pour les phases
- tests d'ecriture Supabase et de garde-fous de scope sur les phases

## Validation cible

- MOE, MOA, TCE et entreprise de lot ont des phases differentes
- passage de phase possible avec checklist

## Validation locale

La vue locale charge maintenant Supabase cote serveur quand le scope chantier et
les donnees sont disponibles, avec bascule propre en demonstration sinon.
Quand la source reelle est disponible, l'utilisateur peut maintenant valider ou
reouvrir un item de checklist, appliquer le statut propose sur une phase et
marquer une alerte comme resolue directement depuis `/phases`.
Les jeux de donnees differencies MOA, TCE et entreprise de lot restent couverts
par les tests de module.

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
- validation lecture Supabase avec fallback demonstration : OK
- validation ecriture Supabase des checklists, statuts et alertes : OK
