# Phase 6 - Mails et boites generiques

## Perimetre livre

- schema SQL `mailboxes`
- schema SQL `emails`
- types TypeScript du module `emails`
- action serveur de creation de boite generique
- action serveur de reclassement email
- rattachement metier organisation / chantier / tache persiste dans Supabase
- preparation Gmail et Outlook documentee
- page `/emails`
- tests de creation de boite, reclassement, scope serveur et liaison metier

## Validation cible

- un mail peut etre rattache a une organisation, un chantier et une tache

## Validation locale

La page `/emails` expose une boite `client@adminbtp.yt`, deux emails de
demonstration et un formulaire de reclassement/rattachement qui persiste
`classification`, `project_id` et `related_task_id` dans Supabase quand la
session et le scope serveur sont disponibles. Quand Supabase est accessible
mais qu'aucune boite n'existe encore, la page reste maintenant en vrai mode
Supabase vide et permet de creer une boite generique depuis l'interface.

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
- validation locale de creation de boite generique et de l'etat vide Supabase : OK
