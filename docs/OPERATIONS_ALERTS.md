# Alertes d'exploitation AdminBTP

## Objectif

Detecter et signaler les anomalies d'archivage sans transmettre les contenus,
chemins, checksums, identifiants d'organisation ou erreurs detaillees a un
service externe.

## Anomalies detectees

- `archive_failed` : execution terminee en echec dans les dernieres 48 heures
- `archive_stalled` : execution encore active apres 15 minutes
- `archive_overdue` : aucune archive reussie depuis plus de 26 heures

L'alerte de retard est dedupliquee par jour. Les alertes d'echec et de blocage
sont dedupliquees par execution d'archive.

## Outbox et livraison

La fonction SQL `claim_operations_alert` reserve atomiquement une alerte. Une
alerte deja livree ou encore en cours n'est pas renvoyee. Une alerte en echec
ou bloquee en `dispatching` peut etre reprise apres dix minutes. La livraison
est donc au moins une fois : le destinataire doit aussi dedupliquer `alertId`.

Le payload externe contient uniquement :

- version du schema
- identifiant d'alerte
- type et severite
- titre generique
- date de l'evenement
- identifiant technique de l'execution concernee

Le corps de l'archive, son chemin, son checksum et l'erreur source restent dans
AdminBTP.

## Variables serveur

```bash
ADMINBTP_OPERATIONS_ALERTS_ENABLED=false
ADMINBTP_OPERATIONS_ALERT_WEBHOOK_URL=https://alerts.example.com/adminbtp
ADMINBTP_OPERATIONS_ALERT_WEBHOOK_TOKEN=
ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS=alerts.example.com
```

La destination doit etre en HTTPS, sans identifiants dans l'URL, hors reseau
local/prive et presente exactement dans la liste des hotes autorises.

## Planification

Vercel appelle `/api/cron/operations-alerts` tous les jours a `01:47 UTC`, soit
trente minutes apres le cron d'archivage. La route exige
`Authorization: Bearer ${CRON_SECRET}`.

Cette cadence quotidienne respecte la limite de deux crons et la cadence
minimale du plan Vercel Hobby. Une supervision plus rapide exigera un plan qui
autorise une frequence superieure ou un ordonnanceur externe controle.

Avant chaque analyse, le meme cron appelle `purge_expired_operations_data` :

- demandes et journaux WhatsApp : 90 jours
- alertes d'exploitation : 365 jours

Cette purge ne concerne jamais les archives reglementaires conservees 25 ans.

## Activation controlee

1. appliquer `20260812143000_operations_alerts.sql`, puis `20260812173000_operations_retention.sql`
2. verifier que `archive_runs` est deja appliquee et alimentee
3. creer un endpoint HTTPS qui valide le bearer token
4. ajouter son hote exact a `ADMINBTP_OPERATIONS_ALERT_ALLOWED_HOSTS`
5. renseigner l'URL et un token aleatoire dans Vercel
6. conserver `ADMINBTP_OPERATIONS_ALERTS_ENABLED=false`
7. tester la route en preproduction avec un jeu d'archives controle
8. activer, puis verifier l'outbox sur `/admin/alerts`

## Arret d'urgence

Passer `ADMINBTP_OPERATIONS_ALERTS_ENABLED=false` et redeployer. Le cron repond
alors avec un resultat desactive et aucun appel HTTP sortant n'est effectue.
