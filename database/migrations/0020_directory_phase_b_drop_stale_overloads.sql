-- create or replace function ne remplace que si la signature (types de paramètres) correspond
-- exactement : ajouter p_access_quota a créé une surcharge au lieu de remplacer l'original.
-- Supprime les anciennes signatures à 5/8 paramètres pour ne garder que les versions à 6/9.
drop function if exists grant_entitlement(uuid, uuid, timestamptz, text, uuid);
drop function if exists _upsert_entitlement(uuid, uuid, entitlement_status, timestamptz, text, uuid, uuid, entitlement_action);
