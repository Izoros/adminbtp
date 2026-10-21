# Journal de décisions — AdminBTP

Format : date, décision, contexte/alternative écartée. Ajouter une entrée à chaque décision
d'architecture significative ou écart volontaire par rapport au cahier des charges initial.

## 2026-10-21 — `RETURNING` + policy SELECT auto-référentielle = faux négatif RLS sur Postgres 17

**Problème** : le formulaire de création de chantier échouait systématiquement avec
`42501 new row violates row-level security policy for table "sites"`, alors que
`can_access_organization()` évaluait correctement `true` pour l'utilisateur (vérifié en SQL
direct, simulant sa session). L'action utilisait `.insert({...}).select("id").single()`.

**Cause** : depuis Postgres 15+ (confirmé ici sur Postgres 17, moteur du projet Supabase), une
clause `RETURNING` sur `INSERT`/`UPDATE`/`DELETE` applique aussi la policy `SELECT` de la table à
la ligne retournée — pas seulement la policy d'écriture. `sites_select_shared` appelle
`can_access_site(id)`, une fonction `STABLE` qui relit `sites`/`site_participants` : les fonctions
`STABLE` figent leur résultat sur l'instantané de **début de requête**, donc une telle fonction ne
voit pas la ligne que cette même instruction est en train d'insérer — `can_access_site()` renvoie
`false` pour la ligne qui vient d'être créée, et PostgREST (qui demande toujours `RETURNING` pour
restituer la ressource créée) rapporte l'échec comme une violation RLS. Isolé par test direct :
`insert ... ; -- (sans RETURNING)` réussit ; `insert ... returning id ;` échoue sur la même ligne.

**Correction** (`apps/web/src/lib/actions/sites.ts`) : générer l'`id` côté serveur
(`randomUUID()`), l'inclure explicitement dans l'`INSERT`, et ne jamais appeler `.select()` après
— l'id est déjà connu, pas besoin de `RETURNING`. Applicable à toute table dont la policy SELECT
est **auto-référentielle** (elle relit la table qu'elle protège, ou une table sœur elle aussi
protégée par la même fonction) : au minimum `sites`, `phase_instances`, `documents`,
`mail_threads`, `tasks`, `situations`, `reminder_rules`, `site_participants`, `lots`,
`site_access` (toutes via `can_access_site()`). `organizations`/`validation_records` n'ont pas ce
problème : leurs policies ne lisent pas la table qu'elles protègent.

**Leçon** : pour toute nouvelle Server Action qui insère dans une table protégée par
`can_access_site()`, soit éviter `.select()` après `.insert()`, soit générer l'id côté serveur
comme ici — ne pas supposer que `RETURNING` est sans risque juste parce que la policy d'écriture
est correcte.

## 2026-10-21 — Bug de récursion RLS sur `can_access_site()`, corrigé par `SECURITY DEFINER`

