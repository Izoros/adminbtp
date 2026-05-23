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

## Points de vigilance

- le `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais etre expose au navigateur
- les webhooks `n8n` doivent etre proteges par `ADMINBTP_N8N_WEBHOOK_TOKEN`
- les futures integrations Gmail, Outlook et Odoo devront etre journalisees
- les uploads documentaires devront etre controles par type et taille
- un `200` HTTP seul ne suffit pas: les controles smoke doivent aussi rejeter les pages d erreur Next.js ou Vercel servies avec un statut trompeur
- toute route critique exposee doit continuer a servir un `content-type` coherent apres redirection d authentification
- `npm audit --omit=dev` remonte encore `2` vulnerabilites moderees transitives sur `next -> postcss`, sans correctif non cassant applique

## Procedure minimale en cas d'incident

1. isoler la fonctionnalite concernee
2. verifier les logs d'execution
3. suspendre les automations si necessaire
4. revenir a la version precedente si l'incident est en production
5. documenter le correctif et le test de non-regression
