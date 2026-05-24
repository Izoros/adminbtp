# Phase 5 - Signatures et validations

## Perimetre livre

- schema SQL `signature_profiles`
- schema SQL `signature_requests`
- schema SQL `audit_logs`
- types TypeScript du module `signatures`
- circuit local de validation interne
- preparation et persistance d'un payload de validation WhatsApp exploitable
- journal d'audit local
- page `/signatures`
- tests de transitions et de tracabilite

## Validation cible

- un document passe par un circuit de validation
- chaque action est tracee

## Validation locale

La page `/signatures` expose une demande de validation, les transitions
autorisees, le journal d'audit et une charge utile WhatsApp preparatoire.
Quand une demande passe en `pending_signature`, le payload WhatsApp est
maintenant prepare puis persiste dans `signature_requests.whatsapp_payload`
pour pouvoir etre relu, audite et reutilise par les integrations aval.
Quand Supabase est accessible mais que le jeu de donnees est vide ou partiellement
incomplet, la page conserve des etats `supabase` explicites et n'injecte plus de
fausses donnees de demonstration ni de faux journal d'audit.

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