**Problème** : après conversion des 13 écrans vers de vraies requêtes Supabase, toute requête
touchant une table liée à un chantier (`sites`, `documents`, `mail_threads`, `tasks`,
`situations`, etc.) se bloquait ~47s avant d'échouer avec `57014 canceling statement due to
statement timeout`.

**Cause** : `can_access_site(site_id)` (posée dans `0006_multitenant_saas_rls.sql` pour la
collaboration inter-entreprises) interroge `sites` et `site_participants` — deux tables dont les
policies RLS (`sites_select_shared`, `site_participants_select`) appellent elles-mêmes
`can_access_site()`. En `SECURITY INVOKER` (par défaut), ces lectures internes redéclenchent
l'évaluation de la policy, qui rappelle la fonction, etc. — une boucle que Postgres n'a pas
détectée comme récursion infinie stricte (pas d'erreur immédiate) mais a fini par tuer via son
statement_timeout après un temps de calcul explosif.

**Correction** (`0009_fix_rls_helper_recursion.sql`) : passage en `SECURITY DEFINER` de
`can_access_site`, `can_access_organization`, `current_user_permission_role`,
`current_user_organization_id`, `has_portfolio_access` — leurs lectures internes s'exécutent
alors avec les privilèges du propriétaire de la fonction (qui possède les tables, donc n'est pas
soumis à RLS en l'absence de `FORCE ROW LEVEL SECURITY`), ce qui casse la boucle. C'est le motif
standard documenté par Supabase pour toute fonction utilitaire appelée depuis une policy RLS et
qui lit une table elle-même protégée par RLS.

**Conséquence assumée** : ces 5 fonctions restent exécutables directement en RPC par
`anon`/`authenticated` (signalé par les advisors de sécurité comme
`anon_security_definer_function_executable`) — contrairement à `handle_new_user`/
`rls_auto_enable` (révoquées en Phase 2 car sans usage RPC légitime), ces fonctions sont
appelées par Postgres lui-même lors de l'évaluation de policies sur des requêtes ordinaires :
leur révoquer casserait RLS pour tout le monde. Elles ne retournent qu'un booléen pour un id
fourni par l'appelant — aucune donnée sensible exposée au-delà de ce que révèle déjà la requête
protégée elle-même.

**Leçon** : toute nouvelle fonction utilitaire RLS qui lit une table RLS-protégée doit être
`SECURITY DEFINER` dès sa création, pas seulement après avoir constaté le symptôme en
production — voir le skill `adminbtp-multitenant-security`.

## 2026-10-21 — Exigence architecturale prioritaire : AdminBTP SaaS multi-tenant, jamais un outil MAWU

**Décision** : l'utilisateur a formalisé une exigence architecturale prioritaire — AdminBTP est
une plateforme SaaS commerciale multi-tenant destinée à plusieurs entreprises indépendantes du
BTP, jamais un logiciel interne exclusif à une entreprise. MAWU (client et utilisateur initial) ne
doit jamais avoir de privilège implicite sur la plateforme ou sur les données d'autres
organisations. Document complet : `docs/CDC/MULTI_TENANT_SAAS.md`.

**Traduction schéma** (`database/migrations/0005` à `0007`) : `users.role_scope` (distinction
explicite plateforme/entreprise), `organization_domains` (multi-domaine), `plan_features`
(fonctionnalités par abonnement), `organization_integrations` (Odoo/n8n isolés par organisation,
avec bascule `managed_by: CLIENT` pour une gestion future par l'entreprise elle-même),
`signature_profiles` (signature par organisation), révocation tracée sur `portfolio_grants`
(`revoked_at`/`revoked_by`), et une fonction RLS `can_access_site()` qui ouvre l'accès en lecture
à un chantier aux organisations participantes (`site_participants`), pas seulement à
l'organisation propriétaire — corrige un trou réel : avant cette migration, une entreprise
participante à un chantier (ex: sous-traitant, BET) n'avait aucune visibilité dessus.

**Vérification** : recherche de "MAWU" dans tout le dépôt à la date de cette décision — aucune
occurrence trouvée. Les organisations de démonstration restent fictives (SARL Madaterrassement,
Bâti Mayotte Construction, Cabinet AMO Lagon).

**Point ouvert** : le `CHECK` constraint sur `users.role_scope` n'est volontairement
**pas symétrique** — un rôle `PLATEFORME` doit avoir `organization_id IS NULL` (contrainte
stricte), mais un rôle `ENTREPRISE` peut temporairement n'avoir aucune organisation (nouvel
inscrit en attente de rattachement). Rendre la contrainte symétrique casserait le trigger
d'inscription (`handle_new_user`), qui crée un profil `ENTREPRISE`/`OBSERVATEUR` sans organisation
par défaut — RLS laisse de toute façon cet utilisateur sans accès à aucune donnée tant qu'il n'est
pas rattaché, donc pas de risque de sécurité à autoriser cette combinaison.

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
