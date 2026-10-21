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
- `policies/0001_rls_policies.sql` — politiques RLS d'isolation multi-tenant par
  `organization_id`, avec prise en charge des collaborateurs AdminBTP multi-organisations
  (`portfolio_grants`).
- `schemas/` et `seeds/` — réservés aux phases suivantes.

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
- Policies RLS actuelles : lecture (`SELECT`) complète, écriture (`INSERT`/`UPDATE`/`DELETE`)
  posée uniquement sur les tables où `apps/web` écrit déjà en Phase 2 (`sites`, `documents`,
  `mail_threads`, `tasks`, `phase_instances`). Les autres tables sont en lecture seule via RLS
  tant qu'aucun flux d'écriture applicatif n'existe — à étendre au fur et à mesure.
