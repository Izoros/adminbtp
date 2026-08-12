# Phase 30 - Retention automatique des donnees d'exploitation

## Objectif

Appliquer effectivement les durees de conservation des demandes WhatsApp et
des alertes d'exploitation, sans ajouter un troisieme cron Vercel.

## Livrables

- date `retention_until` sur les alertes d'exploitation
- conservation des alertes pendant 365 jours
- conservation des commandes WhatsApp pendant 90 jours
- fonction serveur `purge_expired_operations_data`
- suppression en cascade des evenements de revue lies a une commande expiree
- compteurs de purge retournes au cron
- execution quotidienne avant l'analyse des alertes

## Decisions

- la fonction est inaccessible a `anon` et `authenticated`
- seul le `service_role` peut lancer la purge
- la date du cron est passee explicitement a PostgreSQL pour rendre les tests deterministes
- toute commande arrivee a `retention_until` est supprimee, quel que soit son statut
- le journal de revue suit la meme retention que sa commande par cascade
- les alertes sont supprimees a leur propre echeance apres 365 jours

## Validation locale du 2026-08-12

- tests retention, cron et alertes cibles : `4` fichiers, `15` tests passes
- lint cible : passe
- typecheck cible : passe
- `npm run verify` : passe
- garde-fous serveur : `26` tests passes
- suite complete : `65` fichiers, `290` tests passes
- build : Next.js `16.3.0`, `30` pages generees
- `npm audit --omit=dev` : `0` vulnerabilite detectee

## Limites explicites

- la purge distante ne demarre qu'apres application de la migration et configuration de `CRON_SECRET`
- aucune donnee de production n'a ete supprimee pendant le developpement
- la retention des archives longue duree reste fixee a 25 ans et n'est pas concernee
- les pieces binaires Supabase Storage ne sont pas encore traitees par cette purge
