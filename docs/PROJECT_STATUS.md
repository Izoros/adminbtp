# Statut du projet AdminBTP

**Phase actuelle (2026-10-30) : Phase 3 (génération de documents réelle), Phase 4 (communications
réelles, email seul), Marketplace Phases C et D, Phase 2 volet MFA, Phase 8 (sous-ensemble UI) et
Phase 9 (sous-ensemble sécurité/audit) sont implémentées mais AUCUNE n'est validée par
l'utilisateur.** Tranches A-D (2026-10-22) et Tranche E du moteur de chantier, bureaux de mission
OPC/CT/SPS/BET (2026-10-23), **validées par l'utilisateur le 2026-10-26**. Module Marketplace &
Entitlements **Phase A validée par l'utilisateur et Phase B (annuaire BTP) terminée** le
2026-10-22, Phase 2 (persistance réelle) et Phase 1 validées. Voir `docs/ROADMAP.md` pour le
détail exact des cases cochées/restantes, phase par phase.

## Lot parallèle 2026-10-29 — à valider par l'utilisateur avant toute suite

Deux vagues de plusieurs agents travaillant en worktrees isolées, consolidées et **déjà
appliquées en production** (migrations Supabase + mergées sur `main`), mais dont aucune n'a reçu
de validation fonctionnelle explicite de l'utilisateur (pas de parcours vérifié en navigateur avec
les comptes de démonstration, contrairement aux phases précédentes de ce document).

**Vague 1** : Phase 11 Mayotte (schéma de locale par organisation, non branché à l'UI), Phase 2
MFA (TOTP natif + palier AAL2), Marketplace Phase C (bibliothèque de modèles premium, UI client
`/services` + admin `/admin`), Marketplace Phase D (abonnements/crédits par service, UI client +
admin), sous-ensemble Phase 8 (domaines, intégrations, signature dans `/parametres` ; gestion des
`PortfolioGrant` dans `/portefeuille`). Deux corrections de sécurité appliquées avant mise en
production : `debit_credits()` restreinte à un appel interne via `record_usage()`, et le
durcissement 0033 (révocation `anon`/`public`) appliqué à des fonctions Marketplace C qui
l'avaient oublié.

**Vague 2** : garde-fou en base contre les sauts de statut de document illégitimes
(`database/migrations/0050`), rattrapage de `database/README.md`/`docs/VALIDATION_CHECKLIST.md`
jusqu'à la migration 0049, écran `/audit` (consultation + export CSV du journal d'audit, Phase 9
RGPD).

