# AdminBTP - Roadmap de developpement

## Objectif

Le projet AdminBTP doit etre developpe par phases courtes, validables et parallelisables afin de permettre a plusieurs developpeurs ou agents IA de travailler simultanement sans casser l'architecture.

## Principes obligatoires

- architecture monorepo
- branches Git par module
- tickets GitHub par fonctionnalite
- validation obligatoire a chaque phase
- tests avant merge
- documentation mise a jour a chaque livraison

## Organisation Git

### Branches de reference

- `main` : version stable
- `develop` : integration
- `feature/auth`
- `feature/organizations`
- `feature/projects`
- `feature/documents`
- `feature/signatures`
- `feature/n8n`
- `feature/odoo`
- `feature/ui-dashboard`

### Regles de branchement

- Chaque phase doit etre decoupee en tickets GitHub courts et explicites.
- Chaque ticket doit cibler une branche `feature/...` rattachee a un module.
- Les branches transverses doivent rester exceptionnelles.
- Aucun merge dans `main` sans passage par `develop`, tests et validation.

## Modele d'architecture

La meilleure organisation repose sur une logique `core + modules`.

### Core obligatoire

- auth
- organizations
- permissions
- audit logs
- design system

### Modules independants

- projects
- documents
- signatures
- emails
- n8n
- odoo
- consulting
- ai

## Structure recommandee

Dans `apps/web` :

```text
src/
├── app/
├── components/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── projects/
│   ├── phases/
│   ├── documents/
│   ├── signatures/
│   ├── emails/
│   ├── followups/
│   ├── consulting/
│   ├── ai/
│   └── settings/
├── lib/
├── types/
└── config/
```

Chaque module doit etre isole dans son dossier avec :

- types
- composants
- services
- hooks
- tests
- documentation

## Regle absolue

Aucun developpeur ne doit modifier le core sans validation.

## Definition of Done par phase

Chaque phase doit livrer :

1. code fonctionnel
2. types TypeScript
3. schema SQL si besoin
4. pages UI si besoin
5. tests minimum
6. documentation
7. checklist de validation

## Processus obligatoire avant chaque nouvelle phase

Avant chaque nouvelle phase, Codex doit :

1. lire `README.md`
2. lire `docs/CDC/AdminBTP_V1.md`
3. lire `docs/ROADMAP.md`
4. verifier les types existants
5. proposer un plan court
6. coder uniquement la phase demandee
7. mettre a jour la documentation

## Phases du projet

## Etat d'avancement

- phase 0 : livree
- phase 1 : livree
- phase 2 : livree
- phase 3 : livree
- phase 4 : livree
- phase 5 : livree
- phase 6 : livree
- phase 7 : livree
- phase 8 : livree
- phase 9 : livree
- phase 10 : livree
- phase 11 : livree
- phase 12 : livree
- phase 13 : livree
- phase 14 : livree
- phase 15 : livree
- phase 16 : livree
- phase 17 : livree
- phase 18 : livree
- phase 19 : livree
- phase 20 : livree
- phase 21 : livree
- phase 22 : livree
- phase 23 : livree
- phase 24 : livree
- phase 25 : livree
- phase 26 : livree
- phase 27 : livree localement, activation externe en attente
- phase 28 : livree localement, canal d'alerte externe en attente
- phase 29 : livree localement, execution des commandes volontairement absente
- phase 30 : livree localement, purge distante en attente de migration

### PHASE 0 - Socle projet

Contenu :

- monorepo
- Next.js
- Tailwind
- Shadcn UI
- Supabase client
- README
- `.env.example`
- structure docs

Validation :

- app demarre localement
- design system de base OK
- navigation principale OK

### PHASE 1 - Authentification et multi-tenant

Contenu :

- login
- users
- organizations
- organization_members
- roles internes
- RLS Supabase

Validation :

- un utilisateur appartient a une ou plusieurs organisations
- un utilisateur ne voit pas les donnees d'une autre organisation

### PHASE 2 - Chantiers et roles projet

Contenu :

