# Checklist de validation — Phase 1

À cocher avant de considérer la Phase 1 comme validée par l'utilisateur. Voir le skill
`adminbtp-quality-gate` pour la version réutilisable de cette checklist aux phases suivantes.

## Scaffold et outillage

- [x] Monorepo pnpm workspaces (`apps/*`, `packages/*`) fonctionnel.
- [x] `apps/web` : Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4.
- [x] 4 packages partagés créés et liés (`@adminbtp/types`, `@adminbtp/ui`, `@adminbtp/config`,
      `@adminbtp/integrations`), résolution vérifiée dans `apps/web/node_modules/@adminbtp/`.

## Design system et navigation

- [x] Tokens de couleur/typo/radius définis (packages/config + globals.css).
- [x] Composants UI de base (Button, Badge, Card, Input, Skeleton, EmptyState, PageHeader, Tabs).
- [x] Layout responsive : sidebar desktop, drawer mobile, topbar — vérifié visuellement aux deux
      largeurs.

## Écrans prioritaires (13/13)

- [x] Connexion (démo, sans auth réelle)
- [x] Tableau de bord (8 KPI + alertes critiques + charge par gestionnaire)
- [x] Organisations clientes (liste + fiche détail)
- [x] Portefeuille gestionnaires
- [x] Chantiers (liste + fiche détail avec onglets Intervenants/Phases/Documents/Mails/Tâches)
- [x] Documents (liste + rappel PPSPS préédition)
- [x] Mails (liste triée par urgence)
- [x] Tâches (kanban 4 colonnes)
- [x] Validations (en attente + historique, rappel preuve WhatsApp ≠ signature)
- [x] Relances (suivi de situations, alerte échéances dépassées)
- [x] Paramètres (organisation, modèles de documents, circuit de validation, intégrations)

## Vérifications techniques

- [x] `pnpm typecheck` : 0 erreur sur tout le monorepo.
- [x] `pnpm lint` : 0 erreur.
- [x] `pnpm build` : build de production réussi (14 routes générées).
- [x] `pnpm test` : 10 tests passants (utilitaires `cn`, `toneForSiteStatus`, composant `Badge`).
- [x] Vérification navigateur : connexion → dashboard → chaque écran de la navigation, desktop et
      mobile (375px), 0 erreur console, 0 erreur serveur.

## Règles métier non négociables respectées

- [x] PPSPS toujours généré en statut `PREEDITION` (mock data + rappel visuel sur `/documents`).
- [x] Preuve WhatsApp jamais confondue avec signature électronique (champ distinct
      `whatsappProofUrl` vs `signatureProvider`/`isLegallyBindingSignature`, rappel visuel sur
      `/validations`).
- [x] Isolation multi-tenant par `organization_id` modélisée dans tous les schémas Zod et les
      migrations SQL.
- [x] Intégrations externes toutes en mode démo, aucun I/O réseau réel.

## Base de données (préparée, non appliquée)

- [x] Migration SQL initiale écrite (`database/migrations/0001_init_core_schema.sql`), reflétant
      fidèlement `packages/types`.
- [x] Policies RLS écrites (`database/policies/0001_rls_policies.sql`), isolation
      `organization_id` + `portfolio_grants`.
- [ ] Appliquées à une base Supabase réelle — **volontairement hors scope Phase 1**.

## Documentation et organisation projet

- [x] 8 skills métier `.claude/skills/adminbtp-*`.
- [x] 6 agents spécialisés `.claude/agents/*`.
- [x] `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`,
      `docs/API_CONTRACTS.md`, `docs/VALIDATION_CHECKLIST.md` (ce fichier),
      `docs/INTEGRATIONS_STATUS.md`.
- [x] Premier commit git.

## Explicitement non fait (hors scope Phase 1, documenté)

- Authentification réelle, persistance réelle, intégrations réelles (Odoo/email/WhatsApp/IA/n8n),
  signature électronique — tous prévus aux phases suivantes (`docs/ROADMAP.md`).

---

# Checklist de validation — Module Marketplace & Entitlements, Phase A (2026-10-22)

Voir `docs/MONETIZATION_AND_ENTITLEMENTS.md` pour les règles produit et `docs/ROADMAP.md` pour le
découpage en phases A-E. Porte de validation du cahier des charges pour cette phase : *"un Super
Administrateur peut activer ou retirer un module pour une organisation"* — vérifié ci-dessous, à la
fois par simulation SQL directe et par parcours navigateur réel.

## Schéma, fonctions et RLS

- [x] 6 tables (`service_categories`, `service_catalog`, `service_prices`, `access_requests`,
      `organization_entitlements`, `entitlement_grants`) + 6 enums, RLS activée partout.
- [x] Aucune policy INSERT/UPDATE/DELETE sur `organization_entitlements`, `entitlement_grants` et
      `access_requests` — toute mutation passe par une fonction `SECURITY DEFINER` qui revérifie
      explicitement le rôle appelant.
- [x] `has_entitlement()` centralise la vérification d'accès (`SECURITY DEFINER`, réutilisable par
      une future policy RLS d'une autre table).
