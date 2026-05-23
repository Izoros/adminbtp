# Phase 7 - Workflows n8n

## Perimetre livre

- endpoint `POST /api/n8n/inbound-task`
- endpoint `POST /api/n8n/validation-request`
- types TypeScript pour webhooks entrants et sortants
- creation locale d'une tache issue d'un email entrant
- preparation d'une validation WhatsApp a partir du payload entrant ou d'une demande de signature persistée
- page `/n8n`
- tests des contrats de workflow

## Validation cible

- n8n peut creer une tache dans AdminBTP via API
- n8n peut recevoir une demande de validation

## Validation locale

La page `/n8n` expose un exemple de webhook entrant transforme en tache et un
exemple de charge utile sortante pour validation WhatsApp. La route de
validation sait maintenant reutiliser en priorite un payload WhatsApp deja
persiste sur une `signature_request`, avec repli sur les champs fournis dans le
webhook si besoin.

## Points de securite

- contrats API minimaux et explicites
- aucune action irreversible cote IA
- payloads prepares avant envoi, avec reutilisation prioritaire des donnees persistees
- aucune dependance externe obligatoire pour la validation locale

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du webhook entrant et de la demande de validation : OK
- validation locale de la resolution depuis `signature_requests.whatsapp_payload` : OK