- projects
- project_organizations
- roles chantier : MOA, MOE, TCE, BET, OPC, AMO, entreprise de lot, sous-traitant
- dashboard chantier

Validation :

- une organisation peut avoir plusieurs roles selon le chantier
- les vues changent selon le role

### PHASE 3 - Phases chantier configurables

Contenu :

- phases par profil metier
- checklists par phase
- statuts
- alertes

Validation :

- MOE, MOA, TCE et entreprise de lot ont des phases differentes
- passage de phase possible avec checklist

### PHASE 4 - Base documentaire

Contenu :

- documents
- templates
- documents a entete
- logos, tampons, signatures
- generation PDF simple

Validation :

- un document peut etre genere depuis un template
- variables dynamiques remplacees correctement

### PHASE 5 - Signatures et validations

Contenu :

- signature_profiles
- signature_requests
- validation interne
- preparation validation WhatsApp
- audit log

Validation :

- un document passe par un circuit de validation
- chaque action est tracee

### PHASE 6 - Mails et boites generiques

Contenu :

- mailboxes
- emails
- adresse type `client@adminbtp.yt`
- preparation Gmail/Outlook API
- classification manuelle d'abord

Validation :

- un mail peut etre rattache a une organisation, un chantier et une tache

### PHASE 7 - Workflows n8n

Contenu :

- webhook mail entrant
- relance decompte
- document manquant
- validation WhatsApp

Validation :

- n8n peut creer une tache dans AdminBTP via API
- n8n peut recevoir une demande de validation

### PHASE 8 - Relances decomptes et tresorerie

Contenu :

- situations
- payment_followups
- echeances
- relances J+7, J+15, J+30, J+45

Validation :

- une situation genere automatiquement un planning de relance

### PHASE 9 - Odoo

Contenu :

- mapping clients
- mapping facturation
- mapping abonnements
- mapping prestations conseil

Validation :

- une organisation AdminBTP peut etre reliee a un contact/client Odoo

### PHASE 10 - Expertise ingenieur / architecte HMONP

Contenu :

- expert_profiles
- expert_requests
- consulting_missions
- technical_reviews
- suivi heures conseil

Validation :

- un client peut demander un avis expert sur un chantier ou document

### PHASE 11 - IA metier

Contenu :

- resume mail
- classification document
- generation courrier
- aide redaction PPSPS/DC4
- recherche intelligente

Validation :

- l'IA ne modifie rien sans validation humaine
- toutes les propositions IA sont tracables

### PHASE 12 - Espace client

Contenu :

- dashboard simplifie client
- documents
- validations
- relances
- tickets

Validation :

- le client ne voit que ses donnees
- il peut valider, refuser et commenter

### PHASE 13 - Production

Contenu :

- securite
- logs
- sauvegardes
- monitoring
- CI/CD
- Vercel
- Supabase prod

Validation :

- deploiement fonctionnel
- donnees protegees
- rollback possible

### PHASE 14 - Supabase local et migrations versionnees

Contenu :

- CLI Supabase integre au projet
- migrations versionnees
- seed local
- generation des types reels
- verification locale reproductible

Validation :

- `supabase start` fonctionne
- `supabase db reset` fonctionne
- `supabase gen types` fonctionne
- les clients applicatifs consomment les types generes

### PHASE 15 - CRUD Supabase reel et consolidation parallele

Contenu :

- actions serveur reelles sur les modules prioritaires
- fallback demo conserve quand Supabase est indisponible
- validations de production automatisees
- orchestration parallele par workstreams

Validation :

- `organizations` et `projects` peuvent creer des donnees reelles
- `documents` et `signatures` peuvent ecrire dans Supabase
- `emails`, `followups` et `n8n` lisent la base et valident leurs webhooks
- `consulting`, `ai` et `client-space` lisent et ecrivent selon le scope
- `npm run verify` et `npm run verify:prod` passent

### PHASE 16 - Auth reelle, garde-fous core et observabilite initiale

Contenu :

