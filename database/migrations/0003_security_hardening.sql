-- AdminBTP — Durcissement sécurité (Phase 2)
-- APPLIQUÉE au projet Supabase "AdminBTP" le 2026-10-21, suite au rapport des advisors de
-- sécurité Supabase (mcp get_advisors, type: security) passé juste après 0001/0002.

-- search_path explicite sur toutes les fonctions — évite l'injection via search_path mutable
-- (lint: function_search_path_mutable).
alter function public.set_updated_at() set search_path = public;
alter function public.current_app_user_id() set search_path = public;
alter function public.current_user_permission_role() set search_path = public;
alter function public.current_user_organization_id() set search_path = public;
alter function public.has_portfolio_access(uuid) set search_path = public;
alter function public.can_access_organization(uuid) set search_path = public;
alter function public.handle_new_user() set search_path = public;

-- handle_new_user (trigger auth.users) et rls_auto_enable (event trigger hérité, générique —
-- auto-active RLS sur toute nouvelle table) ne doivent pas être appelables en RPC direct par
-- anon/authenticated : ce sont des fonctions internes, jamais destinées à un appel applicatif
-- (lints: anon_security_definer_function_executable, authenticated_security_definer_function_executable).
-- PUBLIC inclut anon/authenticated par héritage de rôle — il faut révoquer les deux.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Non applicable ici (réglage du dashboard Auth, pas du schéma SQL) : activer "Leaked password
-- protection" dans Authentication > Policies > Password Security sur le dashboard Supabase.
