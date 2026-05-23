# Phase 6 - Mails et boites generiques

## Perimetre livre

- schema SQL `mailboxes`
- schema SQL `emails`
- types TypeScript du module `emails`
- classification manuelle locale
- rattachement metier organisation / chantier / tache
- preparation Gmail et Outlook documentee
- page `/emails`
- tests de reclassement et de liaison metier

## Validation cible

- un mail peut etre rattache a une organisation, un chantier et une tache

## Validation locale

La page `/emails` expose une boite `client@adminbtp.yt`, deux emails de
demonstration et un reclassement manuel par categorie.

## Points de securite

- boites reservees aux membres de l'organisation
- gestion reservee aux responsables d'organisation
- classification manuelle avant toute automatisation
- aucune dependance live Gmail ou Outlook introduite a ce stade

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du rattachement organisation / chantier / tache : OK
