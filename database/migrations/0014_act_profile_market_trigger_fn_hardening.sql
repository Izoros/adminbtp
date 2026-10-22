-- Fonctions trigger pures (dépendent de NEW/OLD) : aucun usage RPC légitime.
revoke execute on function prevent_lot_cycle() from public, anon, authenticated;
revoke execute on function check_subcontractor_allocation() from public, anon, authenticated;
