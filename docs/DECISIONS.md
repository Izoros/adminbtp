# Journal de décisions — AdminBTP

Format : date, décision, contexte/alternative écartée. Ajouter une entrée à chaque décision
d'architecture significative ou écart volontaire par rapport au cahier des charges initial.

## 2026-10-22 — Trois bugs réels trouvés et corrigés en implémentant l'annuaire BTP (Phase B)

**Contexte** : module annuaire BTP (`database/migrations/0017` à `0020`), protection des données à
deux niveaux (RLS + privilèges de colonne) avec quota mensuel. Trois bugs réels détectés par
simulation SQL directe pendant l'implémentation, avant tout code applicatif — pas des suppositions.

**1. Colonne `RETURNS TABLE` qui porte le même nom qu'une colonne de la table interrogée.**
`get_directory_company_detail()` déclare `returns table (id uuid, ...)` ; à l'intérieur du corps
PL/pgSQL, `where id = p_company_id` est devenu ambigu (`42702`) car PL/pgSQL voit `id` comme une
variable de sortie en plus de la colonne `directory_companies.id`. Corrigé en aliasant
systématiquement la table (`dc.id`, `cat.service_code`, `dal.company_id`...) dans tout le corps de
la fonction, pas seulement là où l'erreur s'est manifestée. **Leçon** : toute fonction
`returns table (...)` dont les noms de colonnes de sortie recoupent des noms de colonnes de table
doit aliaser explicitement chaque référence de colonne dans son corps, même les requêtes qui
semblent sans ambiguïté au premier coup d'œil.

**2. Type de colonne `char(n)` incompatible avec une sortie déclarée `text`.** La même fonction
déclare `siret text` en sortie, mais `directory_companies.siret` est `char(14)` — Postgres refuse
`42804 structure of query does not match function result type` au lieu de convertir implicitement.
Corrigé par un cast explicite (`dc.siret::text`). **Leçon** : `char(n)`/`varchar(n)` dans une table
source doivent être castés explicitement si la fonction qui les expose déclare `text` en sortie —
ne jamais supposer qu'un type "proche" passe sans cast.

**3. `create or replace function` avec une nouvelle signature crée une surcharge au lieu de
remplacer.** Pour permettre un quota optionnel à l'octroi, `grant_entitlement()` et
`_upsert_entitlement()` (Phase A) ont reçu un paramètre `p_access_quota integer default null`
supplémentaire — changeant leur arité de 5→6 et 8→9 paramètres. Postgres identifie une fonction par
nom **et** types de paramètres : `create or replace` n'a donc pas remplacé l'originale, il a créé
une **seconde surcharge** coexistant avec l'ancienne (confirmé via
`select oid::regprocedure from pg_proc where proname = '...'`, qui listait les deux signatures).
Un appel ambigu ou un appel utilisant par erreur l'ancienne signature (sans la logique de quota)
serait resté possible tant que les deux existaient. Corrigé par un `drop function if exists` explicite
sur l'ancienne signature avant de recréer la nouvelle (`0020_directory_phase_b_drop_stale_overloads.sql`).
**Leçon** : changer le nombre de paramètres d'une fonction existante nécessite un `drop function`
explicite avec l'ancienne signature exacte — `create or replace` seul ne suffit jamais dans ce cas,
contrairement à l'ajout d'une colonne de sortie ou à un changement de corps à signature inchangée.

**Vérification** : chacun des trois bugs a été reproduit puis corrigé via simulation SQL directe
(`set local role authenticated` + `request.jwt.claims`) avant tout code TypeScript, avec un nouveau
test positif après correction. Voir `docs/VALIDATION_CHECKLIST.md` pour la liste complète des
scénarios vérifiés sur l'annuaire (quota, isolation cross-catégorie, privilèges de colonne, 404 sur
accès direct non autorisé).

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

## 2026-10-29 — Lot parallèle Mayotte/MFA/Marketplace C+D/Phase 8 : décisions de consolidation