- [x] Advisors Supabase sécurité/performance revus après application — avertissements
      `SECURITY DEFINER` exécutable par `anon`/`authenticated` cohérents avec le reste du schéma
      (fonctions RLS historiques ont le même avertissement, chacune fait sa propre vérification
      interne) ; index de couverture FK ajoutés (`0011_entitlements_phase_a_fk_indexes.sql`).

## Scénarios de test exécutés réellement (simulation SQL directe, `set local role authenticated` +
`request.jwt.claims`, chaque transaction `rollback`ée après vérification — aucune donnée de
démonstration altérée par ces tests)

- [x] **Client sans option ne peut pas s'auto-accorder un accès** : `grant_entitlement()` appelé
      par un utilisateur `CHARGE_AFFAIRES` (non-admin) lève `42501` — vérifié.
- [x] **Administrateur de société cliente ne peut pas s'auto-accorder une option** : même test que
      ci-dessus, aucun rôle client (y compris un rôle d'administration côté entreprise) ne peut
      appeler les fonctions de mutation avec succès — seule `ADMIN_PLATEFORME` le peut.
- [x] **Super Administrateur peut approuver une demande en attente** : `approve_access_request()`
      exécuté avec succès par `ADMIN_PLATEFORME`, entitlement passé à `ACTIVE` — vérifié.
- [x] **Client A ne voit pas les données privées de Client B** : un entitlement accordé à une
      organisation sans portfolio grant pour l'utilisateur testé reste invisible en `SELECT`
      (0 ligne retournée), alors que `COUNT(*)` sans filtre confirme que la ligne existe bien en
      base — isolation RLS cross-org vérifiée.
- [x] **Insertion directe hors fonction refusée** : un `INSERT` manuel dans
      `organization_entitlements` par un utilisateur authentifié quelconque (y compris en
      contournant l'UI) échoue avec *"new row violates row-level security policy"* — aucune policy
      INSERT n'existe sur cette table.
- [x] **Pas de double activation** : approuver une demande déjà traitée (`status != 'PENDING'`)
      lève une exception explicite (*"Cette demande a déjà été traitée"*) au lieu de ré-accorder
      silencieusement un entitlement.
- [x] **Révocation a un effet immédiat** : `has_entitlement()` passe de `true` à `false` dans la
      même transaction que `revoke_entitlement()`, avant tout commit.

## Parcours navigateur réel (desktop, authentification réelle, deux comptes de démonstration)

- [x] Connexion `ADMIN_PLATEFORME` (Amina Chanfi) → `/services` affiche le catalogue par
      catégorie, prix formatés selon le modèle tarifaire, badge "Actif" sur l'entitlement
      pré-existant de démonstration.
- [x] Clic réel sur "Demander l'activation" (service BET) → crée une ligne `access_requests`
      réelle en base, bouton remplacé par "Demande en attente" / "Annuler la demande".
- [x] `/admin` → onglet Demandes affiche les deux demandes en attente (celle créée à l'instant et
      celle du jeu de données de démonstration) avec organisation, service, date, message.
- [x] Clic réel sur "Approuver et activer" → demande passée en historique avec statut "Approuvée",
      compteur "Demandes en attente" décrémenté, entitlement actif créé.
- [x] Clic réel sur "Suspendre" puis "Réactiver" sur un entitlement actif → badge et bouton mis à
      jour correctement après chaque action (pas seulement optimiste côté client — revalidation
      serveur confirmée en rechargeant les données).
- [x] Clic réel sur "Refuser" sur la demande restante → passée en historique avec statut "Refusée".
- [x] Déconnexion puis connexion avec le compte non-admin (Julien Perrot, `CHARGE_AFFAIRES`) :
      élément de navigation "Administration" absent du menu, navigation directe vers `/admin`
      redirige immédiatement vers `/dashboard` (garde de layout serveur).
- [x] Aucun montant présenté comme "encaissé" ou "revenu" nulle part dans `/admin` — uniquement des
      compteurs de droits d'accès, avec mention explicite en pied de tableau de bord.

## Vérifications techniques

- [x] `pnpm -r typecheck` : 0 erreur sur tout le monorepo.
- [x] `pnpm --filter @adminbtp/web lint` : 0 erreur.
- [x] `pnpm --filter @adminbtp/web build` : build de production réussi (`/services` et `/admin`
      générés comme routes dynamiques).
- [x] `pnpm -r test` : 10 tests passants (inchangés, aucune régression).

## Explicitement non fait en Phase A (prévu aux phases suivantes, voir `docs/ROADMAP.md`)

- Interface d'édition du catalogue/tarifs (Phase A expose le catalogue en lecture seule dans
  `/admin`, les services initiaux sont seedés directement en base).
- Annuaire BTP, bibliothèque de documents premium, crédits prépayés, abonnements facturés,
  intégration Odoo réelle (Phases B à E).
- Tâche planifiée de passage automatique `ACTIVE → EXPIRED` à l'échéance (le comportement de
  lecture via `has_entitlement()` est déjà correct même sans cette tâche, voir
  `docs/MONETIZATION_AND_ENTITLEMENTS.md`).
- Quota réel sur un service premium (aucun service du catalogue initial n'en a besoin — la
  primitive `has_entitlement()` est prête pour qu'une future table protégée l'utilise).

