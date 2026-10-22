# Commercialisation et entitlements — AdminBTP

Règles produit et techniques du module Marketplace (catalogue de services, annuaire BTP,
bibliothèque de documents premium, abonnements, crédits). Acté le 2026-10-22. Voir
`docs/ROADMAP.md` pour le découpage en phases A-E et `docs/CDC/MULTI_TENANT_SAAS.md` pour le
modèle multi-tenant dont ce module hérite (isolation `organization_id`, `role_scope`).

## Règle absolue

**Seul un utilisateur `ADMIN_PLATEFORME` ("Super Administrateur") peut autoriser, activer,
suspendre, prolonger ou révoquer un accès premium.** Un administrateur de société cliente n'a
jamais ce pouvoir, même sur sa propre organisation. Une demande d'activation ou un paiement
enregistré **n'active jamais rien automatiquement** pour un service soumis à validation.

Cette règle est appliquée à trois niveaux, du plus fort au plus faible (défense en profondeur) :

1. **Aucune policy RLS d'écriture** n'existe sur `organization_entitlements` ni
   `entitlement_grants`, pour personne, pas même `ADMIN_PLATEFORME`. La seule façon d'écrire ces
   tables est d'appeler une fonction SQL `SECURITY DEFINER` dédiée.
2. **Chaque fonction de mutation** (`grant_entitlement`, `suspend_entitlement`,
   `reactivate_entitlement`, `extend_entitlement`, `revoke_entitlement`, `approve_access_request`,
   `reject_access_request`) vérifie explicitement
   `current_user_permission_role() = 'ADMIN_PLATEFORME'` en première instruction et lève une
   exception `42501` sinon. C'est nécessaire et pas redondant avec (1) : `SECURITY DEFINER`
   contourne RLS, donc cette vérification applicative est la **seule** protection réelle sur ces
   fonctions — sans elle, n'importe quel utilisateur authentifié pourrait s'accorder un accès via
   un appel RPC direct (`/rest/v1/rpc/grant_entitlement`).
3. **L'UI** (`/admin`, gardée par `apps/web/src/app/(app)/admin/layout.tsx`) n'affiche les actions
   d'administration qu'à `ADMIN_PLATEFORME` — confort de navigation, pas une protection : un client
   qui devine l'URL ou appelle l'API directement est bloqué par (1) et (2).

### Architecture pour activation automatique future, sans toucher aux règles actuelles

`service_catalog.requires_admin_approval` (booléen) permet de configurer, service par service, un
mode d'activation automatique à la demande — **sans modifier le comportement des services
actuellement protégés**. Aujourd'hui, les 14 services du catalogue initial ont tous
`requires_admin_approval = true` : la branche d'auto-activation existe dans
`request_service_access()` (voir plus bas) mais reste inactive tant qu'aucun Super Administrateur
ne bascule ce réglage pour un service donné.

## Distinction abonnement facturé / autorisation d'accès

Ce sont deux concepts volontairement séparés, même si Phase A ne modélise que le second :

- **Autorisation d'accès** (`organization_entitlements`, Phase A) : la table de vérité pour "cette
  organisation a-t-elle le droit d'utiliser ce service maintenant ?". C'est elle que consulte
  `has_entitlement()`.
- **Abonnement facturé** (`organization_subscriptions`, Phase D) : la relation commerciale
  récurrente qui *justifie habituellement* une autorisation, mais qui n'en déclenche jamais
  l'octroi automatiquement pour un service `requires_admin_approval = true`. Un Super
  Administrateur peut accorder un entitlement sans abonnement (geste commercial, essai) et refuser
  un entitlement malgré un paiement en attente de vérification.

## Modèles de facturation (`ServiceBillingModel`)

`FREE`, `SUBSCRIPTION_MONTHLY`, `SUBSCRIPTION_ANNUAL`, `PER_UNIT`, `PREPAID_CREDIT`,
`CREDIT_PACK`, `SERVICE_PACKAGE`, `CUSTOM`, `QUOTE`. Seuls `FREE`/`SUBSCRIPTION_*`/`PER_UNIT`/
`QUOTE` sont utilisés par le catalogue initial (Phase A) ; `PREPAID_CREDIT`/`CREDIT_PACK` sont
réservés à la Phase D (crédits), `SERVICE_PACKAGE`/`CUSTOM` aux prestations d'expertise (Phase E).

