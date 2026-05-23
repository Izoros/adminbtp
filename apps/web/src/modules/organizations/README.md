# Module organizations

Module reserve aux organisations, membres et structures multi-tenant.

Priorite d'execution:

- lecture serveur Supabase des organisations et rattachements
- exploitation de `user_profiles` quand il est disponible
- fallback demonstration propre si la configuration manque ou si la base est vide
- creation SSR d'organisation avec bootstrap automatique du role owner
