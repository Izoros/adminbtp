-- AdminBTP — Correction d'une récursion RLS (Phase 2, suite)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21. Voir docs/DECISIONS.md pour le détail
-- du bug observé (statement timeout 57014 sur toute requête liée à un chantier) et son analyse.
--
-- can_access_site() interroge sites/site_participants, qui portent elles-mêmes des policies
-- appelant can_access_site() — en SECURITY INVOKER (par défaut), ces lectures internes
-- redéclenchent l'évaluation RLS de la policy, qui rappelle la fonction, etc.
--
-- Correction standard Supabase : les fonctions utilitaires appelées depuis une policy RLS et qui
-- lisent une table elle-même protégée par RLS doivent être SECURITY DEFINER, pour que leurs
-- lectures internes s'exécutent avec les privilèges du propriétaire de la fonction (qui possède
-- les tables et n'est donc pas soumis à RLS, faute de FORCE ROW LEVEL SECURITY) plutôt qu'avec
-- ceux de l'appelant — ça casse la boucle.
--
-- Ces fonctions restent volontairement exécutables en RPC direct par anon/authenticated (non
-- révoquées, contrairement à handle_new_user/rls_auto_enable) : elles sont appelées par Postgres
-- lui-même lors de l'évaluation de policies sur des requêtes ordinaires, donc révoquer EXECUTE
-- casserait RLS pour tout le monde. Elles ne retournent qu'un booléen pour un id fourni par
-- l'appelant — pas d'exposition de donnée sensible au-delà de ce que révèle déjà la requête
-- protégée elle-même.

alter function current_user_permission_role() security definer;
alter function current_user_organization_id() security definer;
alter function has_portfolio_access(uuid) security definer;
alter function can_access_organization(uuid) security definer;
alter function can_access_site(uuid) security definer;