**Décision actée** : le modèle d'abonnement par service (Marketplace Phase D) reste distinct du
plan plateforme (`organizations.subscription_plan`/`plan_features`, Phase 2) — pas de fusion
prévue. Voir `docs/DECISIONS.md` (entrée du 2026-10-29) pour le détail complet et les points
explicitement laissés ouverts (pas de révocation d'achat de modèle Marketplace C, pas de codes de
récupération MFA, aucune fonctionnalité réelle n'appelle encore `record_usage()`).

**Pour la suite** : Phase 5 (signature électronique), Phase 6 (n8n) et Phase 7 (Odoo) restent
bloquées sur un choix de fournisseur/des identifiants externes que l'utilisateur doit fournir ;
Marketplace Phase E dépend de la Phase 7. Phase 10 (performance) n'a pas de sens sans trafic réel
à mesurer.

## Module Marketplace & Entitlements — Phase B : annuaire professionnel BTP (2026-10-22)

Catalogue partagé d'entreprises BTP/BET/fournisseurs, accès gouverné par les entitlements de
Phase A. Voir `docs/ROADMAP.md` (section Phase B) pour le détail complet et
`docs/MONETIZATION_AND_ENTITLEMENTS.md` pour les règles produit.

- Deux niveaux de protection des données, **tous deux côté base** : RLS (une organisation sans
  entitlement actif ne voit aucune fiche de la catégorie, même par appel API direct) et privilèges
  par colonne (les coordonnées ne sont lisibles que via une fonction dédiée, pas par `SELECT`
  direct même pour une organisation habilitée).
- Quota mensuel générique (`organization_entitlements.access_quota`) : nombre de fiches
  **distinctes** consultées par organisation et mois civil, réglable à l'octroi depuis `/admin`.
- Import CSV réel avec déduplication (SIRET, sinon nom + code postal) ; pas d'import XLSX.
- UI client `/annuaire` (catalogue par catégorie, verrouillé si non souscrit) et
  `/annuaire/[id]` (détail, consomme le quota) ; UI admin dans `/admin` (onglet Annuaire : import,
  liste complète, compteurs par catégorie).
- **Vérifié** (pas seulement en SQL — aussi en navigateur) : isolation RLS stricte, refus des
  privilèges de colonne, 404 sur accès direct par URL à une catégorie non souscrite, quota
  positif/négatif, import CSV réel avec doublon SIRET ignoré. Trois bugs réels trouvés et corrigés
  pendant l'implémentation — voir `docs/DECISIONS.md`.
- Non fait : import XLSX, édition individuelle de fiche/contact, export — voir `docs/ROADMAP.md`.

**Arrêt ici comme demandé — Phase C (bibliothèque de documents premium) non démarrée.**

## Phase 3 — Génération de documents réelle (en cours, non validé, 2026-10-26)

**Non terminé, ne pas considérer cette étape comme close.** Détail complet dans `docs/ROADMAP.md`
(section "Phase 3").

- `IAIProvider` étendu de `generateDocumentContent` ; `DeepSeekAIProvider` implémente
  l'interface complète via l'API DeepSeek (compatible OpenAI), clé lue dans `DEEPSEEK_API_KEY` —
  `getAIProvider()` retombe sur `DemoAIProvider` tant qu'elle n'est pas définie. **Clé non fournie
  à ce stade**, le fournisseur réel reste inactif.
- Garantie technique (trigger Postgres `enforce_ppsps_preedition()`, migration `0035`) qu'un
  PPSPS naît toujours en `PREEDITION`, quel que soit le statut demandé par le code appelant —
  vérifié par une tentative d'insertion directe en SQL avec `status = 'VALIDE'`, forcée à
  `PREEDITION`.
- Stockage réel (bucket Supabase Storage privé `documents`, RLS alignée sur
  `can_access_organization()`). Nouvelle action `generateDocumentFromTemplate` (IA → PDF via
  `pdf-lib` → upload Storage → ligne `documents`) et téléchargement par URL signée. Écran
  `/documents/nouveau` : génération depuis un modèle de l'organisation active, un formulaire par
  `DocumentTemplate` avec un champ par variable.
- Vérifié : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web build` verts ; parcours
  complet vérifié en navigateur (`DemoAIProvider` faute de clé) : génération d'un PPSPS,
  statut `PREEDITION`, fichier réellement stocké et téléchargeable (URL signée testée
  directement, PDF valide confirmé) ; document de test nettoyé après vérification.
- Non fait : clé `DEEPSEEK_API_KEY` à fournir par l'utilisateur ; templates DOCX réellement
  uploadés/parsés avec substitution de variables (choix assumé : texte structuré rendu en PDF,
  voir `docs/ROADMAP.md`) ; les autres méthodes de `IAIProvider` ailleurs dans l'app
  (classification de mail, brouillon de réponse, contrôle de document) n'utilisent pas encore
  `getAIProvider()`, toujours `DemoAIProvider` en dur.

**Arrêt ici, comme pour toute étape non explicitement validée.**

## Phase 4 — Communications réelles, email seul (en cours, non validé, 2026-10-26)

**Non terminé, ne pas considérer cette étape comme close.** Détail complet dans `docs/ROADMAP.md`
(section "Phase 4").

- `ResendEmailProvider` implémente `IEmailProvider` via l'API Resend, clé lue dans
  `RESEND_API_KEY` — `getEmailProvider()` retombe sur `DemoEmailProvider` sans clé.
  Expéditeur configurable via `RESEND_FROM_EMAIL` (défaut `onboarding@resend.dev`, fonctionne
  sans domaine vérifié). `sendReminder`/`distributeMeetingNote` utilisent désormais
  `getEmailProvider()` au lieu de `DemoEmailProvider` en dur ; `sendReminder` résout un vrai
  destinataire (titulaire de lot ou organisation du chantier) au lieu d'une adresse factice.
- Vérifié avec la vraie clé Resend de l'utilisateur : envoi direct confirmé (200, email
  réellement délivré à l'adresse du compte Resend de l'utilisateur, mode sandbox).
- Non fait : WhatsApp Business entièrement reporté (compte Meta à approuver en externe,
  infrastructure de webhook pour la preuve d'échange) — `IWhatsAppProvider` inchangé.

**Arrêt ici, comme pour toute étape non explicitement validée.**

## Tranche E — Bureaux de mission OPC, CT, SPS, BET ✅ (validé 2026-10-26)

Livré à la suite des Tranches A-D — même moteur unique, aucune application séparée pour
l'OPC/CT/SPS. Complément diffusion/accusé de réception/décisions ligne par ligne livré le
2026-10-23. Détail complet dans `docs/ROADMAP.md` (section "Tranche E").

- Nouveaux rôles chantier `CT`/`SPS`/`CSSI`, jamais fusionnés avec `MOE`/`OPC`.
- Réunions généralisées (`meeting_notes` étendu : nature, numéro, statut Brouillon/Validé,
  présences avec statut) réservées aux organisations OPC/MOE actives sur le chantier ; décisions
  assignées à une organisation du chantier avec échéance ; décisions précédentes toujours ouvertes
  rechargées au-dessus du formulaire.
- Notes de coordination OPC par lot (`lot_schedule_notes`), sans moteur de planning.
- Avis techniques CT/SPS/BET/CSSI (`technical_opinions`) : un avis CT suspendu/défavorable
  s'affiche sur l'écran de visa MOE sans jamais le bloquer — vérifié en navigateur avec un cas réel.
- Nouvel onglet "Bureaux" sur `/chantiers/[id]`, masqué section par section selon le rôle actif de
  l'organisation courante.
- Vérifié : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web build` verts ; parcours
  complet vérifié en navigateur avec changement d'organisation active (création de réunion,
  validation du CR, note de coordination, avis CT et mention sur l'écran de visa) ; données et
  participations de test nettoyées après vérification.
- Non fait : application mobile OPC dédiée — voir `docs/ROADMAP.md`.

## Tranches A-D — pièces d'entreprise, avenants/retenue/avance/DGD, exécution, quotidien ✅ (validé 2026-10-26)

Quatre tranches livrées à la suite du module ci-dessous, même moteur unique — détail complet, y
compris ce qui reste explicitement non fait, dans `docs/ROADMAP.md` (section "Tranches A-D").

- Pièces d'entreprise (`organization_credentials`, rattachées à l'organisation) : échéance dépassée
  toujours affichée comme expirée côté UI quel que soit le statut stocké. Diffusion ciblée des
  actes par lot (`documents.lot_id`). Groupement/sous-traitance (`lot_members` : MANDATAIRE/
  COTRAITANT/TITULAIRE) distinct de la sous-traitance. Blocage de ventilation étendu aux pièces
  expirées. Clôture de participant (`left_at`) sans réécrire l'historique.