---

# Checklist de validation — Module Marketplace & Entitlements, Phase B (2026-10-22)

Annuaire professionnel BTP. Voir `docs/MONETIZATION_AND_ENTITLEMENTS.md` et
`docs/ARCHITECTURE.md` (section Phase B) pour les règles complètes. Porte de validation du cahier
des charges : *"un client non autorisé ne peut pas accéder aux données protégées, même par appel
API direct"* — vérifiée ci-dessous à deux niveaux indépendants (RLS et privilèges de colonne).

## Schéma, fonctions et RLS

- [x] 5 tables (`directory_categories`, `directory_sources`, `directory_companies`,
      `directory_contacts`, `directory_access_log`), RLS activée partout.
- [x] `directory_contacts` : aucune policy `SELECT` ni privilège `SELECT` direct pour
      `authenticated`/`anon` — uniquement lisible via `get_directory_company_contacts()`.
- [x] `directory_companies` : privilèges par colonne (`revoke select` puis `grant select` sur la
      liste exacte des colonnes de navigation) en plus de la policy RLS — deux mécanismes
      indépendants, l'un n'est pas un filet de sécurité pour l'autre, chacun suffit seul à bloquer.
- [x] Advisors Supabase sécurité/performance revus après application — avertissements cohérents
      avec le reste du schéma ; index de couverture FK ajoutés (`0018_directory_phase_b_fk_indexes.sql`).
- [x] Trois bugs réels trouvés par simulation SQL directe **avant** tout code applicatif, corrigés
      et reproduits en test positif après correction — voir `docs/DECISIONS.md` (2026-10-22) :
      référence de colonne ambiguë dans `get_directory_company_detail()`/`get_directory_company_contacts()`
      (`returns table (id uuid, ...)` recoupant `directory_companies.id`), cast `char(14)`→`text`
      manquant sur `siret`, et `create or replace function` ayant créé une surcharge au lieu de
      remplacer `grant_entitlement()`/`_upsert_entitlement()` dont l'arité changeait.

## Scénarios de test exécutés réellement (simulation SQL directe, chaque transaction `rollback`ée
ou constatée sans effet persistant après coup — vérifié par relecture de `directory_access_log`)

- [x] **Utilisateur sans aucune organisation habilitée → 0 ligne** : Julien (portfolio grant vers
      SARL Madaterrassement temporairement révoqué dans la transaction) ne voit aucune ligne de
      `directory_companies` en `SELECT` direct, alors que `COUNT(*)` sans RLS confirme que les
      lignes existent bien en base.
- [x] **Privilèges de colonne refusent `phone`/`siret` même pour une organisation habilitée** :
      Julien (entitled via SARL Madaterrassement) peut `SELECT name, city` mais `SELECT name, phone`
      échoue avec `42501 permission denied for table directory_companies` — un second mécanisme
      indépendant de RLS, qui aurait bloqué même si une policy RLS avait eu une faille.
- [x] **Quota positif** : 1er appel à `get_directory_company_detail()` réussit et retourne les
      coordonnées (quota = 1/mois pour SARL Madaterrassement sur `directory.btp`).
- [x] **Quota — pas de recomptage** : un second appel sur la **même** fiche le même mois réussit
      sans consommer de quota supplémentaire.
- [x] **Quota négatif** : un appel sur une fiche **différente** le même mois est refusé
      (`Quota mensuel de consultations atteint pour cet annuaire`).
- [x] **Déduplication** : `find_directory_duplicate()` retrouve une fiche existante par SIRET et
      par nom + code postal ; retourne `null` quand aucune correspondance.
- [x] **Admin voit tout** : `list_directory_companies_admin()` retourne les 6 fiches de
      démonstration sans filtrage par entitlement (réservé `ADMIN_PLATEFORME`, vérifié par refus
      pour un rôle non-admin).

## Parcours navigateur réel (desktop, authentification réelle, deux comptes de démonstration)

- [x] Connexion non-admin (Julien, organisation active par défaut Bâti Mayotte Construction, sans
      entitlement annuaire) → `/annuaire` affiche les 3 catégories toutes verrouillées ("Non
      souscrit" + lien vers `/services`).
- [x] Changement d'organisation active vers SARL Madaterrassement (entitlement `directory.btp`
      actif) → la catégorie "Entreprises BTP" se déverrouille avec ses 2 fiches réelles, les deux
      autres catégories restent verrouillées.
- [x] Clic réel sur une fiche → `/annuaire/[id]` affiche coordonnées et contact réels (consommation
      de quota confirmée).
- [x] Accès direct par URL à une fiche d'une catégorie non souscrite (Fournisseurs) → **404 réel**,
      pas un message d'erreur — la ligne est invisible dès la lecture des colonnes de navigation.
- [x] Reconsultation de la même fiche → toujours accessible (pas de recomptage).
- [x] Consultation d'une **deuxième** fiche le même mois → message d'erreur Postgres exact
      ("Quota mensuel...") remonté jusqu'à l'UI, pas un message générique.