## Tarification versionnée

`service_prices` : un service a au plus un prix "courant" à la fois (`effective_to is null`,
contrainte unique partielle `service_prices_one_current_per_service`). Changer un tarif crée une
nouvelle ligne et ferme l'ancienne (`effective_to`) — **un changement de tarif ne modifie jamais
rétroactivement** un entitlement déjà accordé, qui référence le `price_id` en vigueur au moment de
l'octroi (`organization_entitlements.price_id`).

## États

- **Demande d'activation** (`AccessRequestStatus`) : `PENDING` → `APPROVED` | `REJECTED` |
  `CANCELLED` (annulation par le demandeur lui-même, uniquement depuis `PENDING`). Aucune
  transition manuelle possible hors fonctions dédiées.
- **Entitlement** (`EntitlementStatus`) : `ACTIVE`, `SUSPENDED` (réversible via `reactivate`),
  `EXPIRED` (passage automatique implicite quand `expires_at < now()` — `has_entitlement()` le
  traite comme inactif même si la colonne n'a pas encore été rafraîchie par une tâche planifiée ;
  aucune tâche de ce type n'existe encore, Phase A ne modélise que la lecture correcte),
  `REVOKED` (définitif côté historique, mais un nouvel octroi reste possible plus tard — `GRANT`
  sur un entitlement `REVOKED` le repasse à `ACTIVE`, traçé dans `entitlement_grants`).

La révocation a un **effet immédiat** sur `has_entitlement()` (vérifié par simulation SQL, voir
`docs/VALIDATION_CHECKLIST.md`) sans jamais supprimer les documents déjà générés légitimement
pendant la période où l'accès était valide — Phase A ne touche à aucune donnée produite par
d'autres modules, seulement au droit d'accès lui-même.

## Historique immuable

`entitlement_grants` est **append-only** : aucune policy UPDATE/DELETE, aucune fonction ne modifie
une ligne existante. Chaque action (`GRANT`, `SUSPEND`, `REACTIVATE`, `EXTEND`, `REVOKE`) ajoute une
ligne avec l'état précédent et le nouvel état. Combiné à `audit_log` (table générique déjà
existante, réutilisée ici plutôt que créer une table d'audit redondante — conformément à la
consigne du cahier des charges), cela donne une double traçabilité : métier (`entitlement_grants`,
typée, requêtable par organisation/service) et transverse (`audit_log`, même format que les autres
actions sensibles de la plateforme).

## Flux client → admin

