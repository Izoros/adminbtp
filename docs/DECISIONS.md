# Journal de décisions — AdminBTP

Format : date, décision, contexte/alternative écartée. Ajouter une entrée à chaque décision
d'architecture significative ou écart volontaire par rapport au cahier des charges initial.

## 2026-10-21 — Suppression d'un schéma Supabase hérité avant application du schéma Phase 1

**Décision** : au démarrage de la Phase 2, le projet Supabase fourni par l'utilisateur
(`azphgxzapyuazxtqzvta`, nommé "AdminBTP") contenait déjà 28 tables avec RLS actif, issues de
13 migrations datées du 2026-05-21/22 — donc antérieures à ce dépôt. Noms et concepts différents
de `packages/types` (`projects` au lieu de `sites`, `organization_members`, plus des
sous-systèmes entiers absents du cahier des charges reçu : `consulting_missions`/`consulting_hours`,
`ai_suggestions`/`ai_suggestion_audit_logs`, `client_portal_accesses`/`client_feedback_threads`).
Interrogé, l'utilisateur a confirmé qu'il s'agissait d'un projet précédent abandonné. Toutes les
tables étaient vides (0 ligne) — supprimées avec leurs enums et fonctions métier (CASCADE), sans
perte de données, avant d'appliquer `database/migrations/0001_init_core_schema.sql`.

**Point de vigilance découvert en cours de nettoyage** : un trigger `on_auth_user_created` sur
`auth.users` appelait une fonction `private.handle_new_user()` non détectée lors de l'audit initial
(elle vivait dans un schéma `private`, hors du schéma `public` audité). Elle insérait dans
`public.user_profiles`, supprimée entre-temps — le trigger aurait cassé toute inscription tant
qu'il n'a pas été remplacé par l'équivalent Phase 2 (`public.handle_new_user()`, voir
`database/migrations/0002_auth_user_sync.sql`). Leçon : auditer aussi les schémas non standards
(`private`, etc.), pas seulement `public`, avant une suppression de schéma hérité.

## 2026-10-21 — `users.id` lié directement à `auth.users.id` dès la Phase 2

**Décision** : contrairement au plan initial de `database/migrations/0001_init_core_schema.sql`
(FK vers `auth.users` "posée pour Phase 2"), la liaison a été faite directement dans cette même
migration au moment de l'appliquer, plutôt que d'appliquer d'abord la version Phase 1 non liée
suivie d'une migration séparée de liaison. La liaison à `auth.users` est explicitement un objectif
de la Phase 2 (`docs/ROADMAP.md`) — appliquer d'abord une version intermédiaire non liée, sachant
qu'elle serait immédiatement remplacée, aurait été un détour sans valeur.

## 2026-10-21 — `packages/ui` séparé de `apps/web/src/components/ui`

**Décision** : créer un package `@adminbtp/ui` contenant uniquement de la logique de
présentation indépendante de React (ex: `toneForSiteStatus()`, mapping statut → couleur
sémantique), distinct des composants React concrets qui restent dans `apps/web/src/components/ui`.

**Contexte / alternative écartée** : le cahier des charges initial listait `packages/ui` comme un
des 4 packages partagés, sans préciser s'il devait contenir les composants React eux-mêmes ou
seulement leur logique. Mettre les composants React (Button, Badge, Card...) dans le package
partagé aurait semblé plus direct, mais aurait couplé `@adminbtp/ui` à React/Next.js dès la
Phase 1 — gênant si un futur client mobile (React Native, ou autre) doit réutiliser les mêmes
règles de présentation sans les composants web. En séparant la logique pure (package partagé) des
composants concrets (apps/web), la règle métier "quel statut a quelle couleur" devient réutilisable
sans dépendance web.

**Conséquence** : tout nouveau mapping statut → présentation doit être ajouté dans
`packages/ui/src/status-presentation.ts`, pas directement dans un composant `apps/web`.

## 2026-10-21 — Désactivation de `cacheComponents` (Next.js 16)

**Décision** : retirer `cacheComponents: true` et `partialPrefetching: true` de
`apps/web/next.config.ts` (valeurs par défaut de `create-next-app` sur cette version de Next).

**Contexte** : `pnpm build` échouait sur `/chantiers/[id]` — `usePathname()` dans `Sidebar` et
`MobileNav` (utilisés par tout le layout `AppShell`) est un hook dynamique qui, avec
`cacheComponents` actif, nécessite d'être entouré de `<Suspense>` ou de déclarer la route comme
non statiquement prérendue. Aucune des pages Phase 1 n'a besoin du modèle de cache partiel de
Next 16 (pas de données serveur réelles à mettre en cache) — désactiver la fonctionnalité était
plus simple et plus sûr qu'ajouter des limites de Suspense dans tout le layout pour un bénéfice nul
en Phase 1.

**Conséquence** : à réévaluer en Phase 2+ si des Server Components avec vraies données
asynchrones (Supabase) sont introduits — le cache partiel pourrait alors redevenir pertinent.

## 2026-10-21 — Labels de statut de document déplacés vers `packages/types`

**Décision** : `DOCUMENT_CATEGORY_LABELS` et `DOCUMENT_STATUS_LABELS`, initialement définis
localement dans `apps/web/src/lib/mock-data/documents.ts`, ont été déplacés dans
`packages/types/src/document.ts`, aux côtés des enums Zod `DocumentCategory`/`DocumentStatus`
qu'ils décrivent.

**Contexte** : tous les autres mappings de libellés (`SITE_STATUS_LABELS`, `MAIL_STATUS_LABELS`,
`TASK_STATUS_LABELS`, `PAYMENT_STATUS_LABELS`...) vivent déjà dans `packages/types`, à côté de
leur enum. Les labels de documents étaient l'exception, créée par inadvertance pendant le
développement rapide de l'écran `/documents` — corrigé pour cohérence avant la fin de Phase 1
(détecté par `pnpm typecheck` lors de l'ajout de l'écran Paramètres qui référençait ces mêmes
labels depuis `@adminbtp/types`).

## 2026-10-21 — Node.js installé via nvm, pas Homebrew

**Décision** : installer Node.js/npm via nvm plutôt que via Homebrew, sur demande explicite de
l'utilisateur ("Installe Node via nvm").

**Contexte** : aucun gestionnaire de paquets (Homebrew, nvm, Node, npm, pnpm) n'était présent sur
la machine au départ. nvm a été installé via son script officiel, puis `nvm install --lts` a
fourni Node v24.22.0. pnpm a été activé via corepack (`corepack prepare pnpm@latest --activate`),
sans besoin de Homebrew. Conséquence : `gh`, `supabase` et `docker` CLI restent absents de
l'environnement (non requis pour builder/lancer l'application Phase 1) — voir
`docs/INTEGRATIONS_STATUS.md`.