**Contexte** : 5 agents lancés en parallèle (worktrees isolées) sur des travaux non bloqués du
roadmap : Phase 11 (fuseau horaire/codes postaux Mayotte), reste de la Phase 2 (MFA TOTP + pas de
sécurité AAL2), Marketplace Phase C (catalogue de modèles payants), Marketplace Phase D (moteur
d'abonnements/crédits par service), et un sous-ensemble de la Phase 8 (domaines/signature dans
Paramètres). Consolidés dans `integration/roadmap-parallel-batch`, fusion propre
(typecheck/lint/build/test verts), puis validé par l'utilisateur sans réserve
("Pars sur tes recommandations par défaut et enchaîne").

**Décision 1 — `organizations.subscription_plan`/`plan_features` (Phase 2) et
`organization_subscriptions`/`credit_wallets` (Phase D) restent deux modèles distincts.**
Le premier est le plan global de la plateforme (DEMO/STARTER/PRO/ENTERPRISE, fonctionnalités
activées côté AdminBTP lui-même). Le second est un abonnement par service du catalogue
Marketplace (Phase A), avec un portefeuille de crédits prépayés consommé à l'usage. Ce sont deux
axes commerciaux différents (plateforme vs. services tiers du catalogue) qui n'ont pas vocation à
fusionner — à documenter clairement dans le futur écran de facturation plutôt qu'à unifier le
schéma.

**Décision 2 — `debit_credits()` n'est plus accessible directement à `authenticated`.**
La fonction centrale de débit (0049) était ouverte en appel direct, en plus de l'orchestration
`record_usage()`. Un appel direct contourne la vérification d'abonnement actif de
`record_usage()` et ne laisse aucune trace dans `usage_records`. Corrigé avant application en
production : `debit_credits()` est désormais révoquée pour `authenticated` (appelable uniquement
en interne par `record_usage()`, sous les privilèges du rôle propriétaire de la fonction
SECURITY DEFINER) — voir `database/migrations/0049_phase_d_credit_engine_functions.sql`.

**Décision 3 — reportés à une vague suivante, non bloquants** : le trigger PPSPS ne protège que la
création (`INSERT`) contre un statut initial différent de `PREEDITION`, pas une modification
ultérieure de `status` par une requête `UPDATE` directe (relevé par l'audit Phase 9) ; l'absence de
fonction de révocation d'un achat de modèle (Marketplace C) ; l'absence de mécanisme de codes de
récupération MFA (API Supabase encore `@experimental`) ; le branchement de
`formatDateInTimezone()` sur les affichages existants (listes, PDF) n'a volontairement pas été
fait pour ne rien casser hors Mayotte. `docs/VALIDATION_CHECKLIST.md`, `docs/DECISIONS.md` (ce
fichier) et `database/README.md` restent à mettre à jour pour couvrir les migrations 0010-0049 —
prévu dans la vague suivante.

## 2026-10-29 — Vague 2 : garde-fou statut document, rattrapage docs, écran audit RGPD

**Décision** : 3 agents parallèles supplémentaires ont livré `database/migrations/0050` (garde
contre les sauts de statut de document illégitimes — voir `docs/ROADMAP.md` Phase 9 pour le
détail du cycle de transitions autorisé et les hypothèses retenues), le rattrapage de
`database/README.md`/`docs/VALIDATION_CHECKLIST.md` jusqu'à la migration 0049, et l'écran
`/audit` (Phase 9, export CSV du journal d'audit). Tout a été relu, vérifié
(typecheck/lint/build/test + advisors Supabase) et appliqué en production par Claude avant d'être
mergé sur `main` et poussé — mais, comme pour la vague 1, sans vérification fonctionnelle en
navigateur ni validation explicite de l'utilisateur.

## 2026-10-29 — "Leaked password protection" bloqué par le plan Supabase

**Décision** : ne pas chercher d'autre moyen d'activer ce réglage (toggle dashboard ou API de
gestion) jusqu'à ce que l'utilisateur confirme un passage en plan Supabase Pro.

**Contexte** : l'advisor de sécurité `auth_leaked_password_protection` signale ce réglage comme
désactivé depuis plusieurs vérifications. L'utilisateur a activé le toggle dans le dashboard, sans
effet observable sur l'advisor, puis a confirmé que la fonctionnalité nécessite un plan Pro sur ce
projet Supabase — mise à niveau reportée à plus tard par l'utilisateur. Ce n'est donc pas un bug
ni un oubli de configuration côté code.