- [x] Connexion admin → `/admin` onglet Annuaire : import CSV réel (2 nouvelles fiches + 1 doublon
      SIRET volontaire) → résultat exact affiché ("2 créées, 1 ignorée (doublon), 0 erreur"),
      compteurs par catégorie mis à jour, nouvelles fiches visibles dans la liste admin.
- [x] Formulaire "Octroyer directement" (onglet Entitlements) avec quota = 2 → entitlement créé et
      affiché avec "quota 2/mois" ; l'entitlement existant de SARL Madaterrassement affiche
      correctement "quota 1/mois" (régression de l'affichage vérifiée en même temps).

## Vérifications techniques

- [x] `pnpm -r typecheck` : 0 erreur sur tout le monorepo.
- [x] `pnpm -r lint` : 0 erreur.
- [x] `pnpm --filter @adminbtp/web build` : build de production réussi (`/annuaire` et
      `/annuaire/[id]` générés comme routes dynamiques).
- [x] `pnpm -r test` : 10 tests passants (inchangés, aucune régression).

## Explicitement non fait en Phase B (voir `docs/ROADMAP.md`)

- Import XLSX (CSV uniquement).
- Édition individuelle d'une fiche/d'un contact déjà importé.
- Export de fiches.
- Quota appliqué à un axe autre que "nombre de fiches distinctes consultées par mois".

---

# Checklist de validation — Module Marketplace & Entitlements, Phase C (2026-10-28)

Bibliothèque de modèles de documents premium. Voir `docs/MONETIZATION_AND_ENTITLEMENTS.md` et
`docs/ROADMAP.md` (Phase C) pour les règles complètes. Réutilise le moteur de génération existant
(Phase 3 — `generateDocumentFromTemplate`/`IAIProvider`/`renderGeneratedDocumentPdf`), jamais
dupliqué.

**Important — contrairement aux Phases A/B, les vérifications SQL ci-dessous n'ont PAS été
exécutées contre une instance réelle : cet environnement de travail n'a pas d'accès MCP
Supabase (consigne explicite de la tâche). Elles sont documentées ici pour qu'un humain les
exécute avant toute mise en production, après avoir appliqué les migrations 0041-0042 et le seed
`0006_template_marketplace_phase_c_seed.sql`.**

## Schéma, fonctions et RLS (revue statique du SQL, non exécutée)

- [x] 3 tables (`document_template_catalog`, `template_versions`, `template_purchases`), RLS
      activée partout.
- [x] `template_purchases` : aucune policy `INSERT`/`UPDATE`/`DELETE`, même pour
      `ADMIN_PLATEFORME` — écriture exclusivement via `approve_template_purchase_request()`
      (`SECURITY DEFINER`, vérifie `current_user_permission_role() = 'ADMIN_PLATEFORME'` en
      première instruction).
- [x] `template_versions` : policy `SELECT` basée sur `has_any_template_purchase()`, pas de
      policy `UPDATE`/`DELETE` — une version publiée n'est jamais modifiée ni supprimée.
- [x] `has_template_purchase()`/`has_any_template_purchase()` sont `SECURITY DEFINER` dès leur
      création (lisent une table elle-même protégée par RLS — même piège que `can_access_site()`
      documenté dans `docs/DECISIONS.md` et le skill `adminbtp-multitenant-security`).
- [x] `documents.premium_template_version_id` référence `template_versions(id)`, jamais
      `document_template_catalog(id)` — un document généré reste donc résoluble même si la ligne
      catalogue est désactivée (`is_active = false`) ou si une nouvelle version est publiée.
      Contrainte `documents_single_template_source` : un document ne référence jamais
      `template_id` (modèle organisationnel, Phase 3) et `premium_template_version_id` (modèle
      premium, Phase C) à la fois.

## Scénarios à exécuter (SQL direct, non exécutés dans cet environnement)

À exécuter après connexion à l'instance Supabase réelle, chaque transaction `rollback`ée sauf
mention contraire :

```sql
-- 1. Isolation : une organisation SANS achat valide ne voit aucune ligne template_versions, même
--    si elle est authentifiée et que les lignes existent bien (COUNT(*) sans RLS les confirme).
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<user_id_bati_mayotte>')::text, true);
select count(*) from template_versions
where template_catalog_id = 'c3d4e5f6-0001-4000-8000-000000000001'; -- attendu : 0

reset role;
select count(*) from template_versions
where template_catalog_id = 'c3d4e5f6-0001-4000-8000-000000000001'; -- attendu : 1 (RLS contournée)

-- 2. Organisation AVEC achat valide (SARL Madaterrassement) voit la version achetée.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<user_id_madaterrassement>')::text, true);
select count(*) from template_versions
where template_catalog_id = 'c3d4e5f6-0001-4000-8000-000000000001'; -- attendu : 1

-- 3. get_purchased_template_version() refuse explicitement une organisation sans achat (double
--    vérification applicative, indépendante de la RLS testée ci-dessus).
select * from get_purchased_template_version(
  '<organization_id_bati_mayotte>', 'c3d4e5f6-0001-4000-8000-000000000001'
); -- attendu : exception 42501 "Ce modèle n'a pas été acheté par cette organisation"

select * from get_purchased_template_version(
  'c0115ecd-2400-4a48-b18a-4db633451692', 'c3d4e5f6-0001-4000-8000-000000000001'
); -- attendu : 1 ligne (version achetée)

-- 4. Invariant de rétention : retirer le modèle du catalogue ne doit pas casser l'accès déjà
--    accordé, ni le document déjà généré.
update document_template_catalog set is_active = false
where id = 'c3d4e5f6-0001-4000-8000-000000000001';

select has_template_purchase(
  'c0115ecd-2400-4a48-b18a-4db633451692', 'c3d4e5f6-0001-4000-8000-000000000001'
); -- attendu : true (inchangé par is_active)

select * from get_purchased_template_version(
  'c0115ecd-2400-4a48-b18a-4db633451692', 'c3d4e5f6-0001-4000-8000-000000000001'
); -- attendu : toujours 1 ligne, retrait du catalogue sans effet sur l'achat existant

-- (générer un document via generateDocumentFromPremiumTemplate() avant le retrait, puis vérifier
-- après le retrait que `select * from documents where id = '<document_id>'` retourne toujours la
-- ligne avec son premium_template_version_id résolvable — invariant explicite du roadmap).

rollback;

-- 5. Seul ADMIN_PLATEFORME peut approuver un achat.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<user_id_non_admin>')::text, true);
select approve_template_purchase_request('<request_id>', null);
-- attendu : exception 42501 "Seul un Super Administrateur peut approuver un achat de modèle"
rollback;
```

- [ ] Scénario 1 (isolation stricte) — à exécuter par un humain après connexion Supabase.
- [ ] Scénario 2 (achat valide visible) — à exécuter par un humain après connexion Supabase.
- [ ] Scénario 3 (double vérification applicative) — à exécuter par un humain après connexion
      Supabase.
- [ ] Scénario 4 (rétention après retrait du catalogue, et document déjà généré consultable) — à
      exécuter par un humain après connexion Supabase.
- [ ] Scénario 5 (approbation réservée à `ADMIN_PLATEFORME`) — à exécuter par un humain après
      connexion Supabase.

## Vérifications techniques (exécutées dans cet environnement)

- [ ] `pnpm -r typecheck` — voir rapport de la tâche.
- [ ] `pnpm -r lint` — voir rapport de la tâche.
- [ ] `pnpm --filter @adminbtp/web build` — voir rapport de la tâche.

## Explicitement non fait en Phase C (voir `docs/ROADMAP.md`)

- Paiement réel : "Acheter" crée une ligne `access_requests` en attente de validation
  `ADMIN_PLATEFORME`, exactement comme les autres demandes du Marketplace — aucune intégration de
  paiement.
- Import DOCX réel avec extraction de variables (`file_url` reste un chemin Storage saisi par
  `ADMIN_PLATEFORME`, comme `document_templates` en Phase 3) — l'upload/la lecture automatique du
  modèle n'est pas dans le périmètre de cette phase.
- Mécanisme de mise à niveau automatique d'un achat existant vers une nouvelle version publiée :
  `approve_template_purchase_request()` pointe toujours vers la dernière version au moment de
  l'approbation, mais aucune notification ni ré-approbation automatique n'existe si une nouvelle
  version est publiée après un achat déjà approuvé.
- Application réelle des migrations/policies sur l'instance Supabase (aucun accès MCP dans cet
  environnement — à faire par un humain, voir `database/README.md`).
