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
- [ ] Persistance réelle des actions actuellement visuelles sans effet (approuver une validation,
      enregistrer un paramètre d'organisation) — pas encore fait : les 13 écrans lisent encore
      `apps/web/src/lib/mock-data`, pas la base réelle. Nécessite d'abord un jeu de données de
      démonstration réel (seed) équivalent aux fixtures actuelles, puis la conversion écran par
      écran des lectures (Server Components + requêtes Supabase) et des deux actions d'écriture
      explicitement visées.
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
