# AdminBTP - Validation checklist

## Regles generales de validation

Chaque phase ne peut etre consideree comme livree que si :

- le code fonctionne localement
- les types TypeScript sont coherents
- le schema SQL est versionne si necessaire
- l'UI necessaire a la phase est presente
- les tests minimum sont ecrits et passes
- la documentation est mise a jour
- la checklist de phase est validee

## PHASE 0 - Socle projet

- monorepo initialise
- application Next.js demarre localement
- Tailwind configure
- Shadcn UI installe et exploitable
- client Supabase configure
- `README.md` present
- `.env.example` present
- arborescence `docs/` creee
- navigation principale accessible
- base design system disponible

## PHASE 1 - Authentification et multi-tenant

- login fonctionnel
- table `users` ou equivalent d'identite disponible
- table `organizations` creee
- table `organization_members` creee
- roles internes modelises
- politiques RLS ecrites et testees
- un utilisateur peut appartenir a plusieurs organisations
- isolement inter-organisations verifie
- tests d'acces non autorise presents

## PHASE 2 - Chantiers et roles projet

- table `projects` creee
- table `project_organizations` creee
- roles chantier modelises
- dashboard chantier accessible
- une organisation peut avoir plusieurs roles sur des chantiers differents
- les vues changent selon le role chantier
- tests de permissions projet presents

## PHASE 3 - Phases chantier configurables

- phases configurables par profil metier
- checklists rattachees aux phases
- statuts de phase implementes
- alertes de phase disponibles
- parcours MOE, MOA, TCE et entreprise de lot differencies
- impossibilite de passer une phase sans checklist conforme si requis
- tests de transition de phase presents

## PHASE 4 - Base documentaire

- table `documents` creee
- table ou structure `templates` creee
- prise en charge des entetes/logos/tampons/signatures
- generation PDF simple fonctionnelle
- un document peut etre genere depuis un template
- variables dynamiques remplacees correctement
- tests de generation ou rendu presents

## PHASE 5 - Signatures et validations

- table `signature_profiles` creee
- table `signature_requests` creee
- circuit de validation interne disponible
- preparation validation WhatsApp documentee
- audit log de validation present
- un document passe par un circuit de validation
- chaque action est tracee
- tests d'audit et de transitions presents

## PHASE 6 - Mails et boites generiques

- table `mailboxes` creee
- table `emails` creee
- convention d'adresse `client@adminbtp.yt` documentee
- preparation Gmail/Outlook API cadree
- classification manuelle disponible
- rattachement possible a organisation, chantier et tache
- tests de liaison metier presents

## PHASE 7 - Workflows n8n

- endpoint ou webhook entrant defini
- n8n peut creer une tache via API
- n8n peut recevoir une demande de validation
- workflow de relance decompte defini
- workflow document manquant defini
- workflow WhatsApp prepare
- tests d'integration minimum presents

## PHASE 8 - Relances decomptes et tresorerie

- table `situations` creee
- table `payment_followups` creee
- echeances modelisees
- relances J+7, J+15, J+30, J+45 calculees
- une situation genere automatiquement un planning de relance
- tests de generation d'echeancier presents

## PHASE 9 - Odoo

- mapping clients defini
- mapping facturation defini
- mapping abonnements defini
- mapping prestations conseil defini
- liaison entre organisation AdminBTP et contact/client Odoo possible
- journalisation des synchronisations prevue
- tests de mapping minimum presents

## PHASE 10 - Expertise ingenieur / architecte HMONP

- table `expert_profiles` creee
- table `expert_requests` creee
- table `consulting_missions` creee
- table `technical_reviews` creee
- suivi des heures conseil disponible
- lien avec chantier ou document possible
- un client peut demander un avis expert
- tests de cycle demande -> mission -> revue presents

## PHASE 11 - IA metier

- resume mail disponible
- classification document disponible
- generation courrier assistee
- aide redaction PPSPS/DC4 disponible
- recherche intelligente disponible
- aucune action n'est appliquee sans validation humaine
- toutes les propositions IA sont tracables
- tests sur garde-fous et traçabilite presents

## PHASE 12 - Espace client

- dashboard client simplifie disponible
- acces aux documents disponible
- validations disponibles
- relances visibles
- tickets accessibles
- isolation stricte des donnees client verifiee
- le client peut valider, refuser et commenter
- tests de permissions client presents

## PHASE 13 - Production

- securite de base confirmee
- logs disponibles
- sauvegardes configurees
- monitoring configure
- pipeline CI/CD operationnel
- deploiement Vercel operationnel
- environnement Supabase prod pret
- rollback documente et testable
- verification de protection des donnees effectuee

## PHASE 14 - Supabase local et migrations versionnees

- CLI Supabase configure dans le projet
- dossier `supabase/` initialise
- migrations versionnees presentes
- seed local present
- stack locale demarrable
- reset base local reproductible
- types TypeScript Supabase generables
- clients applicatifs branches sur les types generes

## PHASE 15 - CRUD Supabase reel et consolidation parallele

- actions serveur reelles disponibles sur les modules prioritaires
- fallback demo maintenu sans casser l'UI
- `organizations` et `projects` peuvent creer des donnees
- `documents` et `signatures` peuvent creer ou mettre a jour des flux reels
- `emails`, `followups` et `n8n` lisent des donnees reelles et valident leurs webhooks
- `consulting`, `ai` et `client-space` disposent de lectures/ecritures minimales reelles
- `npm run verify` passe
- `npm run verify:prod` passe
- documentation des workstreams paralleles mise a jour

## PHASE 16 - Auth reelle, garde-fous core et observabilite initiale

- page `login` branchee sur une authentification reelle Supabase
- callback d'auth et proxy SSR actifs pour la session
- les actions serveur critiques refusent les sessions absentes
- les creations `organizations` et `projects` passent par des fonctions SQL atomiques
- `is_org_manager` reste la reference de droits de gestion organisationnelle
- les modules `ai` et `client-space` disposent de RLS et contraintes de liaison consolidees
- les webhooks `n8n` valident le `content-type` JSON
- les webhooks `n8n` peuvent exiger un token partage
- la route `/api/health` repond `200` avec un payload exploitable
- `npm run verify:prod` controle aussi les en-tetes de securite en production
- les limites restantes de fallback demo et d'observabilite sont documentees

## PHASE 17 - Verification transverse des garde-fous serveur

- le noyau `server-scope` est teste explicitement
- le noyau `server-guards` est teste explicitement
- les actions `documents` refusent un scope organisation hors perimetre
- les actions `signatures` refusent un scope organisation hors perimetre
- les actions `consulting` refusent un scope organisation hors perimetre
- les actions `client-space` refusent un scope organisation hors perimetre
- la commande `npm run verify:guards` est disponible et documentee
- `npm run verify` execute cette verification ciblee avant la batterie complete

## Checklist de merge

Avant merge dans `develop` :

- ticket GitHub reference
- scope de la phase respecte
- tests lances
- documentation mise a jour
- revue terminee

Avant merge dans `main` :

- phase validee
- integration `develop` stable
- non-regression verifiee
- checklist de phase completement validee