- **Pas de fonction de révocation d'un achat** : contrairement à `revoke_entitlement()` (Phase A),
  aucune fonction symétrique à `approve_template_purchase_request()` ne permet à
  `ADMIN_PLATEFORME` de retirer un achat déjà accordé dans `template_purchases` — **point ouvert,
  non traité par cette phase ni par aucune migration ultérieure relue (`0010` à `0049`)**.

---

# Checklist de validation — Durcissement sécurité (migrations 0033 et 0036)

Suite aux rapports des advisors de sécurité Supabase du 2026-10-23 et du 2026-10-27 (lint
`anon_security_definer_function_executable`). Revue statique du SQL effectuée pour cette mise à
jour documentaire (lecture complète de `0033` et `0036`), **non ré-exécutée contre une instance
réelle dans cet environnement**.

## Revue statique

- [x] `0033` révoque explicitement `EXECUTE` de `public`/`anon` (et `authenticated` pour le
      helper interne `_upsert_entitlement()`) sur les 24 fonctions `SECURITY DEFINER` posées par
      `0001` à `0029`, puis le ré-accorde à `authenticated` seul pour celles appelées par
      l'application — plus aucune de ces fonctions n'est appelable via
      `/rest/v1/rpc/<nom>` sans session authentifiée.
- [x] `0036` complète cet effort pour `enforce_ppsps_preedition()` (oubliée par `0035`), qui n'a
      de toute façon aucun usage RPC légitime (fonction trigger pure).
- [x] Règle documentée dans les commentaires de `0033` comme à reprendre pour toute nouvelle
      fonction `SECURITY DEFINER` — effectivement reprise par les migrations suivantes relues
      dans ce travail (`0036`, `0039`, `0041`-`0042`, `0048`-`0049`), chacune révoque `public`/
      `anon` puis accorde explicitement à `authenticated` (ou ne l'accorde à personne pour un
      helper interne).
