# Statut du projet AdminBTP

**Phase actuelle : Phase 2 en cours (démarrée 2026-10-21).** Phase 1 validée. Voir
`docs/ROADMAP.md` pour le détail des cases cochées/restantes.

## Ce qui fonctionne aujourd'hui

### Base de données et authentification (réelles, Phase 2)

Projet Supabase **"AdminBTP"** (ref `azphgxzapyuazxtqzvta`) connecté et opérationnel :
- Schéma complet (28 tables, RLS actif partout) appliqué — voir `database/README.md`.
- Durci suite aux advisors de sécurité (search_path, révocation RPC directe) et de performance
  (index FK manquants, policies redondantes supprimées).
- Authentification réelle : inscription, connexion, déconnexion, session gérée par middleware,
  routes `(app)/*` protégées (redirection si non connecté).
- `public.users.id` lié à `auth.users.id`, profil auto-créé à l'inscription (rôle `OBSERVATEUR`
  par défaut, sans organisation — élévation manuelle requise).

### Application Next.js (Phase 1, toujours en mode démonstration pour les données)

```bash
pnpm --filter @adminbtp/web dev
```
Les 13 écrans affichent toujours les fixtures de `apps/web/src/lib/mock-data`, **pas** les
données réelles de la base Supabase connectée — la conversion écran par écran n'est pas encore
faite (voir `docs/ROADMAP.md`, case non cochée de Phase 2). Se connecter avec le compte de
démonstration documenté dans `apps/web/.env.local` (non committé) pour tester l'authentification
réelle ; une fois connecté, la navigation reste celle de Phase 1.

Vérifié à cette étape : `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` tous verts ;
parcours complet en navigateur (inscription avec erreurs réelles de Supabase Auth, connexion,
déconnexion, protection de route, affichage du profil réel dans la barre supérieure).

## Ce qui n'est pas branché

- Les 13 écrans ne lisent pas encore la base réelle (mock-data uniquement).
- Les actions visuellement présentes mais inertes (Approuver/Refuser une validation, Enregistrer
  un paramètre) n'écrivent toujours rien de réel.
- Odoo, email, WhatsApp, IA, n8n : toujours en implémentation `Demo*`, aucun I/O réseau réel.
- MFA : mentionné dans l'UI, pas implémenté.
- "Leaked password protection" Supabase Auth : désactivé, à activer manuellement (dashboard).

## Structure du dépôt

Voir `docs/ARCHITECTURE.md`. Ajout Phase 2 : `apps/web/src/lib/supabase/` (clients
browser/server/middleware), `apps/web/middleware.ts`, `packages/types/src/database.ts` (types
générés depuis le schéma Supabase réel), `database/migrations/0002` à `0004`,
`database/seeds/0001_demo_admin_user.sql`.

## Décisions notables de cette phase

Voir `docs/DECISIONS.md` — notamment : suppression d'un schéma Supabase hérité d'un projet
précédent (confirmé par l'utilisateur, tables vides), liaison directe `users.id` ↔ `auth.users.id`
dès l'application du schéma plutôt qu'en différé.

## Prochaine étape

Finir Phase 2 : seed de données réelles équivalentes aux fixtures actuelles, conversion des 13
écrans vers des requêtes Supabase réelles, persistance réelle des actions Validations
(Approuver/Refuser) et Paramètres (Enregistrer). Non démarré sans confirmation explicite de
l'utilisateur sur la priorité à donner à cette suite.
