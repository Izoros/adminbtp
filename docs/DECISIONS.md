# Journal de décisions — AdminBTP

Format : date, décision, contexte/alternative écartée. Ajouter une entrée à chaque décision
d'architecture significative ou écart volontaire par rapport au cahier des charges initial.

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
