# Checklist de release

## Avant merge dans `develop`

- ticket GitHub rattache a la phase ou au module
- code relu
- documentation mise a jour
- `npm run verify` passe
- le smoke local sur build passe

## Avant merge dans `main`

- validation metier effectuee
- verification manuelle des parcours critiques
- impact SQL identifie
- variables d'environnement verifiees
- rollback prepare
- `npm run verify:prod` passe pour l'environnement cible
- les parcours critiques automatisees ne remontent ni `5xx`, ni page d erreur Next.js/Vercel, ni `content-type` inattendu

## Parcours critiques a verifier

- connexion `/login`
- cockpit `/admin`
- supervision des archives `/admin/archives`
- supervision des commandes `/admin/commands`
- supervision des alertes `/admin/alerts`
- isolation multi-tenant `/organizations`
- vue chantier `/projects`
- documents `/documents`
- validations `/signatures`
- workflows `/n8n`
- consulting `/consulting`
- IA `/ai`
- espace client `/client-space`
- relances `/followups`
- sante `/api/health`

## Verification securite minimale

- pas de secret en dur
- en-tetes HTTP actifs
- pas d'action IA irreversible sans validation
- une approbation WhatsApp reste sans effet metier tant qu'aucun moteur borne n'est livre
- pas de fuite inter-organisation
- webhook WhatsApp ferme sans challenge et passerelle desactivee sans configuration complete
- crons refuses sans `CRON_SECRET` et alertes externes desactivees sans configuration complete
- `npm run audit:prod` analyse et documente
- les alertes ou risques de dependances sont traces dans [docs/SECURITY.md](/Users/symba/Documents/9_AdminBTP/docs/SECURITY.md:1)
