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
- [ ] MFA (mentionné dans le formulaire de connexion Phase 1, pas encore implémenté).
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

**Arrêt explicite ici — Phase B (annuaire BTP) non démarrée sans confirmation utilisateur.**

### Phase B — Annuaire professionnel BTP (non démarrée)

- Tables `directory_companies`, `directory_contacts`, `directory_categories`, `directory_sources`.
- Import CSV/XLSX, déduplication, quotas d'accès appliqués côté serveur et base (jamais côté UI
  seule) via `has_entitlement(org_id, 'directory.btp' | 'directory.bet' | 'directory.suppliers')`.
- Validation : un client non autorisé ne peut pas accéder aux données protégées, même par appel
  API direct.

### Phase C — Bibliothèque de modèles de documents premium (non démarrée)

- Tables `document_template_catalog`, `template_versions`, `template_purchases`.
- Moteur de génération (import DOCX, variables, PDF), modèles privés jamais redistribués entre
  organisations.
- Validation : une organisation achetant un modèle peut l'utiliser selon ses droits, les autres
  non ; un document déjà généré reste accessible même après retrait du modèle du catalogue.

### Phase D — Abonnements et crédits (non démarrée)

- Tables `organization_subscriptions`, `credit_wallets`, `credit_transactions`, `usage_records`.
- Débit de crédit exactement une fois par opération, transactions atomiques/idempotentes,
  expiration gérée.
- Validation : aucun double débit, aucun contournement de quota.

### Phase E — Intégration Odoo et commercialisation (non démarrée)

- Tables `service_orders`, `service_order_items` — correspondance avec Odoo via l'adaptateur
  existant (`IOdooAdapter`), jamais un second système comptable parallèle. AdminBTP reste
  autoritaire sur les droits d'accès/quotas/consommation ; Odoo peut être autoritaire sur la
  facturation. Si Odoo est indisponible, les demandes restent en attente de synchronisation —
  jamais de paiement fictif créé.
- Validation : droits et commandes restent cohérents même si Odoo est temporairement indisponible.

## Phase 3 — Génération de documents réelle

- Branchement d'un fournisseur IA réel derrière `IAIProvider` pour la génération de documents à
  partir des modèles (`DocumentTemplate`).
- Garantie technique (pas seulement conventionnelle) que tout PPSPS généré par IA naît en
  `PREEDITION`.
- Stockage réel des fichiers (Supabase Storage ou équivalent) derrière `fileUrl`.

## Phase 4 — Communications réelles (email/WhatsApp)

- Fournisseur email réel derrière `IEmailProvider`.
- Fournisseur WhatsApp Business réel derrière `IWhatsAppProvider`, avec capture de preuve
  d'échange (`whatsappProofUrl`) — toujours distincte de la signature électronique.

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

## Phase 8 — Onboarding multi-entreprises, abonnements et portefeuille avancé

- **Onboarding self-service** : une entreprise crée elle-même son organisation (aujourd'hui un
  nouvel inscrit démarre sans organisation et attend un rattachement manuel — voir
  `database/migrations/0002_auth_user_sync.sql`).
- **Abonnements** : UI de gestion de `subscription_plan` par organisation, feature-gating réel
  dans l'application à partir de `plan_features` (référentiel à définir — table créée vide en
  Phase 2).
- Gestion complète des `PortfolioGrant` (attribution/révocation d'accès cross-organisation,
  colonnes `revoked_at`/`revoked_by` posées en Phase 2) — écran dédié avec traçabilité visible.
- Tableaux de bord consolidés multi-organisations pour les collaborateurs AdminBTP.
- **Collaboration inter-entreprises** : UI exploitant la RLS de chantier partagé posée en Phase 2
  (`can_access_site()`) — une entreprise participante à un chantier (`site_participants`) doit
  pouvoir voir les ressources de ce chantier sans accéder aux autres chantiers de l'organisation
  propriétaire.
- Gestion de plusieurs domaines mail par entreprise (`organization_domains`, schéma posé en
  Phase 2, UI à construire).
- Modèles documentaires et signatures spécifiques par entreprise (`signature_profiles`, schéma
  posé en Phase 2, UI à construire) — toujours sans confondre preuve WhatsApp et signature
  électronique (voir `docs/VALIDATION_CHECKLIST.md`).

## Phase 9 — Durcissement sécurité et audit

- Revue de sécurité complète des policies RLS en conditions réelles (données client).
- Export et consultation de l'`AuditLogEntry` pour conformité RGPD/preuve.

## Phase 10 — Performance et montée en charge

- Tests de charge, optimisation des requêtes multi-tenant, mise en cache ciblée (potentiel retour
  de `cacheComponents` sur les routes avec vraies données serveur — voir `docs/DECISIONS.md`).

## Phase 11 — Extension hors Mayotte

- Généralisation des hypothèses actuellement spécifiques à Mayotte (fuseau horaire
  Indian/Mayotte, codes postaux 976xx) vers un paramétrage par organisation.
