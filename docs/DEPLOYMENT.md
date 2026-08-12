# Deploiement AdminBTP

## Objectif

Ce document sert de runbook minimal pour deployer AdminBTP en environnement
de preproduction ou de production avec `Vercel` et `Supabase`.

## Statut actuel

Deploiement de production effectue le `2026-05-26`.

- projet Vercel : `adminbtp`
- statut Vercel : `READY`
- alias principal : [adminbtp.vercel.app](https://adminbtp.vercel.app)
- URL de deploiement : [adminbtp-ovohepeob-izoros-projects.vercel.app](https://adminbtp-ovohepeob-izoros-projects.vercel.app)

Remarques :

- l'application publique repond en `200` sur l'alias principal
- la route `/api/health` repond en `200`
- le projet Vercel doit rester configure avec `framework = nextjs`
- le projet Vercel doit rester configure avec `rootDirectory = apps/web`
- un deploiement lance depuis `apps/web` cassera le chemin de build en monorepo
- le depot GitHub source du projet est [Izoros/adminbtp](https://github.com/Izoros/adminbtp)

## Prerequis

- projet Vercel cree
- projet Supabase cree
- variables d'environnement renseignees
- CI GitHub active
- Docker Desktop actif pour valider la stack Supabase en local

## Variables a configurer

Voir [.env.example](/Users/symba/Documents/9_AdminBTP/.env.example:1).

Variables minimales :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_SHARED_SECRET`

Variables conditionnelles pour la passerelle WhatsApp :

- `ADMINBTP_WHATSAPP_COMMANDS_ENABLED`
- `ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `ADMINBTP_WHATSAPP_APP_SECRET`
- `ADMINBTP_WHATSAPP_ALLOWED_SENDERS`

Voir le runbook [WHATSAPP_COMMAND_GATEWAY.md](/Users/symba/Documents/9_AdminBTP/docs/WHATSAPP_COMMAND_GATEWAY.md:1). La valeur
`ADMINBTP_WHATSAPP_COMMANDS_ENABLED` doit rester a `false` jusqu'au test controle.

## Verification avant deploiement

Executer depuis la racine du depot :

```bash
npm install
npm run verify
npm run verify:prod
```

Verifier egalement :

- le build passe localement
- le smoke local sur build passe aussi via `scripts/verify-smoke.sh`
- la route `/api/health` repond
- les migrations SQL a appliquer sont identifiees
- les secrets ne sont pas commites

## Ordre de deploiement recommande

1. appliquer les migrations versionnees de `supabase/migrations` sur la base cible
2. configurer les variables d'environnement dans Vercel
3. verifier le parametrage Vercel du monorepo
4. deployer depuis la racine du depot
5. valider les parcours critiques avec le smoke automatise puis un controle manuel cible
6. promouvoir sur `main`

Commande de production :

```bash
npx vercel deploy --prod --yes --scope izoros-projects --project adminbtp
```

## Controles post-deploiement

- lancer `npm run verify:prod` pour controler les parcours critiques publies
- ouvrir `/login`
- ouvrir `/projects`
- ouvrir `/ai`
- verifier `/api/health`
- verifier les entetes HTTP de securite
- verifier les logs d'execution Vercel
- verifier que `/` et `/api/health` repondent en `200`
- verifier que le deploiement pointe bien vers le projet `adminbtp`
- verifier que le smoke couvre au minimum `/`, `/login`, `/admin`, `/admin/archives`, `/admin/commands`, `/organizations`, `/projects`, `/documents`, `/signatures`, `/n8n`, `/consulting`, `/ai`, `/client-space` et `/followups`
- verifier que `npm run verify:prod` controle aussi les en-tetes `CSP`, `HSTS`, `nosniff`, `DENY` et `permissions-policy`
- verifier qu aucune route smoke ne remonte une page d erreur Next.js ou Vercel apres redirection

## Rollback

En cas d'incident :

1. revenir a la version precedente sur Vercel
2. geler les merges sur `main`
3. analyser les logs
4. corriger sur une branche `feature/...`
5. relancer `npm run verify` avant redeploiement