- [ ] Ré-exécution des advisors de sécurité Supabase après application de `0033`/`0036` pour
      confirmer la disparition effective des avertissements — à faire par un humain avec accès
      MCP Supabase (hors de cet environnement).

## Explicitement non fait

- `ALTER DEFAULT PRIVILEGES` global n'a pas été utilisé (assumé, voir commentaire de `0033`) :
  chaque nouvelle fonction `SECURITY DEFINER` doit continuer à révoquer explicitement — un oubli
  reste possible migration par migration, pas de garde-fou automatique.

---

# Checklist de validation — Moteur de chantier avancé et Tranches A à E (migrations 0012-0016,
0021-0032, 0034)

D'après `docs/PROJECT_STATUS.md`, les Tranches A-D et la Tranche E (y compris son complément
diffusion/accusé de réception) ont été **validées par l'utilisateur le 2026-10-26** — cette
checklist n'existait pas encore à l'époque dans ce fichier ; elle est ajoutée ici après coup par
revue statique du SQL (`0012` à `0016`, `0021` à `0032`, `0034`), **sans ré-exécution de scénarios
SQL ou navigateur dans cet environnement**.

## Schéma, fonctions et RLS (revue statique)

- [x] Profil société/corps d'état, actes de lancement déclaratifs, pièces de marché structurées,
      décomptes enrichis, macrolots et contrôle qualité IA/humain (`0012`-`0016`) : RLS activée
      sur chaque nouvelle table, policies `SELECT`/`INSERT`/`UPDATE` cohérentes avec
      `can_access_site()`/`can_access_organization()` existants.
- [x] `has_valid_subcontractor_agreement()` + trigger `check_subcontractor_allocation()` :
      bloquent toute ventilation vers un sous-traitant sans DC4/agrément `VALIDE` (`0013`),
      durci en `0021` pour refuser aussi une pièce d'entreprise `EXPIRE`.
- [x] `prevent_lot_cycle()` : empêche un macrolot de devenir son propre ancêtre (profondeur
      maximale 50 contrôlée explicitement).
- [x] Avenants, retenue de garantie, avance, DGD, relances tracées (`0021`-`0022`) : contrainte
      `check_advance_balance()` interdit qu'une avance récupérée cumulée dépasse l'avance versée
      sur le contrat correspondant.
- [x] Journal de chantier, visa de plans, réserves, comptes-rendus, avancement (`0023`) : RLS
      posée sur chaque table via `can_access_site()`.
- [x] Compte-rendu validé figé (`0031`) : contrainte `meeting_notes_validation_consistency` +
      policies `UPDATE`/`INSERT` réécrites pour exiger `status = 'BROUILLON'` sur les tables
      liées (`meeting_attendees`, `meeting_decisions`, `meeting_agenda_items`).
- [x] Suppression douce du journal/des réserves/des comptes-rendus (`0032`) : colonnes
      `deleted_at`/`deleted_by_user_id`/`deletion_reason` avec contrainte de cohérence, trigger
      `_guard_soft_delete_columns()` interdisant tout contournement par `UPDATE` direct (rôles
      `anon`/`authenticated`), fonctions `soft_delete_site_log_entry()`/`soft_delete_reserve_item()`/
      `soft_delete_meeting_note()` exigeant un motif non vide et traçant dans `audit_log` ;
      `soft_delete_meeting_note()` annule aussi les tâches encore ouvertes issues de ses
      décisions et vérifie que l'appelant appartient à une organisation `OPC`/`MOE` active sur le
      chantier.
- [x] Bureaux de mission OPC/CT/SPS/BET (`0029`-`0030`) : nouveaux rôles chantier `CT`/`SPS`/
      `CSSI` ajoutés sans droit plateforme implicite, avis techniques (`technical_opinions`)
      affichés sans jamais bloquer le visa MOE.
- [x] Diffusion réelle et accusé de réception des comptes-rendus validés (`0034`) : policy
      `INSERT` sur `meeting_note_distributions` exige `status = 'VALIDE'` ; une organisation
      accuse réception au plus une fois par compte-rendu (contrainte unique).

## Scénarios de test — non exécutés dans cet environnement de travail documentaire

- [ ] Rejeu des scénarios SQL/navigateur ayant servi à la validation utilisateur du 2026-10-26
      (voir `docs/PROJECT_STATUS.md`) — non rejoués ici ; cette section documente une revue de
      code a posteriori, pas une nouvelle exécution.

## Explicitement non fait (voir `docs/PROJECT_STATUS.md` / `docs/ROADMAP.md`)

- Preuve WhatsApp réelle pour les relances (toujours `Demo*`).
- Application mobile OPC dédiée.

---

# Checklist de validation — Phase 3 : stockage réel et garantie technique PPSPS (migrations 0035,
0036)

Revue statique de `0035`-`0036` effectuée pour cette mise à jour documentaire. L'exécution
navigateur/IA réelle de cette phase est déjà documentée de façon vérifiée dans
`docs/PROJECT_STATUS.md` (section "Phase 3") — non refaite ici, seule la garantie SQL est
revérifiée par lecture du code ci-dessous.