- Avenants (`amendments`) entrant dans les décomptes suivants une fois validés, distincts du DPGF
  d'origine. Retenue de garantie et avance forfaitaire sur le marché, solde d'avance **jamais
  négatif** (trigger `check_advance_balance()`, vérifié positif et négatif). Situation de solde
  (DGD, `situations.is_final`). Relances de situation tracées (`reminder_logs`).
- Exécution : visa de plans (`plan_submissions`), réserves (`reserve_items`), journal de chantier
  (`site_log_entries`), comptes-rendus dont chaque décision crée une tâche
  (`meeting_notes`/`meeting_decisions`), avancement déclaré par lot (`lot_progress`). Nouvel onglet
  "Exécution" sur `/chantiers/[id]`.
- Quotidien : classement de mail assisté (suggestion IA par mots-clés, confirmation humaine,
  UI sur `/mails`), relances internes idempotentes par chantier (`check_internal_reminders`,
  paramètre `sites.internal_reminder_days`), filtrage des modèles de documents par forme
  juridique/corps d'état (branché sur `/parametres`).
- Vérifié : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web build` verts ; parcours
  complet des six sous-domaines vérifié en navigateur avec les comptes de démonstration (visa,
  réserve, journal, compte-rendu → tâche, avancement, clôture de participant, membre de lot,
  avenant, avance/retenue, DGD, gating de l'actualisation, relance, pièce expirée, classement de
  mail, filtrage de modèle) ; données de test nettoyées après vérification.
- Comblé le 2026-10-22 (branche `claude/suite-moteur-chantier`) : rapprochement avancement
  déclaré/HT facturé affiché par lot (badge d'écart) ; édition a posteriori d'une entrée de
  journal, d'une réserve et de la date d'un compte-rendu ; formulaire de configuration du délai de
  relance interne par chantier. Vérifié en navigateur, données de test nettoyées.
- Export PDF du compte-rendu fait le 2026-10-23 (généré à la volée, non stocké).
- Toujours non fait : preuve WhatsApp réelle, suppression a posteriori
  d'une entrée de journal/réserve/compte-rendu — voir `docs/ROADMAP.md`.

**Arrêt ici, comme pour toute étape non explicitement validée.**

## Module Moteur de chantier avancé — profils, actes, marché, décompte (en cours, 2026-10-22)

**Non terminé, ne pas considérer cette étape comme close.** Étend le moteur unique existant
(phases/documents/lots/situations/validations) sans en créer un second par métier — voir le détail
complet, y compris ce qui reste explicitement non fait (OCR réel, indices officiels, signature,
paiement réel), dans `docs/ROADMAP.md` (section "Module Moteur de chantier avancé").

- Profil société (`organization_profiles`/`organization_trades`, référentiel `trade_codes`) : ne
  crée aucun droit, sert de défaut à l'onboarding. UI : onglet "Profil métier" dans `/parametres`.
- Actes de lancement MOE (`act_templates`, checklist déclarative de dépendances AE → Notification
  → OS de démarrage → {prolongation, arrêt → reprise, réception}) : gardés par le `mission_role`
  effectif de l'organisation active sur le chantier ; dépendance non satisfaite = blocage affiché,
  déblocable avec un motif tracé dans `audit_log`. UI : onglet "Actes" sur `/chantiers/[id]`.
- Pièces de marché structurées (`market_contracts`/`market_clauses`/`price_lines`), préparation
  OCR uniquement (`DemoOcrProvider`, aucun fournisseur réel) — saisie manuelle fonctionnelle.
- Décompte (`situation_lines`/`situation_allocations` + champs d'actualisation/retenue/pénalités
  sur `situations`) : recalcul automatique du montant HT à l'ajout d'une ligne. UI : onglet
  "Décompte" sur `/chantiers/[id]`.
- Macrolots (`lots.parentLotId`, cycle refusé par trigger) et sous-traitants : ventilation de
  décompte vers un sous-traitant refusée sans DC4/agrément `VALIDE` pour cette organisation
  précise — vérifié par test direct positif et négatif (voir `docs/DECISIONS.md` si une analyse y
  est ajoutée, sinon section correspondante de `docs/ROADMAP.md`).
- Contrôle IA (`document_reviews`) : fait au plus passer un document en `EN_CONTROLE`, jamais
  `VALIDE` — seul un humain via le circuit de validation existant franchit cette étape.
- Vérifié : `pnpm -r typecheck/lint/test/build` verts ; invariants (cycle de lots, ventilation sans
  agrément) vérifiés par simulation SQL ; parcours complet vérifié en navigateur avec changement
  d'organisation active pour tester le filtre de rôle sur les actes.

**Arrêt ici, comme pour toute étape non explicitement validée — ne pas démarrer les phases B+ du
module Marketplace à partir de ce travail, ce sont deux chantiers indépendants.**

## Module Marketplace & Entitlements — Phase A (2026-10-22)

Système de commercialisation natif : catalogue de services premium, demandes d'activation,
entitlements (droits d'accès). **Règle absolue** : seul `ADMIN_PLATEFORME` ("Super
Administrateur") peut accorder/suspendre/prolonger/révoquer un accès — appliquée à trois niveaux
(RLS sans aucune policy d'écriture sur les tables d'entitlement, vérification explicite dans
chaque fonction SQL, garde UI). Voir `docs/MONETIZATION_AND_ENTITLEMENTS.md` pour le détail
complet.

- Schéma : 6 nouvelles tables (`service_categories`, `service_catalog`, `service_prices`,
  `access_requests`, `organization_entitlements`, `entitlement_grants`) +
  `has_entitlement()` (primitive réutilisable) + 9 fonctions `SECURITY DEFINER` pour le cycle de
  vie complet (demande, annulation, approbation, refus, octroi, suspension, réactivation,
  prolongation, révocation) — `database/migrations/0010` et `0011`.
- Catalogue initial : 14 services avec codes stables (`directory.btp`, `templates.moe`,
  `documents.ppsps`, etc.), tous `requires_admin_approval = true` — l'architecture permet de
  configurer plus tard une auto-activation par service sans toucher aux règles des services
  actuellement protégés (`database/seeds/0003_entitlements_phase_a_seed.sql`).
- UI client (`/services`) : catalogue par catégorie, demande d'activation réelle, annulation,
  historique. UI Super Administrateur (`/admin`, gardée par layout + RLS) : demandes en attente
  (approuver/refuser), entitlements (suspendre/réactiver/prolonger/révoquer), catalogue en lecture,
  compteurs (jamais de montant présenté comme encaissé réel).
- Vérifié : `pnpm -r typecheck/lint/test/build` verts ; invariants RLS critiques (isolation
  cross-org, impossibilité de self-grant, pas de double activation, révocation immédiate, écriture
  directe hors fonction refusée) vérifiés par simulation SQL ; parcours client → admin complet
  (demande → approbation → suspension → réactivation → refus) vérifié en navigateur avec les deux
  comptes de démonstration. Détail complet dans `docs/VALIDATION_CHECKLIST.md`.
- Explicitement non fait en Phase A : annuaire BTP, bibliothèque de documents premium, crédits,
  abonnements facturés, intégration Odoo réelle (Phases B-E, voir `docs/ROADMAP.md`) ; édition du
  catalogue/tarifs via UI (services initiaux seedés directement).

**Arrêt explicite ici, comme demandé — Phase B non démarrée sans confirmation utilisateur.**

## Ce qui fonctionne aujourd'hui

### Base de données et authentification (réelles)

Projet Supabase **"AdminBTP"** (ref `azphgxzapyuazxtqzvta`) connecté et opérationnel :
- Schéma complet (24 tables, RLS active partout) — voir `database/README.md`.
- Durci suite aux advisors de sécurité et de performance Supabase.
- Exigences SaaS multi-tenant actées et traduites au schéma — voir
  `docs/CDC/MULTI_TENANT_SAAS.md` (`role_scope`, `organization_domains`, `plan_features`,
  `organization_integrations`, `signature_profiles`, révocation tracée, collaboration
  inter-entreprises sur chantier partagé).
- Authentification réelle : inscription, connexion, déconnexion, session via middleware, routes
  `(app)/*` protégées.

### Application Next.js — données et actions réelles (2026-10-21)

```bash
pnpm --filter @adminbtp/web dev
```
Les 13 écrans lisent désormais Supabase via `apps/web/src/lib/data/*` — `mock-data` a été
supprimé. Un jeu de données de démonstration réel est semé
(`database/seeds/0002_demo_dataset.sql`), équivalent aux anciennes fixtures : 3 organisations,
2 collaborateurs plateforme (Amina Chanfi, Julien Perrot), 5 chantiers, 5 phases, 6 documents,
5 mails, 5 tâches, 4 situations, 4 validations.

Les deux actions explicitement visées par la Phase 2 écrivent réellement en base :
- **Validations** (`/validations`) — Approuver/Refuser met à jour `validation_records` via
  `apps/web/src/lib/actions/validations.ts` (Server Action).
- **Paramètres** (`/parametres`) — Enregistrer le profil d'organisation met à jour `organizations`
  via `apps/web/src/lib/actions/organizations.ts` (Server Action).

**Sélecteur d'organisation** : un `OrgSwitcher` dans la barre supérieure (icône seule sur mobile)
liste les organisations accessibles à l'utilisateur et persiste le choix dans un cookie. Utilisé
par `/parametres`, qui montrait auparavant la première organisation triée par nom. Les autres
écrans restent des vues consolidées multi-organisations (comportement attendu pour un
collaborateur qui supervise plusieurs sociétés).

**Formulaires de création** : `/chantiers/nouveau` et `/documents/nouveau` créent réellement des
lignes en base (`apps/web/src/lib/actions/sites.ts` et `documents.ts`). La catégorie PPSPS force
le statut `PREEDITION` côté serveur, jamais laissé au choix de l'utilisateur. Un bug réel a été
trouvé et corrigé en route (voir section suivante).

Se connecter avec le compte de démonstration documenté dans `apps/web/.env.local` (non committé).

Vérifié à cette étape : `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` tous verts ;
parcours complet en navigateur de tous les écrans avec données réelles, et test effectif des deux
actions d'écriture (persistance confirmée en base, valeurs de test nettoyées après vérification).

## Bugs trouvés et corrigés en cours de route

- Une fonction RLS (`can_access_site()`, posée pour la collaboration inter-entreprises) provoquait
  une récursion via les policies des tables qu'elle interrogeait, bloquant toute requête liée à un
  chantier pendant ~47s avant timeout. Corrigé en passant les fonctions utilitaires RLS en
  `SECURITY DEFINER`.
- `.insert().select()` sur `sites` échouait systématiquement (`42501 new row violates row-level
  security policy`) alors que la policy d'écriture était correcte : sur Postgres 17, `RETURNING`
  applique aussi la policy SELECT, et celle de `sites` est auto-référentielle
  (`can_access_site()`, `STABLE`, ne voit pas la ligne que la même instruction insère). Corrigé en
  générant l'id côté serveur et en évitant `.select()` après `.insert()`.

Voir `docs/DECISIONS.md` pour l'analyse complète des deux.

## Ce qui n'est pas branché

- Les autres entités restent en lecture seule côté UI — pas de formulaire de création
  d'organisation, par exemple (seuls chantiers et documents ont un formulaire de création).
- Odoo (Phase 7), signature électronique (Phase 5), n8n (Phase 6), WhatsApp Business : toujours en
  implémentation `Demo*`/non démarrés, bloqués sur un choix de fournisseur ou des identifiants
  externes à fournir par l'utilisateur. IA (`DeepSeekAIProvider`) : implémenté mais inactif, clé
  `DEEPSEEK_API_KEY` non fournie (choix explicite de l'utilisateur, reporté).
- Onboarding self-service, feature-gating par `plan_features` (plan plateforme, distinct des
  abonnements par service Marketplace D) : non implémentés — voir `docs/ROADMAP.md` Phase 8.
- MFA : codes de récupération absents (API Supabase encore `@experimental`).
- "Leaked password protection" Supabase Auth : **ne peut pas être activé sur le plan actuel du
  projet Supabase — nécessite un passage en plan Pro**, décision reportée par l'utilisateur
  (2026-10-29). Ne pas re-proposer le toggle du dashboard tant que le plan n'a pas changé.
- Marketplace : Phase E (intégration Odoo/commercialisation) non démarrée, dépend de la Phase 7 ;
  Phase C sans fonction de révocation d'achat ; Phase D sans aucune fonctionnalité réelle qui
  appelle encore `record_usage()` ; édition du catalogue/tarifs via UI (toujours seedé
  directement).
- Tranches A-D : preuve WhatsApp réelle pour les relances, suppression
  a posteriori d'une entrée de journal/réserve/compte-rendu (l'édition est faite) — voir
  `docs/ROADMAP.md`.
- Tranche E : application mobile OPC dédiée (diffusion/accusé de réception, décisions ligne par
  ligne et sélecteurs tâche/document du point d'ordre du jour sont livrés depuis le 2026-10-23)
  — voir `docs/ROADMAP.md`.

## Structure du dépôt

Voir `docs/ARCHITECTURE.md`. Ajouts notables de la Phase 2 : `apps/web/src/lib/data/` (requêtes
Supabase typées, mappées vers les schémas Zod existants, dont `organization-context.ts` pour le
sélecteur), `apps/web/src/lib/actions/` (Server Actions, dont `sites.ts`/`documents.ts` pour la
création), `apps/web/src/components/layout/org-switcher.tsx`,
`apps/web/src/app/(app)/{chantiers,documents}/nouveau/`, `database/migrations/0005` à `0009`,
`database/seeds/0002_demo_dataset.sql`, `docs/CDC/MULTI_TENANT_SAAS.md`. Ajouts notables du module
Marketplace (Phase A) : `packages/types/src/entitlements.ts`,
`database/migrations/0010` et `0011`, `database/seeds/0003_entitlements_phase_a_seed.sql`,
`apps/web/src/lib/{data,actions}/entitlements.ts`,
`apps/web/src/app/(app)/{services,admin}/`, `docs/MONETIZATION_AND_ENTITLEMENTS.md`.

## Décisions notables de cette phase

Voir `docs/DECISIONS.md` — notamment : suppression d'un schéma Supabase hérité, exigences SaaS
multi-tenant actées (jamais un outil MAWU), bug de récursion RLS et sa correction, bug
`RETURNING`/policy auto-référentielle et sa correction. Module Marketplace (Phase A) : voir
`docs/MONETIZATION_AND_ENTITLEMENTS.md` pour la défense en profondeur à trois niveaux retenue pour
garantir que seul un Super Administrateur peut accorder un accès premium.

## Prochaine étape

Rien ne démarre sans confirmation explicite de l'utilisateur. En priorité : validation
fonctionnelle (parcours navigateur) du lot parallèle du 2026-10-29 (Mayotte, MFA, Marketplace
C/D, Phase 8 UI, Phase 9), qui n'a reçu qu'une revue de code et une vérification technique
(typecheck/lint/build/test + advisors Supabase), jamais de vérification en conditions réelles.
Ensuite, débloqué uniquement sur décision/identifiants externes de l'utilisateur : Phase 5
(signature), Phase 6 (n8n), Phase 7 (Odoo), Marketplace Phase E.
