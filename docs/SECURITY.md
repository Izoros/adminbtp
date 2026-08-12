# Securite AdminBTP

## Principes

- isolation stricte entre organisations
- validation humaine obligatoire pour l'IA
- tracabilite des actions sensibles
- secrets hors depot

## Mesures deja en place

- base multi-tenant preparee avec RLS au niveau SQL sur le socle auth
- en-tetes HTTP de securite dans [apps/web/next.config.ts](/Users/symba/Documents/9_AdminBTP/apps/web/next.config.ts:1)
- route de sante pour monitoring dans [apps/web/src/app/api/health/route.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/api/health/route.ts:1)
- verification smoke automatisee des parcours critiques via `scripts/verify-smoke.sh`
- verification distante automatisee via `npm run verify:prod`
- audit des suggestions IA dans le module `ai`
- filtrage de l'espace client par organisation
- routes `/admin` protegees par session Supabase
- journal `/admin/archives` autorise par `is_platform_admin` avant toute creation du client `service_role`
- file `/admin/commands` autorisee par `is_platform_admin` avant toute lecture `service_role`
- webhook WhatsApp verifie par signature HMAC, liste blanche E.164 et interrupteur serveur desactive par defaut
- numeros WhatsApp remplaces par une empreinte HMAC avant persistance
- decisions WhatsApp atomiques, journalisees et controlees a la fois dans la Server Action et PostgreSQL
- outbox d'alertes exploitee par reservation atomique et visible uniquement par les administrateurs plateforme
- destinations d'alerte limitees a HTTPS et a une liste blanche d'hotes, avec refus des adresses locales/privees
- purge quotidienne `service_role` des commandes a 90 jours et alertes a 365 jours
- contrats de role et de purge verifies dans PostgreSQL local par transaction avec rollback
- tableau `/admin/readiness` autorise avant lecture des variables et limite a des indicateurs sans valeur sensible
- modules qui manipulent `SUPABASE_SERVICE_ROLE_KEY` marques `server-only`
- adaptateur Odoo marque `server-only`, limite a HTTPS, liste blanche, modeles et methodes explicites
- cle API et base Odoo reduites a des indicateurs de presence dans les modeles de vue
- mappings sociaux limites aux identifiants, sans copie de bulletin ni montant salarial
- `internal_role` non modifiable par `authenticated`, avec droits de colonne et trigger de defense en profondeur
- helpers des politiques RLS en `SECURITY DEFINER`, `search_path` fige et droits d'execution minimaux
- `org_viewer` en lecture seule sur la gouvernance IA
- redirections post-authentification validees par comparaison d'origine
- webhooks `n8n` fermes avec `503` si `ADMINBTP_N8N_WEBHOOK_TOKEN` est absent
- CSP des scripts par nonce en production, HSTS, COOP et CORP actifs
- messages PostgreSQL remplaces par des codes fermes dans les URL
- erreurs de chargement du scope journalisees cote serveur sans detail restitue au client

## Points de vigilance

- le `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais etre expose au navigateur
- toute nouvelle lecture `service_role` doit etre precedee d'une autorisation utilisateur explicite et testee
- aucun tableau de configuration ne doit restituer une cle, un token, un numero, une URL complete ou une liste blanche
- les webhooks `n8n` exigent `ADMINBTP_N8N_WEBHOOK_TOKEN` et doivent rester en `503` s'il est absent
- le webhook WhatsApp ne doit jamais etre active sans secret Meta, liste blanche et migration appliquee
- aucune commande WhatsApp ne doit atteindre directement un shell, Codex ou une mutation metier
- le statut `approved` confirme seulement la revue humaine et ne vaut jamais execution
- aucun payload d'alerte externe ne doit contenir chemin, checksum, contenu ou erreur brute d'archive
- la purge d'exploitation ne doit jamais inclure les archives reglementaires conservees 25 ans
- les futures integrations Gmail et Outlook devront etre journalisees
- toute synchronisation Odoo devra ajouter idempotence, journal d'execution, reprise bornee et rapprochement
- le probe Odoo doit commencer en lecture seule et les contrats reels doivent etre confirmes sur `/doc`
- aucune donnee salariale ne doit etre copiee sans finalite, minimisation, retention et autorisation documentees
- les uploads documentaires devront etre controles par type et taille
- un `200` HTTP seul ne suffit pas: les controles smoke doivent aussi rejeter les pages d erreur Next.js ou Vercel servies avec un statut trompeur
- toute route critique exposee doit continuer a servir un `content-type` coherent apres redirection d authentification
- maintenir `next` et `eslint-config-next` sur la meme version supportee
- relancer `npm run audit:prod` apres chaque changement de dependances et avant chaque release

## Dernier audit local

- date : `2026-08-12`
- `next` et `eslint-config-next` : `16.3.0`
- `npm audit --omit=dev` : `0` vulnerabilite detectee
- `npm run verify` : lint, types, garde-fous, `316` tests et build passes
- build Next.js : `34` routes generees, dont le Proxy d'authentification, `/guide`, `/odoo`, `/admin/readiness` et `/api/cron/operations-alerts`
- audit des liens : `20` pages, `21` cibles et `19` redirections de session attendues
- `scripts/verify-smoke.sh http://127.0.0.1:3100` : parcours publics et admin passes

Ce resultat decrit l'etat local des dependances verrouillees. Il ne remplace ni
la verification de l'environnement Vercel ni un audit de securite independant.

Le rapport externe du 12 aout 2026 a ensuite declenche la phase 36. Ses constats
critiques ont ete reproduits puis corriges localement. La validation distante de
la nouvelle migration et un test d'intrusion independant restent requis avant de
declarer ces constats clos en production.

## Procedure minimale en cas d'incident

1. isoler la fonctionnalite concernee
2. verifier les logs d'execution
3. suspendre les automations si necessaire
4. revenir a la version precedente si l'incident est en production
5. documenter le correctif et le test de non-regression
