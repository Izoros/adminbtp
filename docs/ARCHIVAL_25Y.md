# Archivage 25 Ans — Marches AdminBTP

## Objectif

Mettre en place un archivage longue duree des marches BTP et de leurs pieces associees :

- documents
- PV
- circuits de signature
- situations et relances
- missions d'assistance et avis techniques

L'objectif vise une conservation organisee sur `25` ans avec une exportation quotidienne vers un espace cloud externe dedie.

## Cible technique retenue

- declenchement par `Vercel Cron`
- endpoint protege par `CRON_SECRET`
- extraction logique depuis Supabase avec `SUPABASE_SERVICE_ROLE_KEY`
- generation d'une archive `json.gz`
- depot sur un espace `LWS` via `SFTP`

## Pourquoi ce choix

- `Vercel` sait appeler une route cron via HTTP en production
- `CRON_SECRET` permet de proteger l'invocation
- `LWS` expose des solutions de sauvegarde cloud accessibles en `SFTP`, `SCP` et `Rsync`
- `LWS` communique aussi sur un stockage securise et doublement replique

## Endpoint

- route : `/api/cron/market-archive`
- frequence actuelle : tous les jours a `01:17 UTC`

## Variables d'environnement requises

```bash
CRON_SECRET=
MARKET_ARCHIVE_ENABLED=true
MARKET_ARCHIVE_RETENTION_YEARS=25
MARKET_ARCHIVE_SFTP_HOST=
MARKET_ARCHIVE_SFTP_PORT=22
MARKET_ARCHIVE_SFTP_USERNAME=
MARKET_ARCHIVE_SFTP_PASSWORD=
MARKET_ARCHIVE_SFTP_PRIVATE_KEY=
MARKET_ARCHIVE_REMOTE_BASE_PATH=/adminbtp/archives
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
```

## Mode local

Pour valider le flux sans envoyer vers LWS :

```bash
MARKET_ARCHIVE_ENABLED=true
MARKET_ARCHIVE_LOCAL_DIR=.archives
```

Dans ce mode, le cron ecrit les archives localement au lieu de pousser en `SFTP`.

## Arborescence distante

Les archives sont classees par date :

```text
/adminbtp/archives/YYYY/MM/DD/market-archive-<timestamp>.json.gz
```

Exemple :

```text
/adminbtp/archives/2026/05/25/market-archive-2026-05-25T01-17-00-000Z.json.gz
```

## Contenu exporte

L'archive contient actuellement :

- organisations
- projects
- document_templates
- documents
- signature_requests
- situations
- payment_followups
- consulting_missions
- consulting_hours
- expert_requests
- technical_reviews

## Limites actuelles

- l'archive est aujourd'hui logique et structuree, pas une copie binaire de buckets objets
- si des pieces binaires sont ensuite placees dans Supabase Storage, il faudra ajouter un export des blobs ou une replication de bucket
- la retention de `25` ans doit aussi etre contractualisee et verifiee cote hebergeur, pas seulement cote application

## Extension recommandee

Etape suivante recommandee :

1. ajouter un journal `archive_runs` en base
2. stocker les checksums et chemins distants
3. verifier automatiquement la lisibilite de l'archive distante
4. ajouter une retention immuable ou WORM si l'offre cible le permet