## Revue statique

- [x] Trigger `enforce_ppsps_preedition()` (`BEFORE INSERT on documents`) : force
      `status = 'PREEDITION'` dès qu'un document a `category = 'PPSPS'`, quelle que soit la
      valeur transmise par l'appelant — garantie au niveau base, pas seulement convention
      applicative dans `createDocument()`/`generateDocumentFromTemplate()`.
- [x] Bucket Storage privé `documents`, policies `storage.objects` alignées sur
      `can_access_organization((storage.foldername(name))[1]::uuid)` pour les quatre opérations
      (`select`/`insert`/`update`/`delete`).
- [x] `0036` révoque `EXECUTE` sur `enforce_ppsps_preedition()` (fonction trigger pure, oubliée
      par `0033`/`0035`).

## Point ouvert identifié lors de cette revue (hors scope de ce qui a été vérifié en 2026-10-26)

- **Pas de garde sur les transitions ultérieures de `documents.status`** : le trigger ne couvre
  que l'`INSERT` d'un PPSPS. Aucun trigger ni contrainte ne contrôle un `UPDATE` de
  `documents.status` (PPSPS ou autre catégorie) — par exemple rien n'empêche aujourd'hui, côté
  base, de faire régresser un document `VALIDE` vers `BROUILLON` ou de sauter une étape du
  circuit de validation par un appel direct. **En cours de correction par un autre travail en
  parallèle** : vérifier si une migration `0050` (ou suivante) existe dans
  `database/migrations/` au moment de la lecture ; à la date de cette revue (2026-10-29), elle
  n'existe pas encore — signalé ici comme gap connu, pas comme résolu.

---

# Checklist de validation — Phase 11 : paramétrage locale par organisation (migration 0037)

## Revue statique

- [x] `organizations.timezone` (défaut `'Indian/Mayotte'`) et
      `organizations.postal_code_patterns` (`text[]`, défaut `NULL`) ajoutées sans migration de
      données : toute organisation existante conserve exactement son comportement actuel
      (aucune validation de code postal, aucun fuseau figé côté code) tant que personne ne
      renseigne ces colonnes.
- [x] Commentaires de colonnes (`comment on column`) documentant explicitement cette garantie de
      non-régression.

## Point ouvert

