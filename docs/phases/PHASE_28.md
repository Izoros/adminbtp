# Phase 28 - Alertes d'exploitation des archives

## Objectif

Detecter les archives en echec, bloquees ou en retard et preparer une livraison
externe fiable, auditable et desactivee par defaut.

## Livrables

- table `operations_alerts`
- fonction atomique `claim_operations_alert`
- detection des trois anomalies d'archivage
- deduplication et reprise apres dix minutes
- filtre HTTPS, liste blanche d'hotes et refus des destinations privees
- payload externe minimal sans metadonnee sensible d'archive
- cron quotidien `/api/cron/operations-alerts`
- tableau `/admin/alerts` reserve aux administrateurs plateforme
- runbook `docs/OPERATIONS_ALERTS.md`

## Decisions

- aucun appel sortant si l'archivage ou les alertes sont desactives
- aucune URL n'est acceptee sans hote explicitement autorise
- une erreur HTTP externe est journalisee sans stocker le corps de reponse
- la cadence reste quotidienne pour respecter deux crons sur Vercel Hobby
- le cron d'alertes passe trente minutes apres le cron d'archivage

## Validation locale du 2026-08-12

- tests alertes, cron et pages admin cibles : `5` fichiers, `15` tests passes
- lint cible : passe
- typecheck cible : passe
- `npm run verify` : passe
- garde-fous serveur : `26` tests passes
- suite complete : `62` fichiers, `282` tests passes
- build : Next.js `16.3.0`, `30` pages generees
- smoke production local : parcours critiques et deux refus cron en `401` passes
- `npm audit --omit=dev` : `0` vulnerabilite detectee

## Limites explicites

- la migration n'est pas appliquee sur un Supabase distant dans ce lot
- aucun webhook externe ni secret d'alerte n'est configure
- la production garde les alertes desactivees
- la cadence quotidienne n'est pas un monitoring temps reel
