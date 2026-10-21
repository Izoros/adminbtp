---
name: adminbtp-multitenant-security
description: Modèle d'isolation multi-tenant AdminBTP (organization_id, role_scope, RLS Supabase, portfolio_grants révocables, collaboration inter-entreprises sur chantier partagé) et règles de sécurité à respecter dans tout code touchant aux données. Utiliser avant d'écrire une requête, une policy RLS ou un endpoint qui lit/écrit des données métier.
---

# Sécurité et isolation multi-tenant

## Principe d'isolation — AdminBTP est un SaaS multi-tenant, jamais un outil interne

Chaque organisation cliente (`Organization`, tenant) ne doit jamais voir les données d'une autre
organisation, sauf collaboration explicite sur un chantier partagé (voir plus bas). Toute table
métier porte `organization_id` (directement, ou via une table parente comme `sites`/`documents`
pour les tables qui en dépendent — voir `database/migrations/0001_init_core_schema.sql` pour le
détail table par table).

**Exigence architecturale prioritaire (2026-10-21)** : AdminBTP est une plateforme SaaS
commerciale destinée à plusieurs entreprises indépendantes, jamais un logiciel interne exclusif à
une entreprise. **MAWU est un client et utilisateur initial, sans privilège implicite** — elle ne
doit jamais apparaître dans le code comme propriétaire implicite de la plateforme, seulement comme
une organisation de démonstration parmi d'autres. Aucune règle métier, interface ou donnée ne doit
être codée en dur pour une entreprise en particulier. Voir `docs/CDC/MULTI_TENANT_SAAS.md`.

**Exception explicite et volontaire** : les collaborateurs AdminBTP (gestionnaires, chargés
d'affaires) supervisent plusieurs organisations clientes à la fois. Cet accès transverse est
modélisé par `PortfolioGrant`/`portfolio_grants`, **jamais** par un rôle global qui court-circuite
l'isolation — chaque accès cross-organisation doit être une ligne explicite et traçable
(`grantedBy`, `grantedAt`), pas un flag booléen "voit tout". Cette délégation est **révocable** :
`revokedAt`/`revokedBy` marquent la fin d'un accès sans jamais supprimer la ligne (traçabilité).
`has_portfolio_access()` exclut déjà les grants révoqués — ne jamais contourner cette fonction par
une requête directe sur `portfolio_grants`.

## RLS (Row Level Security)

`database/policies/0001_rls_policies.sql` définit la fonction `can_access_organization(org_id)`
utilisée par la plupart des policies :
```
ADMIN_PLATEFORME → accès total
membre de l'organisation (users.organization_id = org_id) → accès
détenteur d'un portfolio_grants non révoqué sur org_id → accès
sinon → aucun accès
```
`database/migrations/0006_multitenant_saas_rls.sql` ajoute `can_access_site(site_id)` pour les
ressources de chantier (`sites` et tout ce qui en dépend : `phase_instances`, `documents`,
`mail_threads`, `tasks`, `situations`, `reminder_rules`, `site_participants`, `lots`,
`site_access`) : accorde l'accès en **lecture** à l'organisation propriétaire du chantier **et** à
toute organisation participante (`site_participants`) — c'est le mécanisme de collaboration
inter-entreprises sur chantier partagé. Contrôle **par ressource** : participer à un chantier ne
donne jamais accès aux autres chantiers de l'organisation propriétaire. L'écriture
(`INSERT`/`UPDATE`/`DELETE`) reste réservée à l'organisation propriétaire sur ces tables — une
organisation participante peut voir, pas modifier, sauf policy explicite contraire.

Toute nouvelle table métier ajoutée au schéma doit activer RLS et recevoir une policy basée sur
`can_access_organization()` ou `can_access_site()` selon qu'elle est propre à une organisation ou
rattachée à un chantier. Ne jamais laisser une table métier sans RLS actif, même "temporairement".

**Piège vécu (2026-10-21, voir docs/DECISIONS.md)** : toute fonction utilitaire RLS qui lit une
table elle-même protégée par RLS doit être `SECURITY DEFINER` **dès sa création** — sinon ses
lectures internes redéclenchent l'évaluation de la policy qui l'appelle, qui la rappelle, etc.
`can_access_site()` lisait `sites`/`site_participants` en `SECURITY INVOKER` ; comme ces deux
tables portent des policies qui appellent `can_access_site()`, toute requête liée à un chantier
bloquait ~47s avant d'échouer en `57014 statement timeout`. Les 5 fonctions RLS
(`can_access_organization`, `can_access_site`, `current_user_permission_role`,
`current_user_organization_id`, `has_portfolio_access`) sont `SECURITY DEFINER` et restent
volontairement exécutables en RPC direct (contrairement à `handle_new_user`/`rls_auto_enable`,
révoquées) car Postgres les appelle lui-même pendant l'évaluation de policies sur des requêtes
ordinaires — leur révoquer casserait RLS pour tout le monde.

**Ces policies sont appliquées au projet Supabase réel depuis la Phase 2** (2026-10-21) — voir
`database/README.md` pour le détail des migrations.

## Rôle plateforme vs rôle entreprise vs rôle métier chantier — trois niveaux distincts

Trois notions à ne jamais confondre (voir `docs/CDC/MULTI_TENANT_SAAS.md`) :

1. **`role_scope`** (`PLATEFORME` \| `ENTREPRISE`, colonne explicite sur `users`) : distingue un
   collaborateur AdminBTP (la plateforme elle-même, `organization_id` toujours `NULL`) d'un
   utilisateur d'une entreprise cliente. Un rôle `PLATEFORME` ne doit **jamais** être rattaché à
   une organisation — contrainte `users_role_scope_platforme_no_org` posée en base.
2. **`UserPermissionRole`** (`ADMIN_PLATEFORME`, `GESTIONNAIRE_ADMINISTRATIF`,
   `DIRIGEANT_CLIENT`...) décrit le niveau d'accès applicatif précis dans son `role_scope`
   (`PERMISSION_ROLE_SCOPE` dans `packages/types/src/roles.ts` fait la correspondance).
3. **`MissionRole`** (MOA, MOE, sous-traitant...) décrit **le rôle de l'organisation sur un
   chantier**, totalement indépendant des deux premiers. Une même organisation peut avoir des
   `MissionRole` différents selon le chantier ; un `DIRIGEANT_CLIENT` d'une société
   "sous-traitant" sur un chantier et "entreprise générale" sur un autre garde le même
   `UserPermissionRole`/`role_scope` partout.

## Données sensibles

- Ne jamais placer de SIRET, email personnel, ou autre donnée identifiante dans une URL ou un
  log applicatif en clair au-delà du nécessaire.
- `AuditLogEntry` est **append-only** : aucune policy d'UPDATE/DELETE ne doit jamais être créée
  dessus pour un rôle applicatif standard — seules des fonctions serveur avec la clé service
  peuvent y écrire, jamais une requête côté client.
- Le mode démo (`[DEMO]` dans les adaptateurs `packages/integrations`) ne doit jamais faire de
  vrai I/O réseau — c'est une garantie de sécurité autant qu'une garantie fonctionnelle : un bug
  qui ferait fuiter un appel réseau depuis un adaptateur démo enverrait potentiellement de la
  donnée de test vers un tiers.

Voir [[adminbtp-quality-gate]] pour les critères de revue sécurité avant chaque validation de
phase.
