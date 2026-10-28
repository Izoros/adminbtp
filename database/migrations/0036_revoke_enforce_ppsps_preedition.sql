-- AdminBTP — enforce_ppsps_preedition() n'est pas une RPC
-- Suite au rapport des advisors de sécurité Supabase du 2026-10-27 (lint 0028/0029).
--
-- 0035 a créé cette fonction trigger SECURITY DEFINER sans révoquer le droit EXECUTE par défaut
-- (PUBLIC, anon, authenticated). Un appel direct via /rest/v1/rpc échoue déjà ("trigger functions
-- can only be called as triggers"), mais elle n'a rien à faire dans l'API. Le trigger
-- documents_enforce_ppsps_preedition n'a pas besoin de ce GRANT pour s'exécuter.
-- Même règle que 0003, 0032 et 0033 pour toute nouvelle fonction SECURITY DEFINER.
revoke execute on function public.enforce_ppsps_preedition() from public, anon, authenticated;
