---
name: adminbtp-multitenant-security
description: Modèle d'isolation multi-tenant AdminBTP (organization_id, RLS Supabase, portfolio_grants pour les collaborateurs multi-organisations) et règles de sécurité à respecter dans tout code touchant aux données. Utiliser avant d'écrire une requête, une policy RLS ou un endpoint qui lit/écrit des données métier.
---

# Sécurité et isolation multi-tenant

## Principe d'isolation

Chaque organisation cliente (`Organization`, tenant) ne doit jamais voir les données d'une autre
organisation. Toute table métier porte `organization_id` (directement, ou via une table parente
comme `sites`/`documents` pour les tables qui en dépendent — voir
`database/migrations/0001_init_core_schema.sql` pour le détail table par table).

**Exception explicite et volontaire** : les collaborateurs AdminBTP (gestionnaires, chargés
d'affaires) supervisent plusieurs organisations clientes à la fois. Cet accès transverse est
modélisé par `PortfolioGrant`/`portfolio_grants`, **jamais** par un rôle global qui court-circuite
l'isolation — chaque accès cross-organisation doit être une ligne explicite et traçable
(`grantedBy`, `grantedAt`), pas un flag booléen "voit tout".

## RLS (Row Level Security)

`database/policies/0001_rls_policies.sql` définit la fonction `can_access_organization(org_id)`
utilisée par toutes les policies :
```
ADMIN_PLATEFORME → accès total
membre de l'organisation (users.organization_id = org_id) → accès
détenteur d'un portfolio_grants sur org_id → accès
sinon → aucun accès
```
Toute nouvelle table métier ajoutée au schéma doit activer RLS et recevoir une policy basée sur
cette fonction (ou une jointure vers une table qui la porte, comme `sites`/`documents` pour leurs
tables filles). Ne jamais laisser une table métier sans RLS actif, même "temporairement".

**Ces policies ne sont pas encore appliquées à une base réelle en Phase 1** (aucun Supabase
connecté) — elles doivent être revues et testées avant toute connexion à un environnement avec de
vraies données client.

## Rôle métier vs permission informatique — ne jamais confondre

`MissionRole` (MOA, MOE, sous-traitant...) décrit **le rôle de l'organisation sur un chantier**,
pas ce qu'un utilisateur a le droit de faire dans l'application. `UserPermissionRole`
(`ADMIN_PLATEFORME`, `GESTIONNAIRE_ADMINISTRATIF`, `DIRIGEANT_CLIENT`...) décrit **le niveau
d'accès applicatif** d'un utilisateur. Un `DIRIGEANT_CLIENT` d'une société "sous-traitant" sur un
chantier et "entreprise générale" sur un autre a le même `UserPermissionRole` partout, mais son
organisation a des `MissionRole` différents selon le chantier.

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
