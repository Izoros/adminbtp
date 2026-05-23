# Phase 5 - Signatures et validations

## Perimetre livre

- schema SQL `signature_profiles`
- schema SQL `signature_requests`
- schema SQL `audit_logs`
- types TypeScript du module `signatures`
- circuit local de validation interne
- preparation d'un message de validation WhatsApp
- journal d'audit local
- page `/signatures`
- tests de transitions et de tracabilite

## Validation cible

- un document passe par un circuit de validation
- chaque action est tracee

## Validation locale

La page `/signatures` expose une demande de validation, les transitions
autorisées, le journal d'audit et une charge utile WhatsApp preparatoire.

## Points de securite

- profils de signature reserves aux membres de l'organisation
- gestion reservee aux responsables d'organisation
- audit log en lecture reservee aux membres de l'organisation
- aucune approbation finale sans respect de la sequence de validation

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du circuit et de la tracabilite : OK
