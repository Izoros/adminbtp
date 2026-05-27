# Module auth

Module reserve a l'authentification et aux futures regles d'acces.

## Portee actuelle

- Session SSR Supabase centralisee dans `src/lib/supabase/**`.
- Garde-fous de redirection pour `/login` et les pages protegees.
- Connexion par mot de passe via `/auth/password-login` avec cookies SSR poses cote serveur.
- Callback OTP avec restauration de la destination initiale via `next`.
- Logout serveur disponible sur `/auth/logout`.
