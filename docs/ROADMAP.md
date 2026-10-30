# Roadmap AdminBTP

Roadmap en phases avec portes de validation explicites — **aucune phase ne démarre sans
confirmation de l'utilisateur**, même si la précédente est techniquement terminée.

## Principe transverse — AdminBTP est un SaaS multi-tenant, jamais un outil MAWU

Exigence architecturale prioritaire actée le 2026-10-21, voir `docs/CDC/MULTI_TENANT_SAAS.md`.
AdminBTP est une plateforme commerciale destinée à plusieurs entreprises indépendantes du BTP.
**MAWU est un client et utilisateur initial, sans privilège implicite sur les données des autres
entreprises** — elle ne peut apparaître dans le code que comme une organisation de démonstration
parmi d'autres. Ce principe s'applique à toutes les phases ci-dessous, pas seulement à la Phase 2
qui en pose les fondations schéma.

## Phase 0 — Environnement et fondations ✅ (2026-10-21)

Audit d'environnement, installation Node/pnpm (nvm + corepack), scaffold monorepo, skills et
agents `.claude/`, documentation initiale, premier commit git.

## Phase 1 — Scaffold applicatif et écrans prioritaires ✅ (2026-10-21)

Monorepo pnpm (apps/web + packages/{types,ui,config,integrations}), design system, navigation,
13 écrans prioritaires avec données fictives, typecheck/lint/build/test verts, vérification
navigateur desktop + mobile, migrations SQL + RLS écrites (non appliquées), skills/agents/docs
complétés. **Voir `docs/PROJECT_STATUS.md` pour le détail exact de ce qui est fait.**

Arrêt explicite ici — Phase 2 non démarrée sans confirmation utilisateur.

## Phase 2 — Authentification et persistance réelles (en cours, démarrée 2026-10-21)

- [x] Connexion Supabase réelle (projet "AdminBTP", ref `azphgxzapyuazxtqzvta`) — migrations,
      RLS, durcissement sécurité/performance appliqués. Voir `database/README.md`.
- [x] Authentification Supabase Auth réelle (inscription, connexion, déconnexion, session via
      middleware, routes protégées) — remplace le formulaire démo. MFA non fait (reste à activer
      dans Phase 2, pas encore branché côté UI).
