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
- journal d'execution `archive_runs` reserve au role serveur
- relecture et verification SHA-256 de l'artefact stocke

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

## Journal des executions

La migration `20260811194500_archive_runs.sql` ajoute un journal serveur qui
conserve pour chaque execution active :

- le statut `running`, `succeeded` ou `failed`
- le mode de stockage `local` ou `sftp`
- le nom et le chemin de l'archive
- le checksum SHA-256 et la taille de l'artefact
- la version du format et la retention cible
- la synthese des volumes exportes
- le resultat et la date de verification
- un message d'erreur borne en cas d'echec

Les roles `anon` et `authenticated` n'ont aucun droit direct sur cette table.
Le cron utilise exclusivement la cle `SUPABASE_SERVICE_ROLE_KEY` cote serveur.

## Verification apres stockage

Une execution n'est marquee `succeeded` qu'apres les controles suivants :

1. ecriture de l'archive sur la cible
2. relecture du fichier local ou telechargement du fichier SFTP
3. comparaison de la taille et du checksum SHA-256
4. decompression gzip et lecture JSON
5. verification des metadonnees et des collections metier minimales

Un ecart de contenu, une archive illisible ou une lecture distante impossible
fait echouer le cron et marque l'execution `failed`.

## Supervision admin

La route `/admin/archives` expose un tableau de supervision strictement serveur :

- verification de la session Supabase
- verification du role par `public.is_platform_admin()`
- creation du client `service_role` uniquement apres autorisation
- chargement des `50` executions les plus recentes
- signal critique sur le dernier echec ou une execution bloquee
- signal d'attention si aucune archive reussie n'existe depuis plus de `26` heures

Une execution `running` depuis plus de `15` minutes est consideree comme bloquee.
Les chemins, checksums et messages d'erreur ne sont jamais envoyes a un
utilisateur non administrateur. Cette supervision applicative ne remplace pas
encore une alerte externe lorsque personne ne consulte le cockpit.

## Test de restauration

Les tests automatises restaurent le payload logique depuis l'archive compressee
et refusent un artefact corrompu. Cette verification confirme la lisibilite du
format ; elle ne rejoue pas encore les lignes dans une base Supabase vierge.

Avant activation definitive sur LWS :

1. appliquer la migration `archive_runs` sur Supabase
2. declencher une execution controlee avec les secrets SFTP cibles
3. verifier le statut `succeeded`, le checksum et le chemin distant
4. telecharger l'archive et refaire la verification hors de Vercel
5. documenter un exercice de restauration dans un environnement isole

## Limites actuelles

- l'archive est aujourd'hui logique et structuree, pas une copie binaire de buckets objets
- si des pieces binaires sont ensuite placees dans Supabase Storage, il faudra ajouter un export des blobs ou une replication de bucket
- la retention de `25` ans doit aussi etre contractualisee et verifiee cote hebergeur, pas seulement cote application
- la restauration automatisee vers une base vierge n'est pas encore implementee
- aucun transfert reel vers LWS n'est lance par les tests locaux ou la validation standard

## Extension recommandee

Etape suivante recommandee :

1. ajouter une retention immuable ou WORM si l'offre cible le permet
2. sauvegarder ou repliquer les pieces binaires Supabase Storage
3. envoyer une alerte externe sur les executions `failed` ou restees `running`
4. automatiser un exercice de restauration dans un environnement isole
