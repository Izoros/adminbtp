# Module auth

Toute l'authentification passe par le serveur (Server Actions + cookies SSR `httpOnly`).
Aucun client Supabase navigateur.

## Pages

| Route | Role |
|---|---|
| `/login` | Mot de passe, ou lien de connexion par email |
| `/forgot-password` | Envoi d'un lien de reinitialisation |
| `/account/password` | Definir / changer son mot de passe (session requise) |
| `/auth/callback` | Retour unique des emails Supabase (`?code=` PKCE ou `?token_hash=&type=`) |

La deconnexion est une Server Action (`signOut`) declenchee par un formulaire POST.

## Regles d'acces (`src/lib/supabase/proxy.ts`)

- page protegee sans session -> `/login?next=...`
- `/login` ou `/forgot-password` avec session -> destination `next` (par defaut `/admin`)
- les destinations `next` sont nettoyees (`sanitizeRedirectPath`) : jamais externes, jamais une page d'auth

## Premier administrateur

`ADMINBTP_PLATFORM_ADMIN_EMAILS` liste les emails promus `platform_admin` a chaque connexion.
Ces emails (et eux seuls) peuvent ouvrir leur compte via "Recevoir un lien de connexion".
La promotion utilise `SUPABASE_SERVICE_ROLE_KEY` ; sans cette cle la connexion reste possible
mais le role n'est pas attribue.

Parcours : `/login` -> lien email -> session ouverte et role admin -> `/account/password`
pour definir un mot de passe.

## Configuration Supabase (dashboard)

Authentication > URL Configuration :

- Site URL : `https://adminbtp.vercel.app`
- Redirect URLs : `https://adminbtp.vercel.app/**` (et `http://localhost:3000/**` en dev)

En local, les emails arrivent dans Mailpit : http://127.0.0.1:54324