- [x] Liaison `public.users.id` ↔ `auth.users.id` (FK directe + trigger de provisioning
      automatique à l'inscription).
- [x] Persistance réelle (2026-10-21) : les 13 écrans lisent désormais Supabase via
      `apps/web/src/lib/data/*` (plus de `mock-data`, supprimé) ; jeu de données de démonstration
      réel semé (`database/seeds/0002_demo_dataset.sql`), équivalent aux anciennes fixtures.
      Les deux actions explicitement visées écrivent réellement :
      `apps/web/src/lib/actions/validations.ts` (Approuver/Refuser) et
      `apps/web/src/lib/actions/organizations.ts` (Enregistrer le profil d'organisation), via des
      Server Actions + de nouvelles policies RLS d'écriture
      (`database/migrations/0008_persistence_write_policies.sql`).
- [x] Sélecteur d'organisation dans l'UI (2026-10-21) : `OrgSwitcher` dans la barre supérieure
      (icône seule sur mobile, nom affiché à partir de `sm:`), liste les organisations
      accessibles (`getOrganizations()`, déjà filtrées par RLS), persiste le choix dans un cookie
      (`apps/web/src/lib/data/organization-context.ts` +
      `apps/web/src/lib/actions/organization-context.ts`). `/parametres` l'utilise désormais au
      lieu de la première organisation triée par nom. Les autres écrans (tableau de bord,
      chantiers, documents...) restent volontairement des vues consolidées multi-organisations,
      non filtrées par le sélecteur — c'est le comportement attendu pour un collaborateur
      AdminBTP qui supervise plusieurs sociétés (voir `docs/CDC/MULTI_TENANT_SAAS.md`).
- [x] Formulaires de création — chantiers et documents (2026-10-21) : `/chantiers/nouveau` et
      `/documents/nouveau`, via `apps/web/src/lib/actions/{sites,documents}.ts` (Server Actions).
      La création de document force le statut serveur-side (`category === 'PPSPS' ? 'PREEDITION'
      : 'BROUILLON'`) — jamais laissé au choix de l'utilisateur, pour que la règle PPSPS ne
      dépende pas de la discipline de l'UI. Bug trouvé et corrigé en route : voir
      `docs/DECISIONS.md` (`RETURNING` + policy SELECT auto-référentielle = faux négatif RLS sur
      Postgres 17). Organisations et autres entités restent en lecture seule (pas de formulaire
      de création).
- [x] MFA (2026-10-29) : TOTP natif Supabase Auth, écran d'enrôlement/vérification/désenrôlement
      (`MfaSettingsCard`, carte "Sécurité du compte" dans `/parametres`), synchronisation
      `public.users.mfa_enabled` par trigger (`database/migrations/0039_mfa_factor_sync.sql`), et
      application du palier AAL2 côté middleware (toute session `aal1` avec un facteur vérifié est
      renvoyée vers `/`). Non fait : codes de récupération (API Supabase encore `@experimental`).
- [x] Exigences SaaS multi-tenant actées le 2026-10-21 (voir `docs/CDC/MULTI_TENANT_SAAS.md`),
      traduites au schéma (`database/migrations/0005` à `0007`) : `role_scope` explicite sur
      `users` (plateforme/entreprise, distinct du rôle chantier `MissionRole`),
      `organization_domains` (plusieurs domaines mail par entreprise), `plan_features`
      (fonctionnalités par abonnement — table créée vide, référentiel à définir),
      `organization_integrations` (Odoo/n8n isolés par organisation, avec
      `managed_by: ADMINBTP | CLIENT` pour la gestion future par le client lui-même),
      `signature_profiles` (signature par organisation), révocation tracée sur `portfolio_grants`,
      et RLS de collaboration inter-entreprises sur chantier partagé (`can_access_site()`).
- [ ] Application effective de ces exigences dans l'UI (onboarding self-service, feature-gating
      par `plan_features`, écran de gestion des `portfolio_grants` avec révocation, écran de
      configuration `organization_integrations`/`signature_profiles`, écrans multi-domaines) — le
      schéma est prêt, l'UI reste à construire au fur et à mesure (voir Phase 8).

## Module Marketplace & Entitlements — commercialisation (phases A à E)

Exigence actée le 2026-10-22 (voir `docs/MONETIZATION_AND_ENTITLEMENTS.md`) : système natif de
commercialisation (fonctionnalités incluses/payantes, bibliothèque de documents premium, annuaire
BTP, services à l'unité/sur devis, crédits prépayés, abonnements). **Règle non négociable
transverse à toutes les phases** : seul un utilisateur `ADMIN_PLATEFORME` ("Super Administrateur")
peut autoriser, activer, suspendre, prolonger ou révoquer un accès premium — une demande ou un
paiement enregistré n'active jamais rien seul. Numérotation A-E propre à ce module, distincte des
phases 0-11 ci-dessus (ce module est transverse, pas une étape séquentielle du produit cœur).

### Phase A — Catalogue, tarifs et moteur d'autorisation ✅ (2026-10-22)

- [x] Schéma : `service_categories`, `service_catalog`, `service_prices` (tarif versionné, un seul
      "courant" par service), `access_requests`, `organization_entitlements` (état courant),
      `entitlement_grants` (historique immuable) — voir
      `database/migrations/0010_entitlements_phase_a.sql` et `0011_entitlements_phase_a_fk_indexes.sql`.
- [x] Fonction réutilisable `has_entitlement(org_id, service_code)` — point d'entrée unique pour
      toute vérification d'accès future (annuaire/bibliothèque en Phase B/C), `SECURITY DEFINER`
      pour rester utilisable depuis une policy RLS d'une autre table sans dépendre des droits du
      lecteur sur `organization_entitlements`.
- [x] Cycle de vie complet via fonctions `SECURITY DEFINER` uniquement (aucune policy
      INSERT/UPDATE/DELETE sur `organization_entitlements`/`entitlement_grants`/`access_requests`,
      même pour `ADMIN_PLATEFORME`) : `request_service_access`, `cancel_access_request`,
      `approve_access_request`, `reject_access_request`, `grant_entitlement`,
      `suspend_entitlement`, `reactivate_entitlement`, `extend_entitlement`, `revoke_entitlement`.
      Chaque fonction de mutation admin vérifie explicitement
      `current_user_permission_role() = 'ADMIN_PLATEFORME'` en première ligne — nécessaire car
      `SECURITY DEFINER` contourne RLS, donc cette vérification applicative est la seule
      protection réelle sur ces fonctions.
- [x] Architecture pour activation automatique future sans modifier les règles actuelles :
      `service_catalog.requires_admin_approval` (aujourd'hui `true` pour les 14 services du
      catalogue initial — aucun n'est auto-activable tant qu'un Super Administrateur ne change pas
      ce réglage) ; la branche d'auto-activation existe dans `request_service_access` mais reste
      inactive.
- [x] UI client (`/services`) : catalogue par catégorie, prix formatés selon le modèle tarifaire,
      statut d'entitlement, bouton "Demander l'activation" créant une vraie ligne
      `access_requests`, annulation de demande, historique des demandes.
- [x] UI Super Administrateur (`/admin`, garde de layout + policy RLS) : vue d'ensemble (compteurs
      uniquement — jamais de montant encaissé présenté comme réel), demandes en attente avec
      approuver/refuser, entitlements actifs/suspendus avec suspendre/réactiver/prolonger/révoquer,
      catalogue en lecture.
- [x] Catalogue initial (14 services, codes stables `directory.btp`, `directory.bet`,
      `directory.suppliers`, `templates.basic`, `templates.moe`, `templates.tce`, `templates.moa`,
      `documents.ppsps`, `documents.dc4`, `automation.followups`, `automation.mail`,
      `integrations.odoo`, `expert.engineering`, `expert.architecture`) et scénario de
      démonstration (1 entitlement actif, 1 demande) — `database/seeds/0003_entitlements_phase_a_seed.sql`.
- [x] Vérifications : `pnpm -r typecheck/lint/test/build` verts, advisors sécurité/performance
      Supabase revus (avertissements `SECURITY DEFINER` cohérents avec le reste du schéma),
      invariants RLS critiques vérifiés par simulation SQL directe, parcours client/admin complet
      vérifié en navigateur (voir `docs/VALIDATION_CHECKLIST.md`).

**Phase A validée par l'utilisateur le 2026-10-22.**

### Phase B — Annuaire professionnel BTP ✅ (2026-10-22)

- [x] Tables `directory_categories`, `directory_sources`, `directory_companies`, `directory_contacts`,
      `directory_access_log` — voir `database/migrations/0017` à `0020`,
      `database/seeds/0005_directory_phase_b_seed.sql`.
- [x] Import **CSV** (pas XLSX, voir ci-dessous), déduplication par SIRET sinon nom + code postal
      (`find_directory_duplicate()`), traçabilité par lot (`directory_sources`, compteurs
      créées/ignorées/erreurs). UI : onglet "Annuaire" dans `/admin`.
- [x] Accès gouverné par les entitlements de Phase A (`directory.btp`/`directory.bet`/
      `directory.suppliers`) à **deux niveaux**, tous deux côté base, jamais seulement UI :
      1. RLS — `has_any_accessible_entitlement()` : une organisation sans entitlement `ACTIVE`
         pour la catégorie ne voit **aucune ligne**, même via un appel API direct.
      2. Privilèges par colonne — même avec l'entitlement, un `SELECT` direct sur
         `directory_companies` ne retourne que les colonnes de navigation (nom, catégorie, métier,
         ville) ; les coordonnées (téléphone, email, site, adresse, SIRET, notes) ne sont
         accessibles que via `get_directory_company_detail()`. `directory_contacts` n'est lisible
         par aucun `SELECT` direct, uniquement via `get_directory_company_contacts()`.
- [x] **Quotas d'accès** : `organization_entitlements.access_quota` (générique, réutilisable
      au-delà de l'annuaire), appliqué par `get_directory_company_detail()` — nombre de fiches
      **distinctes** consultées par organisation et mois civil ; reconsulter une fiche déjà vue ce
      mois-ci ne recompte pas. `ADMIN_PLATEFORME` n'est jamais soumis au quota. Réglable à l'octroi
      via le nouveau formulaire "Octroyer directement" dans `/admin` (onglet Entitlements),
      au-dessus de `grant_entitlement()` désormais étendu avec `p_access_quota` optionnel.
- [x] UI client : `/annuaire` (catégories, locked/unlocked selon l'entitlement de l'organisation
      active, lien vers `/services` si non souscrit) et `/annuaire/[id]` (détail — consomme le
      quota, affiche l'erreur Postgres telle quelle si refusé).
- [x] **Validation exécutée** (voir `docs/VALIDATION_CHECKLIST.md` pour le détail des commandes) :
      un utilisateur sans aucune organisation habilitée voit 0 ligne en `SELECT` direct (RLS) ;
      un `SELECT` direct de la colonne `phone` est refusé par les privilèges de colonne même pour
      une organisation habilitée (`42501 permission denied for table`) ; accès direct par URL à
      une fiche d'une catégorie non souscrite → `404` ; quota testé positif (1ʳᵉ fiche acceptée,
      reconsultation non recomptée) et négatif (2ᵉ fiche distincte refusée, message Postgres exact
      remonté à l'UI) ; import CSV réel avec doublon SIRET correctement ignoré (vérifié en
      navigateur, pas seulement en SQL).
- [x] Trois bugs réels trouvés et corrigés pendant cette implémentation (référence de colonne
      ambiguë dans une fonction `RETURNS TABLE`, cast `char(14)`→`text` manquant,
      `create or replace function` créant une surcharge au lieu de remplacer une fonction Phase A
      dont l'arité a changé) — voir `docs/DECISIONS.md` pour l'analyse complète de chacun.

**Explicitement non fait, cases volontairement non cochées :**

- [ ] Import **XLSX** — seul le CSV est implémenté (pas de dépendance de parsing binaire ajoutée
      pour cette étape). Les colonnes attendues sont documentées dans l'UI d'import.
- [ ] Interface d'édition individuelle d'une fiche/d'un contact déjà importé (modification,
      suppression unitaire) — l'admin importe et consulte la liste, pas d'édition ligne à ligne.
- [ ] Export de fiches (CSV/PDF) côté client.
- [ ] Quota appliqué à un axe autre que "nombre de fiches distinctes par mois" (ex: export en
      masse, recherche illimitée) — seule la consultation de détail est quota-gated.

### Phase C — Bibliothèque de modèles de documents premium ✅ implémenté, non validé par l'utilisateur (2026-10-29)

- Tables `document_template_catalog`, `template_versions`, `template_purchases`
  (`database/migrations/0041`-`0042`), réutilisant le moteur de génération existant (Phase 3) —
  pas de second moteur. Modèles privés jamais redistribués entre organisations
  (`unique(organization_id, template_catalog_id)`), accès vérifié en RLS et en applicatif
  (défense en profondeur, même principe que l'annuaire Phase B).
- Flux demande → approbation `ADMIN_PLATEFORME` (`request_template_purchase`,
  `approve_template_purchase_request`), génération vérifiée par `get_purchased_template_version`.
  Un modèle retiré du catalogue (`is_active = false`) reste utilisable par qui l'a déjà acheté ; un
  document déjà généré référence sa version exacte, jamais le catalogue.
- UI livrée : client (`/services`, catalogue + demande d'achat) et admin (`/admin`, onglet
  "Modèles premium", approbation des demandes).
- Non fait : import DOCX réel avec substitution de variables (reprend le choix déjà assumé en
  Phase 3 : texte structuré rendu en PDF), fonction de révocation d'un achat.

### Phase D — Abonnements et crédits ✅ implémenté, non validé par l'utilisateur (2026-10-29)

- Tables `organization_subscriptions`, `credit_wallets`, `credit_transactions`, `usage_records`
  (`database/migrations/0046`-`0049`). Cycle de vie d'abonnement réservé à `ADMIN_PLATEFORME`
  (`activate_subscription`/`suspend_subscription`/`reactivate_subscription`/
  `extend_subscription`/`cancel_subscription`).
- Débit de crédit exactement une fois par opération : `debit_credits()` idempotent (clé unique par
  organisation), verrou de ligne, jamais de solde négatif (contrainte + contrôle applicatif) ;
  `record_usage()` orchestre `usage_records` + `debit_credits()` dans une seule transaction et
  bloque toute consommation si l'abonnement au service est expiré/inactif. `debit_credits()` n'est
  **pas** appelable directement par un utilisateur — uniquement via `record_usage()` (durci le
  2026-10-29, voir `docs/DECISIONS.md`).
- **Décision actée (2026-10-29, voir `docs/DECISIONS.md`)** : ce modèle reste distinct de
  `organizations.subscription_plan`/`plan_features` (Phase 2) — plan plateforme vs abonnement par
  service du catalogue, pas de fusion prévue.
- UI livrée : client (`/services`) et admin (`/admin`, onglet "Abonnements & crédits" :
  activation/suspension/réactivation/prolongation/annulation, ajout de crédits).
- Non fait : aucune fonctionnalité réelle de l'application n'appelle encore `record_usage()`
  (le moteur de débit existe, rien ne le déclenche automatiquement à ce jour).

### Phase E — Intégration Odoo et commercialisation (non démarrée)

- Tables `service_orders`, `service_order_items` — correspondance avec Odoo via l'adaptateur
  existant (`IOdooAdapter`), jamais un second système comptable parallèle. AdminBTP reste
  autoritaire sur les droits d'accès/quotas/consommation ; Odoo peut être autoritaire sur la
  facturation. Si Odoo est indisponible, les demandes restent en attente de synchronisation —
  jamais de paiement fictif créé.
- Validation : droits et commandes restent cohérents même si Odoo est temporairement indisponible.

## Module Moteur de chantier avancé — profils, actes, marché et décompte (en cours, non validé)

Travail commencé le 2026-10-22, **non terminé et non validé par l'utilisateur** — ne pas considérer
comme une étape close. Un seul moteur (phases, documents, lots, situations, validations) reste
configuré par mission (`MissionRole`) et par profil durable d'organisation, jamais dupliqué par
métier. Voir `packages/types/src/{roles,trade,document,market,finance,chantier}.ts` et
`database/migrations/0012` à `0016`.

- [x] **Profil société et corps d'état** : `organization_profiles` (forme juridique, rôles
      chantier par défaut, taille), `organization_trades` (métiers pratiqués, référentiel partagé
      `trade_codes`, 16 codes regroupés en 4 familles de présentation). Ne crée aucun droit — sert
      uniquement de défaut à l'onboarding et de pré-filtre ; le rôle effectif reste
      `site_participants.missionRole`. UI : nouvel onglet "Profil métier" dans `/parametres`.
- [x] **Actes de lancement par rôle** (famille MOE, ACT/DET) : référentiel déclaratif
      `act_templates` (checklist de dépendances entre actes — AE → Notification du marché → OS de
      démarrage → {OS prolongation, arrêt → reprise, réception}), pas une machine à états
      parallèle. Chaque acte reste un `Document` ordinaire (cycle de statuts inchangé). L'émission
      n'est proposée que si le `mission_role` de l'organisation active sur le chantier correspond
      à celui attendu. Une dépendance non satisfaite est une checklist affichée, jamais un verrou
      silencieux : un déblocage reste possible avec un motif tracé (`log_act_override()` →
      `audit_log`). UI : nouvel onglet "Actes" sur `/chantiers/[id]`. Catégories `DocumentCategory`
      ajoutées : `AE`, `OS`, `NOTIFICATION_MARCHE`, `CCAP`, `CCTP`, `DPGF`, `BPU`.
- [x] **Pièces de marché structurées** (préparation OCR) : `market_contracts`, `market_clauses`,
      `price_lines`. Aucune échéance/taux par défaut implicite — ces champs restent vides tant
      qu'ils n'ont pas été saisis ou extraits puis validés par un humain (statut `EXTRAIT` →
      `VALIDE`/`REJETE`). Saisie manuelle uniquement dans cette étape (origine `SAISIE`) ; aucun
      fournisseur OCR réel branché (`@adminbtp/integrations`, interface `IOcrProvider`,
      implémentation `DemoOcrProvider` sans I/O réseau, extrait fixe).
- [x] **Décomptes** : `Situation` reste l'en-tête ; `situation_lines` (lignes détaillées),
      `situation_allocations` (ventilation optionnelle vers une organisation tierce, paiement
      direct sous-traitant). Champs d'en-tête ajoutés sur `situations` : coefficient
      d'actualisation, mois d'indice, retenue, avance récupérée, pénalités, montant net HT — tous
      nullables, jamais calculés sans une clause `ACTUALISATION` `VALIDE` correspondante. UI :
      nouvel onglet "Décompte" sur `/chantiers/[id]` (création de situation, ajout de ligne avec
      cumul automatique, ventilation).
- [x] **Macrolots et sous-traitants** : `lots.parentLotId` (hiérarchie, protégée contre les cycles
      par un trigger `prevent_lot_cycle()`), sous-traitant modélisé via `site_participants`
      (`missionRole = SOUS_TRAITANT`). Règle vérifiée à **deux niveaux** (vérification applicative
      explicite + trigger serveur `check_subcontractor_allocation()`, pas seulement RLS) : aucune
      ventilation de décompte vers un sous-traitant sans DC4/agrément de sous-traitance `VALIDE`
      pour cette organisation précise sur ce chantier (`documents.concernsOrganizationId` +
      `has_valid_subcontractor_agreement()`). Vérifié par test direct (positif et négatif).
- [x] **Contrôle IA** : `document_reviews` (trace de contrôle IA ou humain, pas de nouveau statut
      "validé par IA"). Un contrôle IA fait au plus passer un document en `EN_CONTROLE` — seul un
      `VALIDATEUR` (ou l'action de validation existante côté chantier) peut le faire passer à
      `VALIDE`. Adaptateur `IAIProvider.reviewDocument()` étendu, implémentation `DemoAIProvider`
      sans I/O réseau. UI : bouton "Contrôle IA" sur les documents `BROUILLON`/`PREEDITION`.
- [x] Vérifications exécutées : `pnpm -r typecheck/lint/test/build` verts ; invariants de
      sécurité vérifiés par simulation SQL directe (cycle de lots refusé, ventilation sans
      agrément refusée) ; parcours complet vérifié en navigateur (profil société, actes avec
      changement d'organisation active pour tester le filtre de rôle, décompte avec recalcul
      automatique du montant HT, contrôle IA).

**Explicitement non fait, cases volontairement non cochées :**

- [ ] OCR réel (fournisseur branché derrière `IOcrProvider` — aujourd'hui `DemoOcrProvider`
      uniquement, aucune extraction automatique de CCAP/CCTP/DPGF/BPU).
- [ ] Indices officiels d'actualisation (BT01, index INSEE ou équivalent Mayotte) — le coefficient
      d'actualisation reste un champ saisi manuellement, aucune source d'indice réelle connectée.
- [ ] Signature électronique des actes (AE, OS) — ces documents suivent le cycle de statuts
      standard (`VALIDE`/`ENVOYE`) mais sans prestataire de signature réel (voir Phase 5).
- [ ] Paiement réel des situations — `PaymentStatus.PAYE` reste un statut déclaratif, aucune
      intégration bancaire/Odoo de paiement réel branchée (voir Phase 7).
- [ ] Interface de gestion du catalogue `act_templates`/`trade_codes` (édition via UI) — référentiels
      actuellement seedés directement en base (`database/seeds/0004_act_profile_market_seed.sql`).
- [ ] Tâche planifiée de recalcul automatique des cumuls de décompte au-delà de l'ajout manuel
      d'une ligne (le recalcul du montant HT total de l'en-tête à chaque ajout de ligne est fait,
      mais aucun rapprochement périodique avec les quantités réellement exécutées).

**Ne pas démarrer les phases B+ du module Marketplace à partir de ce travail** — ce sont deux
chantiers indépendants (voir section précédente).

### Tranches A-D — pièces d'entreprise, avenants/retenue/avance/DGD, exécution, quotidien ✅ (validé 2026-10-26)

Quatre tranches livrées à la suite du module ci-dessus — toujours un seul moteur
(phases/documents/lots/situations/validations/tâches/mails), aucun moteur parallèle par métier.
Voir `packages/types/src/{roles,chantier,document,market,finance,task,execution}.ts` et
`database/migrations/0021` à `0027`. Points explicitement non faits (voir plus bas) non
bloquants pour la validation, repris dans les phases suivantes si besoin.

- [x] **Tranche A — profil, actes, groupement** : `organization_credentials` (ASSURANCE_RC/
      ASSURANCE_DECENNALE/URSSAF/QUALIFICATION/AUTRE, échéance optionnelle, statut) rattachées à
      l'organisation, pas au chantier — une échéance dépassée s'affiche toujours comme expirée côté
      UI, quel que soit le statut déclaré en base. Diffusion ciblée des actes par lot
      (`documents.lot_id`, sélecteur optionnel dans le formulaire d'émission). `lot_members` (lot,
      organisation, rôle MANDATAIRE/COTRAITANT/TITULAIRE, part optionnelle) pour macrolots et
      groupements, distinct de la sous-traitance. Blocage de ventilation vers un sous-traitant
      étendu : refusé aussi si une `organization_credentials` requise est `EXPIRE`
      (`check_subcontractor_allocation()` redéfinie). Clôture de participant (`site_participants.
      left_at`) sans réécrire les OS ni les décomptes passés — testé en navigateur (badge
      "Clôturée", bouton retiré).
- [x] **Tranche B — avenants, retenue, avance, DGD, relances** : `amendments` (numéro, motif, delta
      HT, statut BROUILLON/VALIDE/REFUSE) ; une fois `VALIDE`, ses `price_lines.amendment_id`
      entrent dans les décomptes suivants, distinct du DPGF d'origine. Retenue de garantie
      (`retention_basis_amount_ht`, `retention_release_due_on`, `retention_substituted_by_caution`,
      `caution_document_id`) et avance forfaitaire (`advance_amount_ht`) sur le marché — solde
      d'avance **jamais négatif**, imposé par un trigger (`check_advance_balance()`, vérifié par
      simulation SQL directe positive et négative). Situation de solde (DGD) via `situations.
      is_final`. Relances de situation tracées (`reminder_logs` : canal, date, situation) via les
      adaptateurs `Demo*` existants (WhatsApp jamais une signature).
