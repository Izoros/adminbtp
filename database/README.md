# Base de données AdminBTP

**Statut Phase 1 : aucune base Supabase n'est connectée.** Les fichiers SQL de ce dossier
sont écrits pour revue et ne sont appliqués à aucune base réelle.

- `migrations/0001_init_core_schema.sql` — schéma relationnel complet, dérivé des schémas Zod
  de `packages/types` (source de vérité applicative). Toute évolution de type doit être répercutée
  ici dans la même PR.
- `policies/0001_rls_policies.sql` — politiques RLS d'isolation multi-tenant par
  `organization_id`, avec prise en charge des collaborateurs AdminBTP multi-organisations
  (`portfolio_grants`).
- `schemas/` et `seeds/` — réservés aux phases suivantes (schémas de vues/materialized views,
  jeux de données de démonstration pour un environnement Supabase réel).

## Pour appliquer ces fichiers plus tard

1. Créer un projet Supabase et renseigner les variables d'environnement (voir
   `docs/INTEGRATIONS_STATUS.md`).
2. `supabase db push` (ou exécution manuelle dans l'éditeur SQL) avec
   `migrations/0001_init_core_schema.sql` puis `policies/0001_rls_policies.sql`.
3. Relier `public.users.id` à `auth.users.id` (Supabase Auth) — actuellement les deux tables
   sont indépendantes car l'authentification réelle n'est pas encore branchée (Phase 2).
