# Module emails

Module reserve aux boites generiques, emails et rattachements metier.

## Notes d'integration

- lecture Supabase avec fallback demo si la configuration ou les droits ne permettent pas l'acces
- page `/emails` filtrable par `organizationId`, `mailboxAddress` ou `mailboxId`
- routes n8n durcies avec validation JSON et token optionnel via `ADMINBTP_N8N_WEBHOOK_TOKEN`