- [x] **Tranche C — exécution** : visa de plans (`plan_submissions`, statuts DEPOSE/VISE_BPE/
      VISE_AVEC_REMARQUES/REFUSE, file d'attente par chantier). Réserves (`reserve_items`, gravité
      MINEURE/MAJEURE/BLOQUANTE, statut OUVERTE/LEVEE/CONTESTEE). Journal de chantier
      (`site_log_entries`, nature INTEMPERIE/ARRET/LIVRAISON/INCIDENT/AUTRE) — citable comme motif
      d'un avenant ou d'un acte via `source_log_entry_id` nullable, jamais générateur automatique
      d'OS. Comptes-rendus (`meeting_notes`/`meeting_attendees`/`meeting_decisions`) : chaque
      décision crée immédiatement une tâche existante (`source_type = MEETING`) — le PDF
      compte-rendu resterait un export généré à partir de ces lignes, pas l'inverse (export non
      implémenté, voir ci-dessous). Avancement déclaré par lot (`lot_progress`, pourcentage déclaré
      à une date), affiché sans moteur de planning (pas de Gantt/CPM).
- [x] **Tranche D — quotidien** : classement de mail assisté (`DemoAIProvider.suggestMailFiling`,
      suggestion par mots-clés sur le sujet, confirmation humaine obligatoire via le formulaire) créant
      une tâche ou un document BROUILLON (PREEDITION si PPSPS) et passant le mail en `AFFECTE` —
      UI ajoutée sur `/mails`, aucune boîte mail réelle ingérée. Relances internes idempotentes
      (`check_internal_reminders(site_id)`, SECURITY DEFINER) : visa en attente au-delà de
      `sites.internal_reminder_days` (paramètre par chantier, défaut 7 en base, pas une constante
      UI), situation `A_ETABLIR` en retard, pièce d'agrément sous-traitant manquante/expirée —
      bouton "Vérifier les relances" dans l'onglet Exécution, crée des tâches `AUTOMATISATION`
      sans doublon (vérifié par appel répété en navigateur et par simulation SQL). Filtrage des
      modèles de documents par forme juridique/corps d'état (`document_templates.
      audience_legal_kind`/`audience_trade_code`, nullable — un modèle sans tag reste toujours
      visible), branché sur `/parametres` → "Modèles de documents" ; vérifié en navigateur en
      taguant temporairement un modèle de test (exclu puis retag retiré).
- [x] **UI minimale** : nouvel onglet "Exécution" sur `/chantiers/[id]` (visas en attente, réserves
      ouvertes, journal, comptes-rendus, avancement, bouton relances internes) ; onglet
      "Intervenants & lots" étendu (clôture de participant, membres de lot) ; onglet "Décompte"
      étendu (avenants, avance/retenue sur le marché, badge DGD, gating de l'actualisation,
      formulaire de relance) ; nouvelle carte "Pièces d'entreprise" sur `/parametres` ; section de
      classement sur `/mails`.
- [x] **Vérifications exécutées** : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web
      build` verts. Parcours complet vérifié en navigateur (comptes de démonstration) : dépôt et
      décision de visa, création/levée de réserve, entrée de journal, compte-rendu avec décisions
      devenues tâches, avancement déclaré, clôture de participant, ajout de membre de lot, avenant
      créé puis validé, marché avec avance/retenue, situation de solde (DGD), gating de
      l'actualisation (aucune clause validée → non calculée, affiché tel quel), envoi de relance,
      pièce d'entreprise expirée (badge "Expirée" piloté par la date, indépendamment du statut
      stocké), classement de mail (suggestion IA, tâche créée), filtrage des modèles par audience.
      Toutes les données de test créées pendant cette vérification ont été nettoyées après coup
      (comptes rendus, visas, réserves, avenant, contrat de test, pièce d'entreprise, tâches et
      statuts associés) pour laisser le jeu de données de démonstration inchangé.

