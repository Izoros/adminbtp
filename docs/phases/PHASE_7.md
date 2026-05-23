# Phase 7 - Workflows n8n

## Perimetre livre

- endpoint `POST /api/n8n/inbound-task`
- endpoint `POST /api/n8n/validation-request`
- types TypeScript pour webhooks entrants et sortants
- creation locale d'une tache issue d'un email entrant
- preparation locale d'une validation WhatsApp
- page `/n8n`
- tests des contrats de workflow

## Validation cible

- n8n peut creer une tache dans AdminBTP via API
- n8n peut recevoir une demande de validation

## Validation locale

La page `/n8n` expose un exemple de webhook entrant transforme en tache et un
exemple de charge utile sortante pour validation WhatsApp.

## Points de securite

- contrats API minimaux et explicites
- aucune action irreversible cote IA
- payloads prepares avant tout branchement n8n reel
- aucune dependance externe obligatoire pour la validation locale

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du webhook entrant et de la demande de validation : OK
