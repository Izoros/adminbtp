# Module organizations

Module reserve aux organisations, membres et structures multi-tenant.

Priorite d'execution:

- lecture serveur Supabase des organisations et rattachements
- exploitation de `user_profiles` quand il est disponible
- etat vide Supabase si la session est valide mais qu'aucune organisation exploitable n'existe encore
- fallback demonstration propre si la configuration ou la session Supabase manque
- creation SSR d'organisation avec bootstrap automatique du role owner
