# Roadmap AdminBTP

Roadmap en phases avec portes de validation explicites — **aucune phase ne démarre sans
confirmation de l'utilisateur**, même si la précédente est techniquement terminée.

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

- Connexion Odoo réelle via JSON-2 API (Odoo 19+) derrière `IOdooAdapter`.
- Synchronisation non bloquante des fiches tiers et de la facturation.

## Phase 8 — Multi-organisation et portefeuille avancés

- Gestion complète des `PortfolioGrant` (attribution/révocation d'accès cross-organisation).
- Tableaux de bord consolidés multi-organisations pour les collaborateurs AdminBTP.

## Phase 9 — Durcissement sécurité et audit

- Revue de sécurité complète des policies RLS en conditions réelles (données client).
- Export et consultation de l'`AuditLogEntry` pour conformité RGPD/preuve.

## Phase 10 — Performance et montée en charge

- Tests de charge, optimisation des requêtes multi-tenant, mise en cache ciblée (potentiel retour
  de `cacheComponents` sur les routes avec vraies données serveur — voir `docs/DECISIONS.md`).

## Phase 11 — Extension hors Mayotte

- Généralisation des hypothèses actuellement spécifiques à Mayotte (fuseau horaire
  Indian/Mayotte, codes postaux 976xx) vers un paramétrage par organisation.
