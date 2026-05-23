# Phase 9 - Odoo

## Perimetre livre

- schema SQL `odoo_mappings`
- types TypeScript pour les liaisons Odoo
- reader Supabase pour les mappings Odoo avec fallback demonstration
- mappings client, facturation, abonnement et prestation conseil
- page `/odoo` branchee sur le reader serveur
- tests de recherche de mapping, filtrage par type et fallback de lecture

## Validation cible

- une organisation AdminBTP peut etre reliee a un contact/client Odoo

## Validation locale

La page `/odoo` expose une liaison organisation -> contact Odoo, puis les
correspondances de facturation, abonnement et prestation conseil. La lecture
se fait depuis Supabase quand la configuration et le scope serveur sont
disponibles, sinon la page rebascule proprement sur les donnees de
demonstration.

## Points de securite

- mappings reserves aux membres de l'organisation
- aucun appel live a Odoo en phase 9
- structure prete pour une synchronisation ulterieure tracee
- fallback demonstration si Supabase est indisponible ou vide sur ce perimetre

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du mapping organisation -> client Odoo : OK
- validation de la lecture Supabase filtree par scope organisation : OK