1. Le client parcourt `/services` (catalogue filtré par catégorie, prix affiché selon le modèle
   tarifaire, statut de l'entitlement courant de son organisation active).
2. "Demander l'activation" appelle `request_service_access(organization_id, service_id, message)`
   — vérifie `can_access_organization()`, crée une ligne `access_requests` `PENDING`, trace dans
   `audit_log`. Aucun accès n'est créé à cette étape (sauf service configuré en auto-activation,
   voir plus haut — aucun cas aujourd'hui).
3. Le Super Administrateur voit la demande dans `/admin` → onglet Demandes, avec le nom de
   l'organisation, le service demandé, le message éventuel et la date.
4. **Approuver** (`approve_access_request`) accorde l'entitlement (`ACTIVE`) atomiquement avec la
   mise à jour de la demande (`APPROVED`) et la trace d'audit — une seule fonction, une seule
   transaction. **Refuser** (`reject_access_request`) ne touche jamais à
   `organization_entitlements`.
5. Le client voit son statut mis à jour sur `/services` (badge Actif/Suspendu/Révoqué/Expiré,
   échéance si définie) et l'historique de ses demandes.

## Primitive de vérification d'accès réutilisable

```sql
has_entitlement(target_org_id uuid, target_service_code text) returns boolean
```

Point d'entrée **unique** pour toute vérification d'accès à une ressource premium, aujourd'hui
appelable en lecture directe, et pensé pour être réutilisé **dans une policy RLS** d'une future
table protégée (annuaire en Phase B, bibliothèque de modèles en Phase C) — c'est pourquoi il est
`SECURITY DEFINER` dès maintenant, même si rien ne l'exige encore en Phase A : une policy RLS sur
`directory_companies` pourra écrire `using (has_entitlement(organization_id, 'directory.btp'))`
sans dépendre des droits de lecture du policier sur `organization_entitlements`. **Ne jamais**
dupliquer cette logique de vérification dans du code React ou une route API — toujours passer par
cette fonction, pour que le contrôle reste centralisé et vérifiable en un seul endroit (exigence
explicite du cahier des charges).

## Codes de service stables

Les `service_catalog.code` ne sont jamais recodés en dur comme identifiant technique (l'`id` UUID
ne doit pas fuiter dans la logique applicative) : `directory.btp`, `directory.bet`,
`directory.suppliers`, `templates.basic`, `templates.moe`, `templates.tce`, `templates.moa`,
`documents.ppsps`, `documents.dc4`, `automation.followups`, `automation.mail`,
`integrations.odoo`, `expert.engineering`, `expert.architecture`.

## Odoo (préparé, non branché — Phase E)

AdminBTP reste **autoritaire sur les droits d'accès, quotas et consommation** quel que soit l'état
d'Odoo. Odoo peut devenir autoritaire sur la facturation une fois l'intégration branchée
(`service_orders`/`service_order_items` correspondant aux objets Odoo via l'adaptateur
`IOdooAdapter` existant — jamais un second système comptable parallèle). Si Odoo est indisponible,
les demandes restent en attente de synchronisation — **aucun paiement fictif n'est jamais créé**
pour compenser.

## Annuaire professionnel BTP (Phase B, 2026-10-22)

Catalogue partagé (entreprises BTP, BET, fournisseurs), gouverné par les mêmes entitlements posés
en Phase A (`directory.btp`, `directory.bet`, `directory.suppliers`). Deux niveaux de protection
des données, **tous deux côté base, jamais seulement côté UI** — voir `docs/ARCHITECTURE.md` pour
le détail technique :

1. **RLS** (`has_any_accessible_entitlement()`) : une organisation sans entitlement `ACTIVE` pour
   la catégorie ne voit aucune fiche, même par appel API direct.
2. **Privilèges par colonne**, indépendants de RLS : même avec l'entitlement, un `SELECT` direct
   ne retourne que les colonnes de navigation (nom, catégorie, métier, ville) — les coordonnées
   ne sont accessibles que via une fonction dédiée (`get_directory_company_detail()`), qui
   applique en plus le quota et journalise la consultation.

### Quota mensuel générique

`organization_entitlements.access_quota` (nullable, réutilisable au-delà de l'annuaire) limite le
nombre de fiches **distinctes** consultées par organisation sur le mois civil en cours. Reconsulter
une fiche déjà vue ce mois-ci ne recompte pas — le quota porte sur la diversité des fiches
consultées, pas sur le nombre total de vues. `ADMIN_PLATEFORME` n'est jamais soumis au quota
(exploration plateforme, pas une consommation cliente mesurée). Réglable au moment de l'octroi
(`grant_entitlement(..., p_access_quota)`), jamais modifiable après coup via une autre action à ce
stade — un changement de quota nécessite un nouvel octroi.

### Import et déduplication

Seul `ADMIN_PLATEFORME` importe des fiches (CSV uniquement, pas XLSX). La déduplication est
prioritairement par SIRET, puis par nom + code postal si le SIRET est absent — une fiche détectée
comme doublon est ignorée (comptée séparément), jamais fusionnée ni écrasée. Chaque import est
tracé dans `directory_sources` avec ses compteurs (créées/ignorées/erreurs).

## Ce que Phase A ne fait pas (explicitement, prévu aux phases suivantes)

- Bibliothèque de documents premium, crédits prépayés, abonnements facturés, intégration Odoo
  réelle : voir `docs/ROADMAP.md` Phases C-E. (L'annuaire BTP, Phase B, est fait — voir ci-dessus.)
- Tâche planifiée de passage automatique `ACTIVE → EXPIRED` quand `expires_at` est dépassé —
  `has_entitlement()` traite déjà correctement une échéance dépassée comme un accès inactif, donc
  aucune fonctionnalité n'est bloquée, mais la colonne `status` elle-même peut rester `ACTIVE` en
  base au-delà de l'échéance jusqu'à la prochaine action manuelle (prolonger/révoquer).
- Interface de gestion du catalogue (créer/modifier un service ou un prix) — Phase A expose le
  catalogue en lecture dans `/admin`, les 14 services initiaux sont seedés directement en base
  (`database/seeds/0003_entitlements_phase_a_seed.sql`).