- [ ] **Aucun appel applicatif ne lit encore ces deux colonnes** (vérifié par la migration
      elle-même, qui le dit explicitement : "les appels de formatage qui ne la lisent pas encore
      continuent de se comporter exactement comme avant") — le réglage existe en base mais n'est
      pas encore exploité par `apps/web` au moment de cette revue ; à confirmer/compléter par la
      personne qui a porté cette phase avant de considérer Phase 11 comme terminée.

---

# Checklist de validation — MFA Phase 2 (migration 0039)

## Revue statique

- [x] Aucune table applicative pour un secret ou un code : le TOTP est entièrement délégué à
      Supabase Auth (`auth.mfa_factors`/`auth.mfa_challenges`).
- [x] `public.users.mfa_enabled` synchronisée par le trigger `handle_mfa_factor_change()`
      (`SECURITY DEFINER`, `AFTER INSERT OR UPDATE OR DELETE on auth.mfa_factors`) — vrai si au
      moins un facteur `verified` existe pour l'utilisateur.
- [x] Aucune policy RLS d'`UPDATE` sur `users` n'autorise le client à écrire `mfa_enabled`
      lui-même — seule écriture possible via ce trigger, cohérent avec la règle déjà appliquée à
      `handle_new_user()` (`0002`).
- [x] `EXECUTE` sur `handle_mfa_factor_change()` révoqué de `public`/`anon`/`authenticated`
      (fonction trigger pure, même règle que `0033`).
- [x] Rattrapage ponctuel pour tout facteur déjà vérifié avant la création du trigger (`update`
      inconditionnel en fin de migration, sans effet si aucun facteur MFA n'existait encore).

## Points ouverts identifiés lors de cette revue

- **Pas de codes de récupération (backup codes)** : aucune table ni fonction ne permet à un
  utilisateur de récupérer l'accès à son compte s'il perd son authentificateur TOTP — ce gap
  n'est traité par aucune migration relue (`0010` à `0049`). À documenter explicitement comme
  limite connue avant toute communication "MFA disponible" côté produit.
- [ ] Vérification de l'écran UI MFA natif (activation/désactivation d'un facteur, badge
      "MFA activé" dans la topbar et `/parametres`) — non vérifiée dans cet environnement
      documentaire (pas d'accès navigateur) ; mentionnée comme livrée par le message du commit
      `85811ca` mais à confirmer par un parcours réel avant de cocher cette phase comme validée.

---

# Checklist de validation — Module Marketplace & Entitlements, Phase D : abonnements et crédits
prépayés (migrations 0046-0049)

Revue statique du SQL effectuée pour cette mise à jour documentaire — **non exécutée contre une
instance réelle ni vérifiée en navigateur dans cet environnement**, même limite que la Phase C
ci-dessus.

## Schéma, fonctions et RLS (revue statique)

- [x] 4 tables (`organization_subscriptions`, `credit_wallets`, `usage_records`,
      `credit_transactions`), RLS activée partout, aucune policy `INSERT`/`UPDATE`/`DELETE` sur
      aucune des quatre — toute écriture passe par une fonction `SECURITY DEFINER`.
- [x] Abonnements : `_upsert_subscription()` (helper interne, `EXECUTE` révoqué de tous les
      rôles applicatifs) + une fonction publique par action
      (`activate_subscription`/`suspend_subscription`/`reactivate_subscription`/
      `extend_subscription`/`cancel_subscription`), chacune vérifiant explicitement
      `current_user_permission_role() = 'ADMIN_PLATEFORME'` en première instruction — même
      pattern que `grant_entitlement()` (Phase A). `is_subscription_active()` centralise la
      vérification d'abonnement actif et non expiré.
- [x] Crédits : `credit_wallets.balance` protégé par une contrainte `check (balance >= 0)` en
      plus du contrôle applicatif. `add_credits()` réservée `ADMIN_PLATEFORME` (verrou de ligne
      `for update` avant lecture puis écriture du solde, pour sérialiser les ajouts/débits
      concurrents).
- [x] `debit_credits()` : idempotente (clé d'idempotence unique par organisation sur
      `credit_transactions`, un retry renvoie la transaction déjà créée sans débiter deux fois),
      refuse tout débit qui mettrait le solde en négatif ou si le portefeuille a expiré. **Non
      exposée à `authenticated`** — révoquée de `public`/`anon`/`authenticated`, appelable
      uniquement depuis `record_usage()` (appel interne sous le rôle propriétaire de la
      fonction) : un appel direct contournerait la vérification d'abonnement actif et ne
      laisserait aucune trace dans `usage_records`.
- [x] `record_usage()` : orchestre `usage_records` + `debit_credits()` dans une seule
      transaction (idempotente de bout en bout via `on conflict ... do nothing` puis relecture
      en cas de course concurrente) ; bloque toute consommation si un abonnement existe pour le
      service et n'est pas actif, même si l'organisation dispose encore de crédits. Ouverte à
      `authenticated`, protégée par `can_access_organization()` : un utilisateur ne peut débiter
      que le portefeuille de sa propre organisation.

## Scénarios à exécuter (non exécutés dans cet environnement)

- [ ] Un rôle non-`ADMIN_PLATEFORME` ne peut appeler aucune des 5 fonctions de cycle de vie
      d'abonnement ni `add_credits()` — attendu `42501`.
- [ ] Un `UPDATE`/`INSERT` manuel direct sur les 4 tables échoue (aucune policy d'écriture).
- [ ] Un retry de `record_usage()`/`debit_credits()` avec la même `idempotency_key` ne débite
      jamais deux fois — à vérifier par appel SQL direct répété.
- [ ] Un débit qui mettrait le solde en négatif est refusé avec le message explicite attendu.
- [ ] Une consommation sur un service dont l'abonnement est `EXPIRED`/`SUSPENDED` est refusée
      même si le portefeuille de crédits a un solde suffisant.
- [ ] Appel direct de `debit_credits()` par un rôle `authenticated` quelconque (hors appel
      interne via `record_usage()`) : attendu un refus (`permission denied`, droit `EXECUTE`
      non accordé).

## Vérifications techniques

- [ ] `pnpm -r typecheck` / `pnpm -r lint` / `pnpm --filter @adminbtp/web build` — non exécutés
      pour cette mise à jour purement documentaire ; à faire avant de considérer Phase D comme
      validée si un travail applicatif (UI, Server Actions) a été ajouté en parallèle de ces
      migrations.

## Couche applicative (constat, non vérifié en exécution)

- Des Server Actions existent déjà (`apps/web/src/lib/actions/subscriptions.ts` :
  `activateSubscription`/`suspendSubscription`/`reactivateSubscription`/`extendSubscription`/
  `cancelSubscription`/`addCredits`) et des requêtes de lecture
  (`apps/web/src/lib/data/subscriptions.ts`), intégrées dans `/admin`
  (`apps/web/src/app/(app)/admin/page.tsx`). **Non revues en détail ni testées dans cet
  environnement documentaire** — cette checklist ne couvre que le SQL (`0046`-`0049`) ; la
  correction des Server Actions (vérification de rôle côté serveur, gestion d'erreur,
  revalidation) reste à auditer séparément avant de cocher cette phase comme validée.
- Aucun débit (`record_usage()`) consommé par une fonctionnalité réelle de l'application n'a été
  identifié dans ce qui a été relu — seule la commercialisation (abonnement, ajout de crédits)
  semble câblée côté UI à ce stade, pas encore la consommation (ex: un appel IA qui débiterait
  effectivement un portefeuille).

## Explicitement non fait en Phase D (constaté dans les migrations 0046-0049)

- Paiement réel en contrepartie d'un ajout de crédits ou d'une activation d'abonnement — reporté
  à une Phase E/facturation (hors scope de ce qui a été relu dans `0010` à `0049`).
- Tâche planifiée de passage automatique `ACTIVE → EXPIRED` à l'échéance d'un abonnement (même
  limite déjà documentée pour les entitlements de Phase A).
