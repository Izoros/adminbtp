# Cahier des charges — AdminBTP, plateforme SaaS multi-tenant

**Statut : exigence architecturale prioritaire, actée le 2026-10-21.** Ce document prévaut sur
toute interprétation antérieure qui laisserait entendre qu'AdminBTP est ou pourrait devenir un
outil interne dédié à une seule entreprise.

## Principe fondateur

AdminBTP est une plateforme SaaS commerciale multi-tenant destinée à **plusieurs entreprises
indépendantes du secteur du BTP**. Elle ne doit **jamais** être conçue, codée ou documentée comme
un logiciel interne exclusif à une entreprise donnée.

**MAWU** est un client et utilisateur initial de la plateforme — rien de plus. MAWU ne détient
aucun privilège implicite sur les données des autres entreprises clientes, n'est propriétaire
d'aucune fonctionnalité, et ne doit apparaître dans le code que comme une organisation de
démonstration comme une autre (au même titre que les organisations fictives déjà utilisées en
Phase 1 : SARL Madaterrassement, Bâti Mayotte Construction, Cabinet AMO Lagon). Un audit du
code à la date de ce document ne trouve aucune référence à "MAWU" dans le dépôt — à maintenir à
chaque revue.

## Deux modes d'utilisation à supporter

1. **SaaS autonome** : une entreprise cliente crée son propre espace (`Organization`), invite ses
   collaborateurs, crée ses chantiers et utilise les fonctionnalités de la plateforme selon son
   abonnement (`subscription_plan`), sans intervention d'AdminBTP.
2. **Gestion externalisée** : l'entreprise cliente peut mandater des gestionnaires AdminBTP
   (collaborateurs internes à la plateforme, rôle `role_scope = PLATEFORME`) pour administrer tout
   ou partie de ses dossiers, via une **délégation explicite, révocable et tracée**
   (`portfolio_grants`, voir ci-dessous).

Ces deux modes doivent pouvoir coexister pour une même organisation cliente (ex: une entreprise
auto-gère ses chantiers courants mais délègue temporairement le suivi des relances de paiement à
un gestionnaire AdminBTP).

## Exigences actées et leur traduction schéma

| Exigence | Traduction dans le schéma (voir `database/migrations/0005_multitenant_saas_requirements.sql`) |
|---|---|
| Onboarding multi-entreprises et abonnements | `organizations.subscription_plan` (existant) + `plan_features` (nouveau, feature flags par plan) |
| Isolation stricte des données par organisation, RLS | Existant depuis Phase 2 (`can_access_organization()`), étendu par `can_access_site()` pour la collaboration inter-entreprises (voir plus bas) |
| Rôles plateforme distincts des rôles entreprise et chantier | `users.role_scope` (nouveau, `PLATEFORME` \| `ENTREPRISE`) rend la distinction explicite au niveau schéma, en plus de `UserPermissionRole` (granularité du rôle) et `MissionRole` (rôle chantier, déjà séparé) |
| Affectation de gestionnaires à plusieurs sociétés, autorisations explicites | `portfolio_grants` (existant), complété par `revoked_at`/`revoked_by` pour la révocation tracée |
| Plusieurs domaines et adresses mail par entreprise | `organization_domains` (nouveau, un-à-plusieurs) ; `mail_addresses` supportait déjà plusieurs adresses par organisation |
| Modèles documentaires et signatures spécifiques par entreprise | `document_templates` (existant, déjà scopé par organisation) ; `signature_profiles` (nouveau, configuration de signature par organisation) |
| Collaboration inter-entreprises sur chantier partagé, contrôle d'accès par ressource | `site_participants` (existant) + nouvelle fonction RLS `can_access_site()` qui accorde l'accès à toute organisation participante, pas seulement à l'organisation propriétaire du chantier |
| Paramétrage des fonctionnalités par abonnement | `plan_features` (nouveau) |
| Connecteurs Odoo et n8n isolés par organisation | `organization_integrations` (nouveau, config non-secrète par organisation et par type d'intégration) |
| Gestion future de l'intégration Odoo par le client lui-même | Modélisé par `organization_integrations.managed_by` (`ADMINBTP` \| `CLIENT`) — le changement de mode n'implique pas de migration de schéma |

## Rôles — trois niveaux distincts, jamais confondus

1. **Rôle plateforme** (`role_scope = PLATEFORME`, `organization_id IS NULL`) : collaborateurs
   AdminBTP eux-mêmes (ex: `ADMIN_PLATEFORME`, `RESPONSABLE_PORTEFEUILLE`,
   `GESTIONNAIRE_ADMINISTRATIF`, `CHARGE_AFFAIRES`, `ASSISTANT_ADMINISTRATIF`,
   `EXPERT_TECHNIQUE`). Leur accès à une organisation cliente passe **exclusivement** par un
   `portfolio_grants` explicite (ou par `ADMIN_PLATEFORME`, qui voit tout par définition de son
   rôle plateforme).
2. **Rôle entreprise** (`role_scope = ENTREPRISE`, `organization_id IS NOT NULL`) : utilisateurs
   d'une entreprise cliente (`DIRIGEANT_CLIENT`, `COLLABORATEUR_CLIENT`, `VALIDATEUR`,
   `OBSERVATEUR` quand rattachés à une organisation). Leur accès est scopé à leur organisation et,
   via `site_participants`, aux chantiers partagés auxquels leur organisation participe.
3. **Rôle chantier** (`MissionRole` sur `site_participants`) : le rôle métier d'une organisation
   sur un chantier donné (MOA, MOE, sous-traitant...), indépendant du rôle applicatif de
   l'utilisateur. Une même organisation peut avoir des `MissionRole` différents selon le chantier.

## Collaboration inter-entreprises — contrôle d'accès par ressource

Avant ce document, les politiques RLS n'accordaient l'accès à un chantier (`sites`) qu'à
l'organisation propriétaire (`sites.organization_id`). Une entreprise participante au titre de
`site_participants` (ex: sous-traitant, BET) n'avait **aucune visibilité**, ce qui contredit
l'exigence de collaboration inter-entreprises sur chantier partagé. La fonction RLS
`can_access_site(target_site_id)` corrige cela : elle accorde l'accès si l'utilisateur peut
accéder à l'organisation propriétaire **ou** à l'une des organisations listées comme participante
sur ce chantier. Le contrôle reste **par ressource** (un chantier donné), pas par organisation
entière : participer à un chantier ne donne pas accès aux autres chantiers de l'organisation
propriétaire.

## Ce qui reste hors schéma à ce stade (documenté, pas encore implémenté)

- Flux d'onboarding self-service (création d'organisation par un utilisateur non invité) — non
  implémenté ; aujourd'hui un nouvel inscrit démarre sans organisation et doit être rattaché
  manuellement (voir `database/migrations/0002_auth_user_sync.sql`).
- Application effective des `plan_features` dans l'UI et les policies RLS (le plan est modélisé,
  son application aux fonctionnalités reste à construire au fur et à mesure du développement des
  écrans réels).
- Stockage sécurisé des secrets d'intégration (clés API Odoo/n8n réelles) — `organization_integrations`
  ne stocke que de la configuration non sensible (URL, identifiants d'instance) ; les secrets
  doivent passer par un coffre-fort dédié (Supabase Vault ou équivalent), jamais en clair dans une
  table applicative.

Voir `docs/ROADMAP.md` pour le séquencement de ces travaux dans les phases suivantes.