**Comblé le 2026-10-22 (suite de la session, branche `claude/suite-moteur-chantier`) :**

- [x] **Rapprochement avancement déclaré ↔ HT facturé** : calculé et affiché dans l'onglet
      Exécution — pour chaque lot ayant un avancement déclaré, compare le dernier pourcentage
      déclaré (rapporté au montant du lot) au HT cumulé des situations `ACCEPTE`/`PAYE` de ce lot,
      avec un badge d'écart (seuil visuel à ±10%). Reste un signal affiché, pas un rapprochement
      périodique automatique ni une écriture déclenchée.
- [x] **Édition a posteriori** d'une entrée de journal (`updateSiteLogEntry`, nouvelle policy RLS
      `site_log_entries_update` — migration `0028`), d'une réserve (`updateReserveItem`, distincte
      du changement de statut) et de la date d'un compte-rendu (`updateMeetingNote`) — formulaires
      repliables (`<details>`) pré-remplis, sans JS dédié. La **suppression** reste volontairement
      non faite (risque d'orphelinat des tâches engendrées par un compte-rendu, notamment).
- [x] **Interface de configuration de `sites.internal_reminder_days`** : champ numérique éditable
      directement dans la carte "Relances internes" de l'onglet Exécution
      (`updateInternalReminderDays`), au lieu d'une modification en base uniquement.
- [x] Vérifications exécutées : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web
      build` verts ; les quatre ajouts testés en navigateur (compte de démonstration) — correction
      d'une entrée de journal, d'une réserve, de la date d'un compte-rendu, calcul de l'écart
      avancement/HT facturé avec un cas réel (Lot 02 : déclaré 20 % vs HT facturé, écart -34 %
      correctement signalé) ; données de test nettoyées après vérification.

**Toujours explicitement non fait, cases volontairement non cochées :**

- [x] Export PDF du compte-rendu (2026-10-23) : lien "Télécharger le PDF" sur chaque
      compte-rendu (onglet Exécution et bureau OPC), servi par
      `/chantiers/[id]/comptes-rendus/[meetingId]/pdf` (route handler, lecture via le client
      Supabase de l'utilisateur, donc RLS `can_access_site()` fait foi). Rendu `pdf-lib`
      (`apps/web/src/lib/pdf/meeting-report.ts`) : chantier, type et numéro de réunion, rédacteur,
      statut (validé le/par, ou bandeau BROUILLON pour un CR non validé), participants par
      présence (présents/excusés/absents), ordre du jour avec ses références (tâche, document,
      entrée de journal) résolues, décisions groupées par lot avec la mention des tâches créées,
      pagination. Généré **à la volée** à chaque téléchargement, rien n'est stocké ni rattaché à
      `meeting_notes.document_id` — le stockage réel et l'archivage du PDF restent liés à la Phase 3.
- [ ] Capture de preuve WhatsApp réelle pour les relances (`WHATSAPP` reste une trace déclarative
      dans `reminder_logs`, aucun fournisseur réel branché — frontière délibérée avec la Phase 4,
      jamais comblée par un adaptateur `Demo*` qui simulerait un vrai échange).
- [x] Suppression a posteriori d'une entrée de journal, d'une réserve ou d'un compte-rendu
      (2026-10-23, migration `0032`) : **suppression douce** — `deleted_at`, `deleted_by_user_id`
      et motif obligatoire, ligne masquée des écrans mais conservée comme preuve, trace
      `audit_log`. Passe par trois RPC `SECURITY DEFINER` (`soft_delete_site_log_entry`,
      `soft_delete_reserve_item`, `soft_delete_meeting_note`) ; un trigger interdit de poser ou
      retirer ces colonnes par un UPDATE direct, et de modifier une ligne supprimée. Une entrée de
      journal citée par un document, un avenant ou un CR non supprimé ne peut pas être supprimée.
      Un CR (brouillon ou validé) ne se supprime que par une organisation OPC/MOE active ; ses
      tâches encore ouvertes (`A_FAIRE`, `EN_COURS`, `EN_ATTENTE`) passent en `ANNULE`, les tâches
      faites restent. Pas de restauration depuis l'UI (possible en base si besoin).

### Tranche E — Bureaux de mission (OPC, CT, SPS, BET) ✅ (validé 2026-10-26)

Travail livré à la suite des Tranches A-D — même moteur unique, aucune application séparée,
aucun domaine ni déploiement distinct pour l'OPC/CT/SPS. Les trois points initialement laissés
non faits (diffusion/accusé de réception, décisions ligne par ligne, sélecteurs tâche/document)
ont été repris et livrés le 2026-10-23 (voir complément plus bas).

- [x] **Nouveaux rôles chantier** : `CT` (contrôleur technique), `SPS` (coordonnateur SPS), `CSSI`
      (coordonnateur SSI) ajoutés à l'enum Postgres `mission_role` et au schéma Zod `MissionRole`
      — jamais fusionnés avec `MOE`/`OPC`, aucun droit plateforme implicite. Apparaissent
      automatiquement dans les sélecteurs de rôle déjà dynamiques (`/parametres`, ajout
      d'intervenant sur `/chantiers/[id]`), sans changement de code dans ces écrans.
- [x] **Réunions généralisées** : `meeting_notes`/`meeting_attendees`/`meeting_decisions` (posés
      en Tranche C) étendus plutôt que dupliqués — `kind` (OPC/SYNTHESE/RECEPTION), `number`,
      `author_organization_id`, `status` (BROUILLON/VALIDE), présences avec statut
      (Présent/Excusé/Absent, une ligne par organisation active du chantier). Seules les
      organisations avec un rôle OPC ou MOE actif sur le chantier peuvent créer une réunion ou la
      faire passer à VALIDE — vérifié en Server Action via `site_participants`, pas par une policy
      RLS (même choix que pour les actes). Nouvelle table `meeting_agenda_items` (point d'ordre du
      jour : texte libre, ou référence à une tâche/un document/une entrée de journal — sélecteurs
      dédiés dans le formulaire, voir complément du 2026-10-23 ci-dessous).
- [x] **Décisions assignées** : chaque décision crée toujours une tâche existante
      (`source_type = MEETING`), saisie ligne par ligne — chacune avec son propre lot concerné (pour
      cibler les titulaires lors de la diffusion, voir complément ci-dessous), son organisation
      assignée et son échéance (composant client `DecisionRows`, voir complément du 2026-10-23).
      "Décisions précédentes toujours ouvertes" : les tâches `MEETING` non closes des réunions
      précédentes sont rechargées en lecture au-dessus du formulaire de création — rien n'est
      recopié à la main.
- [x] **Notes de coordination OPC par lot** (`lot_schedule_notes`) : consigne courte par semaine,
      avec renvoi optionnel vers un autre lot dont dépend celui-ci — aucun moteur de planning (pas
      de Gantt, pas de CPM).
- [x] **Avis techniques** (`technical_opinions`, CT/SPS/BET/CSSI) : nature (Avis/Visite/Observation),
      verdict optionnel (Favorable/Favorable avec observations/Suspendu/Défavorable), statut
      (Brouillon/Émis). L'émetteur doit porter ce rôle, actif, sur le chantier — vérifié en Server
      Action, pas par une policy RLS. Un avis CT `SUSPENDU`/`DEFAVORABLE` s'affiche sur l'écran de
      visa MOE (onglet Exécution, "Visas en attente") sans jamais bloquer le visa — la MOE tranche,
      la mention reste visible. Vérifié en navigateur avec un cas réel (avis CT "Suspendu" déposé
      sur un document, puis déposé pour visa : la mention apparaît, les boutons de décision restent
      actifs). Une observation SPS ne crée jamais de `ReserveItem` — ce n'est pas le même circuit.
- [x] **UI** : nouvel onglet "Bureaux" sur `/chantiers/[id]`, masqué section par section selon le
      rôle actif de l'organisation courante sur ce chantier (Bureau OPC si OPC ou MOE actif ;
      Bureau CT/BET si CT ou BET actif ; Bureau SPS si SPS actif, avec une liste en lecture seule
      des PPSPS du chantier). La création de compte-rendu a été déplacée de l'onglet Exécution
      (qui n'affiche plus qu'une liste enrichie et un lien vers le bureau OPC) vers ce nouvel
      onglet, pour que la restriction OPC/MOE soit portée par un seul point d'entrée.
- [x] Vérifications exécutées : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web
      build` verts ; migrations `0029`/`0030` appliquées sans incident (`ALTER TYPE ... ADD VALUE`
      isolé de tout usage du littéral dans la même migration, pour éviter l'erreur Postgres "unsafe
      use of new value of enum type") ; advisors de performance Supabase revus et les 3 index de FK
      manquants ajoutés. Parcours complet vérifié en navigateur avec changement d'organisation
      active : création de réunion avec présences et décisions assignées, ajout d'un point d'ordre
      du jour, validation du CR, note de coordination par lot, dépôt d'un avis CT et affichage de
      la mention sur l'écran de visa. Données et participations de test (y compris les rôles CT/SPS
      ajoutés temporairement pour le test) nettoyées après vérification.

**Explicitement non fait, cases volontairement non cochées :**

- [ ] Application mobile OPC dédiée — reste le même moteur web, aucun client mobile séparé.
- [ ] OCR réel, indices officiels, signature électronique, paiement réel, annuaire BTP — inchangés
      par rapport aux tranches précédentes, voir les sections correspondantes ci-dessus.

#### Tranche E (complément) — diffusion, accusé de réception, décisions ligne par ligne (2026-10-23)

Les trois points ci-dessus, explicitement laissés non faits lors de la livraison initiale de la
Tranche E, ont été repris et livrés — même moteur, aucune table dupliquée.

- [x] **Diffusion réelle et accusé de réception** : nouvelles tables `meeting_note_distributions`
      et `meeting_note_acknowledgments` (migration `0034`). Un CR validé se diffuse (bouton
      "Diffuser", réservé OPC/MOE comme sa création/validation) par email via `IEmailProvider`
      (`DemoEmailProvider` en l'absence de fournisseur réel) à ses destinataires — les
      organisations présentes à la réunion, union des titulaires (`lot_members.role = TITULAIRE`)
      des lots cités par ses décisions. Une organisation sans boîte mail active
      (`mail_addresses`) est ignorée sans bloquer les autres. Chaque organisation destinataire
      peut ensuite accuser réception depuis l'onglet Exécution (visible de toutes les
      organisations du chantier, pas seulement OPC/MOE) — action idempotente (contrainte unique
      `meeting_id`/`organization_id`), l'éligibilité (présent ou titulaire d'un lot cité) est
      vérifiée côté Server Action, pas par une policy RLS, même choix que pour la création du CR.
