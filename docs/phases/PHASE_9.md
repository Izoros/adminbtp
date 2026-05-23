# Phase 9 - Odoo

## Perimetre livre

- schema SQL `odoo_mappings`
- types TypeScript pour les liaisons Odoo
- mappings locaux client, facturation, abonnement et prestation conseil
- page `/odoo`
- tests de recherche de mapping et de filtrage par type

## Validation cible

- une organisation AdminBTP peut etre reliee a un contact/client Odoo

## Validation locale

La page `/odoo` expose une liaison organisation -> contact Odoo, puis les
correspondances de facturation, abonnement et prestation conseil.

## Points de securite

- mappings reserves aux membres de l'organisation
- aucun appel live a Odoo en phase 9
- structure prete pour une synchronisation ulterieure tracee

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du mapping organisation -> client Odoo : OK
