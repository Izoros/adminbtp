-- AdminBTP — Fonctions SECURITY DEFINER : plus d'appel possible sans connexion
-- Suite au rapport des advisors de sécurité Supabase du 2026-10-23
-- (lint 0028 anon_security_definer_function_executable, 24 fonctions).
--
-- Constat : les fonctions créées par 0001 à 0029 gardaient le droit EXECUTE par défaut de PUBLIC
-- et le GRANT par défaut de Supabase à anon. Elles étaient donc appelables via
-- /rest/v1/rpc/<nom> avec la seule clé publique, sans session.
--
-- Le cas grave est _upsert_entitlement() : fonction interne sans aucun contrôle d'autorisation
-- (le contrôle ADMIN_PLATEFORME est fait par ses appelants grant/suspend/reactivate/extend/
-- revoke_entitlement et approve_access_request). Appelée directement, elle permettait à
-- n'importe qui, connecté ou non, d'activer un service payant pour n'importe quelle organisation.
-- Les autres fonctions vérifient l'appelant en interne (current_app_user_id() est NULL sans
-- session, donc refus), mais has_entitlement() et has_valid_subcontractor_agreement() répondaient
-- à un anonyme sur n'importe quelle organisation / n'importe quel chantier.
--
-- L'application n'appelle aucune de ces fonctions sans session : le middleware redirige vers /
-- toute route hors page de connexion, et la page de connexion n'utilise que supabase.auth.
--
-- Effet de bord assumé : les policies RLS sont déclarées TO public et appellent les fonctions
-- utilitaires (can_access_site(), can_access_organization()...). Une requête anonyme sur une table
-- métier échoue donc désormais en "permission denied for function" au lieu de renvoyer zéro
-- ligne. C'est un refus dans les deux cas.

-- 1. Fonction interne : personne ne l'appelle directement. Les fonctions SECURITY DEFINER qui
--    l'utilisent s'exécutent avec les droits de leur propriétaire et n'ont pas besoin du GRANT.
revoke execute on function public._upsert_entitlement(uuid, uuid, public.entitlement_status, timestamptz, text, uuid, uuid, public.entitlement_action, integer) from public, anon, authenticated;

-- 2. Fonctions utilitaires RLS : réservées aux utilisateurs connectés.
revoke execute on function public.can_access_organization(uuid) from public, anon;
revoke execute on function public.can_access_site(uuid) from public, anon;
revoke execute on function public.current_user_organization_id() from public, anon;
revoke execute on function public.current_user_permission_role() from public, anon;
revoke execute on function public.has_any_accessible_entitlement(text) from public, anon;
revoke execute on function public.has_entitlement(uuid, text) from public, anon;
revoke execute on function public.has_portfolio_access(uuid) from public, anon;
revoke execute on function public.has_valid_subcontractor_agreement(uuid, uuid) from public, anon;

grant execute on function public.can_access_organization(uuid) to authenticated;
grant execute on function public.can_access_site(uuid) to authenticated;
grant execute on function public.current_user_organization_id() to authenticated;
grant execute on function public.current_user_permission_role() to authenticated;
grant execute on function public.has_any_accessible_entitlement(text) to authenticated;
grant execute on function public.has_entitlement(uuid, text) to authenticated;
grant execute on function public.has_portfolio_access(uuid) to authenticated;
grant execute on function public.has_valid_subcontractor_agreement(uuid, uuid) to authenticated;

-- 3. RPC appelées par l'application (apps/web/src/lib/actions, apps/web/src/lib/data) : réservées
--    aux utilisateurs connectés. Chacune vérifie ensuite le rôle ou l'accès en interne.
revoke execute on function public.approve_access_request(uuid, timestamptz, uuid, text) from public, anon;
revoke execute on function public.cancel_access_request(uuid) from public, anon;
revoke execute on function public.check_internal_reminders(uuid) from public, anon;
revoke execute on function public.extend_entitlement(uuid, uuid, timestamptz, text) from public, anon;
revoke execute on function public.find_directory_duplicate(text, text, text) from public, anon;
revoke execute on function public.get_directory_company_contacts(uuid, uuid) from public, anon;
revoke execute on function public.get_directory_company_detail(uuid, uuid) from public, anon;
revoke execute on function public.grant_entitlement(uuid, uuid, timestamptz, text, uuid, integer) from public, anon;
revoke execute on function public.list_directory_companies_admin(uuid, text) from public, anon;
revoke execute on function public.log_act_override(uuid, uuid, text, text) from public, anon;
revoke execute on function public.reactivate_entitlement(uuid, uuid, timestamptz, text) from public, anon;
revoke execute on function public.reject_access_request(uuid, text) from public, anon;
revoke execute on function public.request_service_access(uuid, uuid, text) from public, anon;
revoke execute on function public.revoke_entitlement(uuid, uuid, text) from public, anon;
revoke execute on function public.suspend_entitlement(uuid, uuid, text) from public, anon;

grant execute on function public.approve_access_request(uuid, timestamptz, uuid, text) to authenticated;
grant execute on function public.cancel_access_request(uuid) to authenticated;
grant execute on function public.check_internal_reminders(uuid) to authenticated;
grant execute on function public.extend_entitlement(uuid, uuid, timestamptz, text) to authenticated;
grant execute on function public.find_directory_duplicate(text, text, text) to authenticated;
grant execute on function public.get_directory_company_contacts(uuid, uuid) to authenticated;
grant execute on function public.get_directory_company_detail(uuid, uuid) to authenticated;
grant execute on function public.grant_entitlement(uuid, uuid, timestamptz, text, uuid, integer) to authenticated;
grant execute on function public.list_directory_companies_admin(uuid, text) to authenticated;
grant execute on function public.log_act_override(uuid, uuid, text, text) to authenticated;
grant execute on function public.reactivate_entitlement(uuid, uuid, timestamptz, text) to authenticated;
grant execute on function public.reject_access_request(uuid, text) to authenticated;
grant execute on function public.request_service_access(uuid, uuid, text) to authenticated;
grant execute on function public.revoke_entitlement(uuid, uuid, text) to authenticated;
grant execute on function public.suspend_entitlement(uuid, uuid, text) to authenticated;

-- Pas de ALTER DEFAULT PRIVILEGES ici : le droit EXECUTE de PUBLIC vient du défaut global de
-- Postgres, qu'un réglage par schéma ne peut pas retirer, et le retirer globalement toucherait
-- aussi les fonctions d'extensions. Règle à garder pour toute nouvelle fonction SECURITY DEFINER :
-- révoquer explicitement (from public, anon), puis accorder à authenticated si l'application
-- l'appelle, comme 0003 et 0032.