- [x] **Décisions ligne par ligne** : le formulaire de création de réunion (composant client
      `DecisionRows`, `apps/web/src/components/chantiers/decision-rows.tsx`) remplace le
      textarea unique par des lignes ajoutables/retirables, chacune avec son texte, son lot
      concerné (`meeting_decisions.lot_id`, déjà posé en Tranche C mais jamais renseigné depuis
      l'UI), son organisation assignée et son échéance — la tâche créée par décision porte
      désormais l'assignation et l'échéance propres à sa ligne.
- [x] **Sélecteurs tâche/document pour un point d'ordre du jour** : le formulaire d'ajout
      (`meeting_agenda_items`, réservé aux CR en brouillon) expose désormais une tâche et un
      document du chantier en plus du texte libre et de l'entrée de journal — les colonnes et le
      paramètre d'action existaient déjà, seul le sélecteur manquait.
- [x] Vérifications exécutées : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web
      build` verts ; migration `0034` appliquée sans incident ; `generate_typescript_types`
      régénéré. Parcours complet vérifié en navigateur (serveur de dev local) : décision créée
      avec lot/échéance propres → tâche correspondante visible avec la bonne assignation et la
      bonne échéance ; point d'ordre du jour lié à une tâche existante ; CR validé puis diffusé
      (deux emails simulés tracés sur trois destinataires, le troisième sans boîte mail active
      correctement ignoré) ; accusé de réception testé pour une organisation présente à la
      réunion et pour une organisation titulaire d'un lot cité mais non présente — les deux
      chemins d'éligibilité fonctionnent et s'affichent correctement. Titulaire de lot de test et
      comptes-rendus de test nettoyés après vérification (tâche née de la décision de test
      repassée en `ANNULE` par le RPC de suppression douce existant).

## Phase 3 — Génération de documents réelle (en cours, non validé, 2026-10-26)

- [x] **Fournisseur IA réel** : `IAIProvider` étendu d'une méthode `generateDocumentContent`
      (rédaction du corps texte d'un document à partir d'un modèle et de ses variables — jamais le
      fichier final ni le statut). `DeepSeekAIProvider` (`packages/integrations/src/ai/provider.ts`)
      implémente l'interface complète via l'API DeepSeek (compatible OpenAI,
      `https://api.deepseek.com/chat/completions`, modèle `deepseek-chat`), clé lue dans
      `DEEPSEEK_API_KEY` sans valeur en dur. `getAIProvider()` retombe sur `DemoAIProvider` tant que
      la clé n'est pas définie — aucun appel réseau sans elle. **Clé non fournie à ce stade** : le
      provider réel reste scaffoldé mais inactif tant que `DEEPSEEK_API_KEY` n'est pas ajoutée à
      `.env.local` (et aux variables Vercel pour la production).
- [x] **Garantie technique PPSPS** : trigger Postgres `enforce_ppsps_preedition()` (migration
      `0035`) force `status = 'PREEDITION'` sur tout `INSERT` dans `documents` où
      `category = 'PPSPS'`, quel que soit le statut demandé par le code appelant — vérifié en
      tentant une insertion SQL directe avec `status = 'VALIDE'`, forcée à `PREEDITION` par le
      trigger.
- [x] **Stockage réel** : bucket Supabase Storage privé `documents` (migration `0035`), chemin
      `{organization_id}/{document_id}.pdf`, RLS sur `storage.objects` alignée sur
      `can_access_organization()` — même règle d'isolation que la table `documents`. Nouvelle
      action `generateDocumentFromTemplate` (rédaction IA → mise en page PDF via `pdf-lib`,
      réutilise `wrapText`/`sanitizeForCharset` du générateur de CR existant → upload Storage →
      ligne `documents` avec `file_url` réel) et `getDocumentDownloadUrl` (URL signée 10 min,
      jamais pour un `fileUrl` `demo://`). Écran `/documents/nouveau` : nouvelle section "Générer
      avec l'IA depuis un modèle" (un formulaire par `DocumentTemplate` de l'organisation active,
      champ par variable), la création manuelle d'une fiche vierge existante est conservée à côté.
      Liste `/documents` : lien de téléchargement si un fichier réel existe.
