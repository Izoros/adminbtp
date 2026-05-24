# Module signatures

Module reserve au circuit de validation, aux profils de signature et au journal d'audit.
Le lot inclut maintenant des actions serveur minimales pour creer une demande de
signature et faire evoluer son statut dans Supabase.

## Mode donnees

- fallback demonstration uniquement si Supabase est indisponible
- quand Supabase repond mais reste vide ou incomplet, le module conserve un etat
  `supabase` honnete avec message explicite plutot que d'injecter des donnees demo
- les audits absents ou indisponibles n'activent plus de faux journal de demonstration

Module reserve aux validations, signatures et journaux d'audit.
