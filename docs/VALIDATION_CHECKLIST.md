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

---

# Checklist de validation — Module Marketplace & Entitlements, Phase A (2026-10-22)

Voir `docs/MONETIZATION_AND_ENTITLEMENTS.md` pour les règles produit et `docs/ROADMAP.md` pour le
découpage en phases A-E. Porte de validation du cahier des charges pour cette phase : *"un Super
Administrateur peut activer ou retirer un module pour une organisation"* — vérifié ci-dessous, à la
fois par simulation SQL directe et par parcours navigateur réel.

## Schéma, fonctions et RLS

- [x] 6 tables (`service_categories`, `service_catalog`, `service_prices`, `access_requests`,
      `organization_entitlements`, `entitlement_grants`) + 6 enums, RLS activée partout.
- [x] Aucune policy INSERT/UPDATE/DELETE sur `organization_entitlements`, `entitlement_grants` et
      `access_requests` — toute mutation passe par une fonction `SECURITY DEFINER` qui revérifie
      explicitement le rôle appelant.
- [x] `has_entitlement()` centralise la vérification d'accès (`SECURITY DEFINER`, réutilisable par
      une future policy RLS d'une autre table).
- [x] Advisors Supabase sécurité/performance revus après application — avertissements
      `SECURITY DEFINER` exécutable par `anon`/`authenticated` cohérents avec le reste du schéma
      (fonctions RLS historiques ont le même avertissement, chacune fait sa propre vérification
      interne) ; index de couverture FK ajoutés (`0011_entitlements_phase_a_fk_indexes.sql`).

## Scénarios de test exécutés réellement (simulation SQL directe, `set local role authenticated` +
`request.jwt.claims`, chaque transaction `rollback`ée après vérification — aucune donnée de
démonstration altérée par ces tests)

- [x] **Client sans option ne peut pas s'auto-accorder un accès** : `grant_entitlement()` appelé
      par un utilisateur `CHARGE_AFFAIRES` (non-admin) lève `42501` — vérifié.
- [x] **Administrateur de société cliente ne peut pas s'auto-accorder une option** : même test que
      ci-dessus, aucun rôle client (y compris un rôle d'administration côté entreprise) ne peut
      appeler les fonctions de mutation avec succès — seule `ADMIN_PLATEFORME` le peut.
- [x] **Super Administrateur peut approuver une demande en attente** : `approve_access_request()`
      exécuté avec succès par `ADMIN_PLATEFORME`, entitlement passé à `ACTIVE` — vérifié.
- [x] **Client A ne voit pas les données privées de Client B** : un entitlement accordé à une
      organisation sans portfolio grant pour l'utilisateur testé reste invisible en `SELECT`
      (0 ligne retournée), alors que `COUNT(*)` sans filtre confirme que la ligne existe bien en
      base — isolation RLS cross-org vérifiée.
- [x] **Insertion directe hors fonction refusée** : un `INSERT` manuel dans
      `organization_entitlements` par un utilisateur authentifié quelconque (y compris en
      contournant l'UI) échoue avec *"new row violates row-level security policy"* — aucune policy
      INSERT n'existe sur cette table.
- [x] **Pas de double activation** : approuver une demande déjà traitée (`status != 'PENDING'`)
      lève une exception explicite (*"Cette demande a déjà été traitée"*) au lieu de ré-accorder
      silencieusement un entitlement.
- [x] **Révocation a un effet immédiat** : `has_entitlement()` passe de `true` à `false` dans la
      même transaction que `revoke_entitlement()`, avant tout commit.

## Parcours navigateur réel (desktop, authentification réelle, deux comptes de démonstration)

- [x] Connexion `ADMIN_PLATEFORME` (Amina Chanfi) → `/services` affiche le catalogue par
      catégorie, prix formatés selon le modèle tarifaire, badge "Actif" sur l'entitlement
      pré-existant de démonstration.
- [x] Clic réel sur "Demander l'activation" (service BET) → crée une ligne `access_requests`
      réelle en base, bouton remplacé par "Demande en attente" / "Annuler la demande".
- [x] `/admin` → onglet Demandes affiche les deux demandes en attente (celle créée à l'instant et
      celle du jeu de données de démonstration) avec organisation, service, date, message.
- [x] Clic réel sur "Approuver et activer" → demande passée en historique avec statut "Approuvée",
      compteur "Demandes en attente" décrémenté, entitlement actif créé.
- [x] Clic réel sur "Suspendre" puis "Réactiver" sur un entitlement actif → badge et bouton mis à
      jour correctement après chaque action (pas seulement optimiste côté client — revalidation
      serveur confirmée en rechargeant les données).
- [x] Clic réel sur "Refuser" sur la demande restante → passée en historique avec statut "Refusée".
- [x] Déconnexion puis connexion avec le compte non-admin (Julien Perrot, `CHARGE_AFFAIRES`) :
      élément de navigation "Administration" absent du menu, navigation directe vers `/admin`
      redirige immédiatement vers `/dashboard` (garde de layout serveur).
- [x] Aucun montant présenté comme "encaissé" ou "revenu" nulle part dans `/admin` — uniquement des
      compteurs de droits d'accès, avec mention explicite en pied de tableau de bord.

## Vérifications techniques

- [x] `pnpm -r typecheck` : 0 erreur sur tout le monorepo.
- [x] `pnpm --filter @adminbtp/web lint` : 0 erreur.
- [x] `pnpm --filter @adminbtp/web build` : build de production réussi (`/services` et `/admin`
      générés comme routes dynamiques).
- [x] `pnpm -r test` : 10 tests passants (inchangés, aucune régression).

## Explicitement non fait en Phase A (prévu aux phases suivantes, voir `docs/ROADMAP.md`)

- Interface d'édition du catalogue/tarifs (Phase A expose le catalogue en lecture seule dans
  `/admin`, les services initiaux sont seedés directement en base).
- Annuaire BTP, bibliothèque de documents premium, crédits prépayés, abonnements facturés,
  intégration Odoo réelle (Phases B à E).
- Tâche planifiée de passage automatique `ACTIVE → EXPIRED` à l'échéance (le comportement de
  lecture via `has_entitlement()` est déjà correct même sans cette tâche, voir
  `docs/MONETIZATION_AND_ENTITLEMENTS.md`).
- Quota réel sur un service premium (aucun service du catalogue initial n'en a besoin — la
  primitive `has_entitlement()` est prête pour qu'une future table protégée l'utilise).