- [x] Vérifications exécutées : `pnpm -r typecheck/lint/test` et `pnpm --filter @adminbtp/web
      build` verts ; migration `0035` appliquée sans incident. Parcours complet vérifié en
      navigateur (serveur de dev local, `DemoAIProvider` faute de clé DeepSeek) : génération d'un
      PPSPS depuis le modèle "PPSPS type", document créé en `PREEDITION`, fichier réellement
      stocké et téléchargeable (URL signée testée directement : réponse 200,
      `content-type: application/pdf`, en-tête `%PDF-` confirmé). Document de test nettoyé après
      vérification.

**Explicitement non fait, cases volontairement non cochées :**

- [ ] Clé `DEEPSEEK_API_KEY` non configurée — le fournisseur IA réel reste inactif (replié sur
      `DemoAIProvider`) tant que l'utilisateur ne l'ajoute pas lui-même.
- [ ] Templates DOCX réellement uploadés et parsés avec substitution de variables en préservant
      la mise en forme — choix assumé (voir discussion) de générer un texte structuré rendu en PDF
      via `pdf-lib`, pas de parsing d'un fichier DOCX existant. `document_templates.file_url`
      reste un chemin `demo://...` non exploité par la génération.
- [ ] Les autres méthodes de `IAIProvider` (classification de mail, brouillon de réponse,
      contrôle de document, suggestion de classement) ne sont pas encore appelées depuis
      `DeepSeekAIProvider` ailleurs dans l'app — `document-reviews.ts`/`reminders.ts` etc.
      utilisent toujours `DemoAIProvider` en dur, pas `getAIProvider()`.