- authentification reelle Supabase par mot de passe ou lien magique
- echange de session SSR via callback et proxy
- verifications serveur avant ecriture sensible
- fonctions SQL atomiques pour creations critiques
- garde-fous RLS consolides sur `ai` et `client-space`
- protection JSON + token sur les webhooks `n8n`
- endpoint `/api/health` et verification distante automatisee

Validation :

- un utilisateur authentifie peut ouvrir une session reelle Supabase
- les creations sensibles refusent toute session absente ou non autorisee
- les webhooks rejetent les formats invalides et peuvent exiger un token
- la production expose un signal de sante minimal et des en-tetes de securite controles

### PHASE 17 - Verification transverse des garde-fous serveur

Contenu :

- recentrage documentaire sur les garde-fous auth, scope serveur et observabilite
- campagne de tests cibles sur `server-scope`, `server-guards`, `documents`, `signatures`, `consulting` et `client-space`
- commande locale dediee `npm run verify:guards`
- integration de cette verification dans `npm run verify`

Validation :

- les refus de scope serveur sont testes sur les actions sensibles prioritaires
- le noyau permissions partage reste documente a jour
- `npm run verify:guards` passe avant la suite de validation globale

### PHASE 18 - Cockpit admin alimente par les donnees metier

Contenu :

- agregation serveur des donnees metier accessibles
- indicateurs, graphes et kanban construits depuis Supabase
- etat vide explicite quand le perimetre ne contient aucune donnee

Validation :

- `/admin` distingue clairement une source Supabase d'un etat de demonstration
- les agregations du cockpit sont couvertes par des tests

### PHASE 19 - Cockpit admin pilotable par periode

Contenu :

- periodes `7d`, `30d` et `90d` pilotees par URL
- cartes de synthese et graphes recalcules selon la fenetre active

Validation :

- les periodes invalides retombent sur une valeur sure
- `/admin?range=7d`, `/admin?range=30d` et `/admin?range=90d` restent fonctionnelles

### PHASE 20 - Cockpit admin multi-rails

Contenu :

- priorites direction
- radar de sante plateforme
- actions rapides vers les modules critiques

Validation :

- les rails sont derives des donnees metier accessibles
- les liens rapides conduisent aux modules concernes

### PHASE 21 - Focus portefeuille admin

Contenu :

- organisations sous charge
- projets les plus exposes
- signaux portefeuille calcules depuis les flux metier

Validation :

- le cockpit permet d'identifier ou concentrer l'action
- les agregations portefeuille sont couvertes par des tests

### PHASE 22 - Archivage 25 ans et sauvegarde LWS

Contenu :

- archive logique quotidienne `json.gz`
- route cron protegee par `CRON_SECRET`
- transports local et SFTP vers la cible LWS
- runbook d'archivage longue duree

Validation :

- une archive peut etre generee sans toucher au serveur distant en mode local
- la route cron refuse les appels non autorises

### PHASE 23 - Guide de demarrage des utilisateurs connectes

Contenu :

- guide d'accueil affiche aux utilisateurs connectes
- parcours court vers organisations, chantiers et documents
- fermeture memorisee par utilisateur dans le navigateur

Validation :

- un nouvel utilisateur voit le guide
- la fermeture masque le guide lors des visites suivantes sur le meme navigateur

### PHASE 24 - Journal et verification des archives

Contenu :

- table serveur `archive_runs`
- etats `running`, `succeeded` et `failed`
- checksum SHA-256, taille, chemin de stockage et synthese metier
- relecture locale ou SFTP apres ecriture
- restauration logique du payload gzip/JSON pour verifier sa lisibilite

Validation :

- une execution active est journalisee avant l'extraction
- une archive n'est declaree reussie qu'apres relecture, checksum et validation du format
- un echec metier ou de verification est journalise sans exposer les secrets

### PHASE 25 - Supervision admin des archives

Contenu :

- protection d'authentification des routes `/admin`
- lecteur `service_role` marque `server-only`
- autorisation explicite par `is_platform_admin`
- tableau de supervision `/admin/archives`
- detection des echecs, archives quotidiennes en retard et executions bloquees

