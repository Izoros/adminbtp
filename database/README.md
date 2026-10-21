# Base de données AdminBTP

**Phase 2 : connectée.** Le schéma de ce dossier est appliqué au projet Supabase **"AdminBTP"**
(ref `azphgxzapyuazxtqzvta`, région eu-west-1, Postgres 17) depuis le 2026-10-21, via le
connecteur MCP Supabase.

- `migrations/0001_init_core_schema.sql` — schéma relationnel complet, dérivé des schémas Zod de
  `packages/types`. `users.id` référence directement `auth.users.id`.
- `migrations/0002_auth_user_sync.sql` — trigger `on_auth_user_created` : crée automatiquement un
  profil `public.users` (rôle `OBSERVATEUR`, sans organisation) à chaque inscription Supabase
  Auth. L'affectation à une organisation et l'élévation de rôle se font ensuite manuellement.
- `migrations/0003_security_hardening.sql` — corrections suite aux advisors de sécurité Supabase
  (search_path explicite, révocation d'exécution RPC directe sur les fonctions internes).
- `migrations/0004_performance_hardening.sql` — corrections suite aux advisors de performance
  (index manquants sur FK secondaires, suppression de policies RLS redondantes).
- `migrations/0005_multitenant_saas_requirements.sql` — exigences SaaS multi-tenant actées le
  2026-10-21 (voir `docs/CDC/MULTI_TENANT_SAAS.md`) : `role_scope` explicite sur `users`,
  `organization_domains` (multi-domaine), `plan_features` (fonctionnalités par abonnement),
  `organization_integrations` (Odoo/n8n isolés par organisation), `signature_profiles`
  (signature par organisation), révocation tracée sur `portfolio_grants`.
- `migrations/0006_multitenant_saas_rls.sql` — fonction `can_access_site()` pour la collaboration
  inter-entreprises sur chantier partagé (contrôle d'accès par ressource), RLS des nouvelles
  tables, création/révocation de `portfolio_grants`.
- `migrations/0007_multitenant_saas_performance_cleanup.sql` — index manquants + policies
  d'écriture restructurées (FOR ALL → INSERT/UPDATE/DELETE séparées) pour éviter l'évaluation en
  double avec les nouvelles policies SELECT élargies.
- `policies/0001_rls_policies.sql` — politiques RLS d'isolation multi-tenant par
  `organization_id`, avec prise en charge des collaborateurs AdminBTP multi-organisations
  (`portfolio_grants`). Amendé par 0006 et 0007 (voir note en tête de fichier).
- `schemas/` — réservé aux phases suivantes. `seeds/0001_demo_admin_user.sql` — compte de
  démonstration ADMIN_PLATEFORME (voir ce fichier pour le piège GoTrue documenté).

## Historique : nettoyage d'un schéma hérité

Avant d'appliquer ce schéma, le projet contenait déjà 28 tables d'un projet AdminBTP antérieur
(créé 2026-05-21/22, non lié à ce dépôt), avec des noms différents (`projects`, `organization_members`,
`consulting_missions`, `ai_suggestions`, `client_portal_accesses`...). Toutes les tables étaient
vides. L'utilisateur a confirmé qu'il s'agissait d'un projet précédent abandonné — ce schéma a été
supprimé (tables, enums, fonctions métier, CASCADE) avant d'appliquer le schéma ci-dessus. Voir
`docs/DECISIONS.md` pour le détail.

## Reste à faire (Phase 2, en cours)

- Point de vigilance restant côté advisors : "Leaked password protection" désactivé — réglage du
  dashboard Auth (Authentication → Policies → Password Security), pas du schéma SQL, à activer
  manuellement.
- Policies RLS actuelles : lecture (`SELECT`) complète (y compris collaboration inter-entreprises
  sur chantier partagé via `can_access_site()`), écriture (`INSERT`/`UPDATE`/`DELETE`) posée
  uniquement sur les tables où `apps/web` écrit déjà en Phase 2 (`sites`, `documents`,
  `mail_threads`, `tasks`, `phase_instances`, `plan_features`). Les autres tables sont en lecture
  seule via RLS tant qu'aucun flux d'écriture applicatif n'existe — à étendre au fur et à mesure.
- `plan_features` est créée vide — aucune ligne de référence n'a été semée (quelles
  fonctionnalités par plan DEMO/STARTER/PRO/ENTERPRISE reste une décision produit à prendre avant
  de l'exploiter dans l'UI).
- Flux d'onboarding self-service (une entreprise crée elle-même son organisation) non implémenté —
  voir `docs/CDC/MULTI_TENANT_SAAS.md`.
