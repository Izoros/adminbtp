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

- authentification reelle Supabase par lien magique
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