Validation :

- un utilisateur non authentifie est redirige vers le login
- un utilisateur non administrateur ne declenche aucune lecture privilegiee
- les chemins, checksums et erreurs ne sont rendus qu'apres autorisation plateforme
- une execution `running` depuis plus de 15 minutes est signalee comme bloquee

### PHASE 26 - Maintenance securite Next.js

Contenu :

- mise a niveau coordonnee de `next` et `eslint-config-next` vers `16.3.0`
- actualisation non forcee des dependances transitives vulnerables
- verification complete de l'application apres mise a niveau
- smoke test des routes publiques et admin sur le build de production local

Validation :

- `npm audit --omit=dev` ne detecte aucune vulnerabilite
- les `249` tests passent
- le build Next.js 16.3.0 compile les `26` pages attendues
- `/admin` et `/admin/archives` passent le smoke test

### PHASE 27 - Passerelle WhatsApp securisee

Contenu :

- webhook WhatsApp Business avec challenge et signature HMAC SHA-256
- liste blanche stricte des expediteurs
- file Supabase idempotente avec retention de 90 jours
- anonymisation du numero avant persistance
- supervision reservee aux administrateurs sur `/admin/commands`
- interrupteur serveur desactive par defaut

Validation :

- une requete non signee ou mal signee est refusee
- un expediteur non autorise ne cree aucune demande
- un doublon Meta ne cree pas une seconde commande
- aucune demande ne declenche de code, shell, deploiement ou mutation
- `/admin/commands` ne lit le `service_role` qu'apres verification du role plateforme

### PHASE 28 - Alertes d'exploitation des archives

Contenu :

- detection des archives en echec, bloquees ou quotidiennes en retard
- outbox Supabase et reservation atomique idempotente
- livraison HTTPS vers une liste blanche d'hotes
- cron quotidien protege par `CRON_SECRET`
- supervision plateforme sur `/admin/alerts`

Validation :

- les alertes sont desactivees par defaut
- une destination locale, privee, HTTP ou non autorisee est refusee
- aucune metadonnee sensible d'archive n'est envoyee
- un evenement deja livre n'est pas renvoye
- un non administrateur ne peut pas lire l'outbox

### PHASE 29 - Revue humaine des commandes WhatsApp

Contenu :

- approbation ou refus depuis `/admin/commands`
- controle du role plateforme dans la Server Action et PostgreSQL
- transition atomique depuis `pending_review`
- journal immuable de la decision et de l'acteur
- approbation explicitement sans execution

Validation :

- seules les decisions `approve` et `reject` sont acceptees
- une commande deja traitee ne peut pas changer arbitrairement de decision
- un utilisateur non plateforme ne declenche aucune mutation
- chaque nouvelle decision cree un evenement d'audit
- aucun shell, deploiement ou appel OpenAI n'est branche

### PHASE 30 - Retention automatique des donnees d'exploitation

Contenu :

- retention WhatsApp a 90 jours
- retention des alertes a 365 jours
- purge SQL reservee au `service_role`
- suppression en cascade des journaux de revue WhatsApp
- compteurs de purge dans le resultat du cron d'exploitation

Validation :

- aucune purge n'est accessible a une session utilisateur
- les dates d'echeance determinent seules les suppressions
- le cron existant execute la purge avant l'analyse des alertes
- les archives reglementaires de 25 ans restent hors perimetre

## Ordre d'execution recommande

Le projet doit avancer dans cet ordre :

1. core
2. modules transverses critiques
3. modules metier
4. integrateurs externes
5. IA metier
6. production

Ordre cible :

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8
10. Phase 9
11. Phase 10
12. Phase 11
13. Phase 12
14. Phase 13
15. Phase 14
16. Phase 15
17. Phase 16
18. Phase 17
19. Phase 18
20. Phase 19
21. Phase 20
22. Phase 21
23. Phase 22
24. Phase 23
25. Phase 24
26. Phase 25
27. Phase 26
28. Phase 27
29. Phase 28
30. Phase 29
31. Phase 30
