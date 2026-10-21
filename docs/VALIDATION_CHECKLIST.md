# Checklist de validation — Phase 1

À cocher avant de considérer la Phase 1 comme validée par l'utilisateur. Voir le skill
`adminbtp-quality-gate` pour la version réutilisable de cette checklist aux phases suivantes.

## Scaffold et outillage

- [x] Monorepo pnpm workspaces (`apps/*`, `packages/*`) fonctionnel.
- [x] `apps/web` : Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4.
- [x] 4 packages partagés créés et liés (`@adminbtp/types`, `@adminbtp/ui`, `@adminbtp/config`,
      `@adminbtp/integrations`), résolution vérifiée dans `apps/web/node_modules/@adminbtp/`.

## Design system et navigation

- [x] Tokens de couleur/typo/radius définis (packages/config + globals.css).
- [x] Composants UI de base (Button, Badge, Card, Input, Skeleton, EmptyState, PageHeader, Tabs).
- [x] Layout responsive : sidebar desktop, drawer mobile, topbar — vérifié visuellement aux deux
      largeurs.

## Écrans prioritaires (13/13)

- [x] Connexion (démo, sans auth réelle)
- [x] Tableau de bord (8 KPI + alertes critiques + charge par gestionnaire)
- [x] Organisations clientes (liste + fiche détail)
- [x] Portefeuille gestionnaires
- [x] Chantiers (liste + fiche détail avec onglets Intervenants/Phases/Documents/Mails/Tâches)
- [x] Documents (liste + rappel PPSPS préédition)
- [x] Mails (liste triée par urgence)
- [x] Tâches (kanban 4 colonnes)
- [x] Validations (en attente + historique, rappel preuve WhatsApp ≠ signature)
- [x] Relances (suivi de situations, alerte échéances dépassées)
- [x] Paramètres (organisation, modèles de documents, circuit de validation, intégrations)

## Vérifications techniques

- [x] `pnpm typecheck` : 0 erreur sur tout le monorepo.
- [x] `pnpm lint` : 0 erreur.
- [x] `pnpm build` : build de production réussi (14 routes générées).
- [x] `pnpm test` : 10 tests passants (utilitaires `cn`, `toneForSiteStatus`, composant `Badge`).
- [x] Vérification navigateur : connexion → dashboard → chaque écran de la navigation, desktop et
      mobile (375px), 0 erreur console, 0 erreur serveur.

## Règles métier non négociables respectées

- [x] PPSPS toujours généré en statut `PREEDITION` (mock data + rappel visuel sur `/documents`).
- [x] Preuve WhatsApp jamais confondue avec signature électronique (champ distinct
      `whatsappProofUrl` vs `signatureProvider`/`isLegallyBindingSignature`, rappel visuel sur
      `/validations`).
- [x] Isolation multi-tenant par `organization_id` modélisée dans tous les schémas Zod et les
      migrations SQL.
- [x] Intégrations externes toutes en mode démo, aucun I/O réseau réel.

## Base de données (préparée, non appliquée)

- [x] Migration SQL initiale écrite (`database/migrations/0001_init_core_schema.sql`), reflétant
      fidèlement `packages/types`.
- [x] Policies RLS écrites (`database/policies/0001_rls_policies.sql`), isolation
      `organization_id` + `portfolio_grants`.
- [ ] Appliquées à une base Supabase réelle — **volontairement hors scope Phase 1**.

## Documentation et organisation projet

- [x] 8 skills métier `.claude/skills/adminbtp-*`.
- [x] 6 agents spécialisés `.claude/agents/*`.
- [x] `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`,
      `docs/API_CONTRACTS.md`, `docs/VALIDATION_CHECKLIST.md` (ce fichier),
      `docs/INTEGRATIONS_STATUS.md`.
- [x] Premier commit git.

## Explicitement non fait (hors scope Phase 1, documenté)

- Authentification réelle, persistance réelle, intégrations réelles (Odoo/email/WhatsApp/IA/n8n),
  signature électronique — tous prévus aux phases suivantes (`docs/ROADMAP.md`).
