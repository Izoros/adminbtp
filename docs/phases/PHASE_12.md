# Phase 12 - Espace client

## Perimetre livre

- schema SQL `client_portal_accesses`
- schema SQL `client_feedback_threads`
- types TypeScript de l'espace client
- services de filtrage par organisation cliente
- page `/client-space`
- tests des acces et des actions client

## Validation cible

- le client ne voit que ses donnees
- il peut valider, refuser ou commenter

## Validation locale

La page `/client-space` expose uniquement les elements lies a
`org_client_004`, une action cliente simulee et un fil de commentaires
associe a une validation.

## Points de securite

- filtrage strict par `clientOrganizationId`
- aucun element d'un autre client n'est expose
- les actions client restent bornees a des statuts simples et auditables

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale de l'isolation client : OK