## Phase 4 — Communications réelles (email/WhatsApp) (en cours, non validé, 2026-10-26)

- [x] **Fournisseur email réel** : `ResendEmailProvider` (`packages/integrations/src/email/provider.ts`)
      implémente `IEmailProvider` via l'API Resend (`https://api.resend.com/emails`), clé lue
      dans `RESEND_API_KEY`. `getEmailProvider()` retombe sur `DemoEmailProvider` sans clé —
      `listInbox()` n'a pas d'équivalent Resend (service d'envoi sortant uniquement) et échoue
      explicitement plutôt que de renvoyer une liste vide silencieuse. Expéditeur configurable
      via `RESEND_FROM_EMAIL`, par défaut `onboarding@resend.dev` (fonctionne sans domaine
      vérifié, en mode sandbox Resend). Les deux points d'appel existants
      (`sendReminder`/`reminders.ts`, `distributeMeetingNote`/`execution.ts`) utilisent
      désormais `getEmailProvider()` au lieu de `DemoEmailProvider` en dur.
- [x] `sendReminder` résout désormais un vrai destinataire (titulaire du lot de la situation, ou
      organisation du chantier à défaut, via `mail_addresses`) au lieu d'une adresse factice fixe
      — une organisation sans boîte mail active trace la relance sans tenter d'envoi.
- [x] Vérifié avec la vraie clé Resend de l'utilisateur : premier essai avec un domaine `from` non
      vérifié → 403 explicite de l'API, corrigé en basculant sur `onboarding@resend.dev` ; second
      essai → 403 "sandbox : destinataire doit être le propriétaire du compte" (comportement
      Resend attendu, pas un bug) ; envoi direct vers l'adresse du compte Resend de l'utilisateur
      → 200, email réellement délivré.
- [ ] **WhatsApp Business reporté** — nécessite un compte professionnel déjà approuvé côté Meta
      (processus externe de plusieurs jours) et une infrastructure de webhook pour capturer la
      preuve d'échange (`whatsappProofUrl`). `IWhatsAppProvider`/`DemoWhatsAppProvider` restent
      inchangés ; `sendReminder` simule toujours le canal WhatsApp. Sera repris dans une passe
      dédiée.

## Phase 5 — Signature électronique

- Intégration d'un prestataire de signature (Yousign/DocuSign ou équivalent) pour l'étape
  `SIGNATURE` du circuit de validation, avec `isLegallyBindingSignature: true` uniquement sur
  confirmation du prestataire.

## Phase 6 — Automatisations n8n

- Premiers workflows n8n réels (ex: relance automatique sur situation en retard, notification
  d'alerte critique), exportés dans `n8n/workflows/`.
- Respect strict du principe de non-blocage : toute fonctionnalité cœur reste utilisable si n8n
  est indisponible.

## Phase 7 — Intégration Odoo

- Connexion Odoo réelle via JSON-2 API (Odoo 19+) derrière `IOdooAdapter`, **isolée par
  organisation** (`organization_integrations`, voir `docs/CDC/MULTI_TENANT_SAAS.md`) — jamais une
  connexion Odoo globale à la plateforme.
- Synchronisation non bloquante des fiches tiers et de la facturation.
- Secrets réels (clés API Odoo) dans un coffre-fort dédié (Supabase Vault ou équivalent), jamais
  en clair dans `organization_integrations.config` — cette colonne ne porte que de la
  configuration non sensible.
- Bascule `organization_integrations.managed_by = CLIENT` : possibilité pour une entreprise
  cliente de gérer elle-même son instance Odoo plutôt que de passer par celle d'AdminBTP, sans
  migration de schéma supplémentaire (le champ existe déjà depuis la Phase 2).

## Phase 8 — Onboarding multi-entreprises, abonnements et portefeuille avancé (partiellement implémenté, non validé par l'utilisateur, 2026-10-29)

- [ ] **Onboarding self-service** : une entreprise crée elle-même son organisation (aujourd'hui un
  nouvel inscrit démarre sans organisation et attend un rattachement manuel — voir
  `database/migrations/0002_auth_user_sync.sql`). Non fait.
- [ ] **Abonnements plateforme** : UI de gestion de `subscription_plan` par organisation,
  feature-gating réel dans l'application à partir de `plan_features` (référentiel à définir —
  table toujours vide). Non fait — à ne pas confondre avec les abonnements par service de
  Marketplace Phase D (UI livrée, voir plus haut), qui sont un modèle commercial distinct (voir
  `docs/DECISIONS.md`).
- [x] Gestion complète des `PortfolioGrant` (attribution/révocation d'accès cross-organisation,
  colonnes `revoked_at`/`revoked_by` posées en Phase 2) — écran `/portefeuille` avec traçabilité
  visible (2026-10-29).
- [x] Tableaux de bord consolidés multi-organisations pour les collaborateurs AdminBTP (déjà en
  place depuis les phases précédentes).
- [ ] **Collaboration inter-entreprises** : UI exploitant la RLS de chantier partagé posée en
  Phase 2 (`can_access_site()`) — une entreprise participante à un chantier (`site_participants`)
  doit pouvoir voir les ressources de ce chantier sans accéder aux autres chantiers de
  l'organisation propriétaire. La RLS existe (Tranche E), pas d'écran dédié à la gestion de cette
  participation.
- [x] Gestion de plusieurs domaines mail par entreprise (`organization_domains`) — onglet
  "Domaines" dans `/parametres` (2026-10-29).
- [x] Modèles documentaires et signatures spécifiques par entreprise (`signature_profiles`) —
  onglet "Signature" dans `/parametres` (2026-10-29), toujours sans confondre preuve WhatsApp et
  signature électronique (voir `docs/VALIDATION_CHECKLIST.md`). Pas de signature électronique
  réelle (bloqué sur le choix d'un fournisseur, voir Phase 5).
- [x] Configuration des intégrations par organisation (`organization_integrations`) — onglet
  "Intégrations" dans `/parametres` (2026-10-29) ; reste de la config non sensible, pas de secret
  réel tant que la Phase 7 (Odoo) n'est pas démarrée.

## Phase 9 — Durcissement sécurité et audit (partiellement implémenté, non validé par l'utilisateur, 2026-10-29)

- [x] Revue de sécurité statique des policies RLS (audit sans accès navigateur/données client réel
  — a trouvé et fait corriger : la faille de transition de statut de document couverte
  ci-dessous, et deux oublis du durcissement 0033 sur des fonctions Marketplace Phase C). Revue
  en conditions réelles (données client) toujours non faite.
- [x] Garde-fou en base contre les sauts de statut de document illégitimes
  (`database/migrations/0050_document_status_transition_guard.sql`, 2026-10-29) : un `UPDATE`
  direct ou un appel RPC ne peut plus faire sauter un document (PPSPS en tête) de
  `PREEDITION`/`BROUILLON` directement à `VALIDE`/`ENVOYE`/`ARCHIVE` en contournant le circuit de
  validation — seules les transitions du cycle documenté par le skill `adminbtp-documents` sont
  autorisées. Le trigger d'INSERT de la Phase 3 (`enforce_ppsps_preedition`) ne couvrait que la
  création, pas l'`UPDATE` ; c'est maintenant corrigé.
- [x] Export et consultation de l'`AuditLogEntry` pour conformité RGPD/preuve — écran `/audit`
  (liste paginée, filtres date/action/organisation, export CSV), 2026-10-29.

## Phase 10 — Performance et montée en charge

- Tests de charge, optimisation des requêtes multi-tenant, mise en cache ciblée (potentiel retour
  de `cacheComponents` sur les routes avec vraies données serveur — voir `docs/DECISIONS.md`).
  Non démarrée : nécessite un trafic réel à mesurer, prématuré sans utilisateurs en production.

## Phase 11 — Extension hors Mayotte (schéma implémenté, non branché à l'UI, non validé par l'utilisateur, 2026-10-29)

- [x] Paramétrage par organisation posé en base (`organizations.timezone`, défaut
  `Indian/Mayotte` ; `organizations.postal_code_patterns`, `NULL` par défaut = comportement actuel
  inchangé) — `database/migrations/0037_organization_locale_settings.sql`. Utilitaire
  `formatDateInTimezone()` écrit (`apps/web/src/lib/format/date.ts`) mais **volontairement non
  branché** sur les affichages de dates existants, pour ne rien changer tant que ce n'est pas
  validé.
- [ ] Généralisation effective : brancher `formatDateInTimezone()` sur les affichages de dates
  réels, étendre la validation de code postal (actuellement non appliquée) au-delà du profil
  d'organisation (ex. import annuaire/CSV).
