# Phase 31 - Validation d'integration Supabase locale

## Objectif

Valider les migrations d'exploitation dans un vrai PostgreSQL Supabase local,
sans reinitialiser la base et sans persister les donnees de test.

## Livrables

- commande `npm run supabase:verify-migrations`
- application non destructive des migrations en attente
- lint du schema local
- scenario SQL transactionnel sous roles `authenticated` et `service_role`
- approbation reelle d'une demande WhatsApp factice
- verification de l'evenement de revue
- purge reelle d'une commande, de son journal et d'une alerte expires
- `ROLLBACK` final systematique

## Decisions

- aucun `supabase db reset` n'est utilise
- le scenario ne depend d'aucun compte ou identifiant reel
- l'adresse de test utilise le domaine reserve `.invalid`
- les identifiants UUID de test sont fixes et encapsules dans la transaction
- toute assertion SQL echoue avec `ON_ERROR_STOP`
- aucune URL ou cle Supabase distante n'est lue par le scenario

## Validation locale du 2026-08-12

- Docker Desktop `28.3.2` demarre
- `18` migrations detectees
- migrations phases 27 a 30 appliquees sans reset
- `supabase db lint` : aucune erreur de schema
- revue WhatsApp : statut `approved`
- journal de revue : `1` evenement
- purge : `1` commande et `1` alerte supprimees dans la transaction
- cascade : `0` evenement restant apres purge
- transaction annulee par `ROLLBACK`
- `npm run verify` : `65` fichiers et `290` tests passes, build vert
- `npm audit --omit=dev` : `0` vulnerabilite detectee

## Limites explicites

- ce resultat valide le PostgreSQL local, pas le projet Supabase distant
- les autres services locaux Supabase etaient arretes ; seul PostgreSQL etait necessaire
- aucun bucket Storage metier n'existe encore dans AdminBTP
- le futur archivage binaire doit commencer par un vrai contrat de pieces jointes, pas par des blobs fictifs
