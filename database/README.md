# Base de données AdminBTP

**Phase 2 : connectée.** Le schéma de ce dossier est appliqué au projet Supabase **"AdminBTP"**
(ref `azphgxzapyuazxtqzvta`, région eu-west-1, Postgres 17) depuis le 2026-10-21, via le
connecteur MCP Supabase.

- `migrations/0001_init_core_schema.sql` — schéma relationnel complet, dérivé des schémas Zod de
  `packages/types`. `users.id` référence directement `auth.users.id`.
- `migrations/0002_auth_user_sync.sql` — trigger `on_auth_user_created` : crée automatiquement un
  profil `public.users` (rôle `OBSERVATEUR`, sans organisation) à chaque inscription Supabase
  Auth. L'affectation à une organisation et l'élévation de rôle se font ensuite manuellement.
- `migrations/0003_security_hardening.sql` — corrections suite aux advisors de sécurité Supabase
  (search_path explicite, révocation d'exécution RPC directe sur les fonctions internes).
- `migrations/0004_performance_hardening.sql` — corrections suite aux advisors de performance
  (index manquants sur FK secondaires, suppression de policies RLS redondantes).
- `migrations/0005_multitenant_saas_requirements.sql` — exigences SaaS multi-tenant actées le
  2026-10-21 (voir `docs/CDC/MULTI_TENANT_SAAS.md`) : `role_scope` explicite sur `users`,
  `organization_domains` (multi-domaine), `plan_features` (fonctionnalités par abonnement),
  `organization_integrations` (Odoo/n8n isolés par organisation), `signature_profiles`
  (signature par organisation), révocation tracée sur `portfolio_grants`.
- `migrations/0006_multitenant_saas_rls.sql` — fonction `can_access_site()` pour la collaboration
  inter-entreprises sur chantier partagé (contrôle d'accès par ressource), RLS des nouvelles
  tables, création/révocation de `portfolio_grants`.
- `migrations/0007_multitenant_saas_performance_cleanup.sql` — index manquants + policies
  d'écriture restructurées (FOR ALL → INSERT/UPDATE/DELETE séparées) pour éviter l'évaluation en
  double avec les nouvelles policies SELECT élargies.
- `migrations/0008_persistence_write_policies.sql` — policies d'écriture sur `validation_records`
  (Approuver/Refuser) et `organizations` (Enregistrer le profil), pour la persistance réelle des
  actions jusque-là visuelles sans effet.
- `migrations/0009_fix_rls_helper_recursion.sql` — correction d'un bug de récursion RLS sur
  `can_access_site()` (statement timeout sur toute requête liée à un chantier) en passant les
  fonctions utilitaires RLS en `SECURITY DEFINER` — voir `docs/DECISIONS.md` pour l'analyse
  complète et le skill `adminbtp-multitenant-security` pour la règle à retenir.
- `policies/0001_rls_policies.sql` — politiques RLS d'isolation multi-tenant par
  `organization_id`, avec prise en charge des collaborateurs AdminBTP multi-organisations
  (`portfolio_grants`). Amendé par 0006 à 0009 (voir note en tête de fichier).
- `schemas/` — réservé aux phases suivantes. `seeds/0001_demo_admin_user.sql` — compte de
  démonstration ADMIN_PLATEFORME (voir ce fichier pour le piège GoTrue documenté).
  `seeds/0002_demo_dataset.sql` — jeu de données complet (organisations, chantiers, documents,
  mails, tâches, finance, validations), traduction fidèle des anciennes fixtures
  `apps/web/src/lib/mock-data` (supprimées, remplacées par de vraies requêtes Supabase).

## Migrations 0010 à 0049 (Marketplace, moteur de chantier avancé, sécurité, Mayotte, MFA)

Depuis la Phase 2 initiale ci-dessus (`0001`-`0009`), neuf lots supplémentaires ont été écrits et
appliqués en production, résumés ici par lot logique plutôt que migration par migration :

- **Entitlements Marketplace Phase A** (`0010`-`0011`) — catalogue partagé de services
  (`service_categories`/`service_catalog`/`service_prices`), demandes d'activation
  (`access_requests`), accès effectif par organisation (`organization_entitlements` + historique
  append-only `entitlement_grants`). Toute mutation passe par des fonctions `SECURITY DEFINER`
  (`grant_entitlement`, `suspend_entitlement`, `reactivate_entitlement`, `extend_entitlement`,
  `revoke_entitlement`, `approve_access_request`...) qui vérifient explicitement
  `ADMIN_PLATEFORME` en première instruction — aucune policy RLS d'écriture sur
  `organization_entitlements`/`entitlement_grants`, même pour ADMIN_PLATEFORME.
  `has_entitlement()` centralise la vérification d'accès pour toute table premium future.
- **Moteur de chantier avancé** (`0012`-`0016`) — profil société/corps d'état
  (`organization_profiles`/`organization_trades`), actes de lancement déclaratifs
  (`act_templates`), pièces de marché structurées (`market_contracts`/`market_clauses`/
  `price_lines`), décomptes enrichis (`situation_lines`/`situation_allocations`), macrolots
  (`lots.parent_lot_id`) et contrôle qualité IA/humain (`document_reviews`). Garde-fou
  `has_valid_subcontractor_agreement()` + trigger `check_subcontractor_allocation()` : une
  ventilation vers un sous-traitant exige un DC4/agrément `VALIDE`.
- **Annuaire professionnel BTP — Marketplace Phase B** (`0017`-`0020`) — catalogue partagé
  d'entreprises/contacts (`directory_companies`/`directory_contacts`), gouverné par les
  entitlements de Phase A. Double protection indépendante : RLS
  (`has_any_accessible_entitlement()`) et privilèges par colonne (`revoke`/`grant select` sur les
  seules colonnes de navigation) ; `directory_contacts` n'a aucune policy `SELECT`, lecture
  exclusivement via `get_directory_company_contacts()`. Quota mensuel de fiches distinctes
  consultées (`organization_entitlements.access_quota`, ajouté en `0017`, posable à l'octroi
  depuis `0019`).
- **Tranches A à E du moteur de chantier** (`0021`-`0032`, `0034`) — pièces d'entreprise datées et
  groupement de lot (`organization_credentials`/`lot_members`), avenants/retenue de
  garantie/avance/DGD/relances tracées (`amendments`, colonnes `market_contracts`/`situations`,
  `reminder_logs`), visa de plans/réserves/journal de chantier/comptes-rendus/avancement
  (`plan_submissions`, `reserve_items`, `site_log_entries`, `meeting_notes` et tables liées,
  `lot_progress`), relances internes paramétrées par chantier (`check_internal_reminders()`),
  bureaux de mission OPC/CT/SPS/BET (rôles `CT`/`SPS`/`CSSI`, `meeting_agenda_items`,
  `lot_schedule_notes`, `technical_opinions`), verrouillage d'un compte-rendu validé (`0031`),
  suppression douce tracée du journal/des réserves/des comptes-rendus (`0032`, fonctions
  `soft_delete_*`, motif obligatoire, trace `audit_log`), et diffusion réelle + accusé de
  réception des comptes-rendus validés (`0034`, `meeting_note_distributions`/
  `meeting_note_acknowledgments`).
- **Durcissement sécurité 0033** — suite au rapport des advisors Supabase (lint
  `anon_security_definer_function_executable`, 24 fonctions) : révocation du droit `EXECUTE` par
  défaut de `PUBLIC`/`anon` sur toutes les fonctions `SECURITY DEFINER` créées par `0001`-`0029`
  (notamment `_upsert_entitlement()`, jusque-là appelable par n'importe qui sans session),
  ré-accordé explicitement à `authenticated` seul. Règle reprise par chaque migration
  `SECURITY DEFINER` suivante (`0036`, `0039`, `0041`-`0042`, `0048`-`0049`) : révoquer d'abord
  `public`/`anon` (et `authenticated` pour les fonctions internes jamais appelées en RPC direct),
  puis accorder explicitement à `authenticated` si l'application l'appelle.
- **Phase 3 — stockage réel et garantie PPSPS** (`0035`-`0036`) — bucket Supabase Storage privé
  `documents` (RLS alignée sur `can_access_organization()`), et trigger
  `enforce_ppsps_preedition()` : un document `category = 'PPSPS'` naît toujours en statut
  `PREEDITION` à l'insertion, quel que soit le statut demandé par le code appelant — garantie
  portée par la base, pas seulement par convention applicative (`0036` retire le `GRANT EXECUTE`
  oublié par `0035` sur cette fonction trigger, qui n'a aucun usage RPC légitime).
- **Phase 11 — paramétrage locale par organisation** (`0037`) — `organizations.timezone` (défaut
  `Indian/Mayotte`) et `organizations.postal_code_patterns` (regex optionnelles), pour permettre
  une extension hors Mayotte sans changer le comportement d'une organisation existante qui ne
  touche pas à ce réglage (aucune validation ni fuseau horaire n'était auparavant codé en dur).
- **MFA Phase 2** (`0039`) — `public.users.mfa_enabled` (colonne de cache en lecture pour l'UI,
  existait depuis `0001` mais jamais écrite) synchronisée par le trigger
  `handle_mfa_factor_change()` sur `auth.mfa_factors` ; aucun secret ni code applicatif stocké,
  le TOTP est entièrement géré par Supabase Auth. Aucune policy RLS d'`UPDATE` n'autorise le
  client à écrire cette colonne lui-même (seul ce trigger `SECURITY DEFINER` le peut).
- **Marketplace Phase C — bibliothèque de modèles premium** (`0041`-`0042`) — catalogue
  (`document_template_catalog`), versions immuables (`template_versions`, jamais supprimées même
  après retrait du catalogue ou publication d'une nouvelle version) et registre d'achats par
  organisation (`template_purchases`, jamais transférable entre organisations).
  `has_template_purchase()`/`has_any_template_purchase()` gouvernent à la fois la policy RLS
  `SELECT` sur `template_versions` et la vérification applicative explicite
  (`get_purchased_template_version()`, appelée par la Server Action de génération — défense en
  profondeur). Flux d'achat : `request_template_purchase()` →
  `approve_template_purchase_request()` (réservée `ADMIN_PLATEFORME`, aucune policy
  INSERT/UPDATE/DELETE sur `template_purchases`, même pour ADMIN_PLATEFORME). Un document généré
  référence `documents.premium_template_version_id` (jamais le catalogue), contrainte
  `documents_single_template_source` interdisant de référencer à la fois un modèle
  organisationnel (Phase 3) et un modèle premium.
- **Marketplace Phase D — abonnements et crédits prépayés** (`0046`-`0049`) — abonnements par
  organisation × service (`organization_subscriptions`, même forme que les entitlements de Phase
  A) via `activate_subscription`/`suspend_subscription`/`reactivate_subscription`/
  `extend_subscription`/`cancel_subscription` (réservées `ADMIN_PLATEFORME`) ; portefeuille de
  crédits prépayés (`credit_wallets`, solde jamais négatif par contrainte `check`) alimenté par
  `add_credits()` (réservée `ADMIN_PLATEFORME`) et débité de façon idempotente et transactionnelle
  par `debit_credits()`/`record_usage()` (`usage_records`, `credit_transactions` append-only, clé
  d'idempotence unique par organisation garantissant qu'un retry réseau ne débite jamais deux
  fois). `debit_credits()` n'est appelable que depuis `record_usage()` (appel interne sous le
  rôle propriétaire de la fonction) — jamais directement par `authenticated`. Aucune policy RLS
  d'écriture sur les quatre tables de cette phase.

Numérotation : `0038`, `0040` et `0043`-`0045` n'existent pas dans ce dossier à ce jour (numéros
non utilisés dans cette lignée de travail) — la suite reprend sans rupture fonctionnelle à
`0039`/`0041`/`0046`.

## Historique : nettoyage d'un schéma hérité

Avant d'appliquer ce schéma, le projet contenait déjà 28 tables d'un projet AdminBTP antérieur
(créé 2026-05-21/22, non lié à ce dépôt), avec des noms différents (`projects`, `organization_members`,
`consulting_missions`, `ai_suggestions`, `client_portal_accesses`...). Toutes les tables étaient
vides. L'utilisateur a confirmé qu'il s'agissait d'un projet précédent abandonné — ce schéma a été
supprimé (tables, enums, fonctions métier, CASCADE) avant d'appliquer le schéma ci-dessus. Voir
`docs/DECISIONS.md` pour le détail.

## Reste à faire

Mis à jour après relecture complète de `0001` à `0049` (2026-10-29). Le sélecteur d'organisation
mentionné comme manquant dans une version précédente de cette section existe désormais
(`OrgSwitcher`, voir `apps/web/src/components/layout/org-switcher.tsx`) — retiré de cette liste.

- Point de vigilance toujours ouvert côté advisors : "Leaked password protection" désactivé —
  réglage du dashboard Auth (Authentication → Policies → Password Security), pas du schéma SQL,
  à activer manuellement (confirmé encore vrai dans `docs/INTEGRATIONS_STATUS.md` et
  `docs/PROJECT_STATUS.md`).
- Policies RLS d'écriture : chaque tranche/phase a posé ses propres policies `INSERT`/`UPDATE`
  au fur et à mesure (voir migrations `0010` à `0049` ci-dessus) — ce n'est plus une liste fermée
  de tables comme en Phase 2, mais toujours étendu au cas par cas selon les flux applicatifs
  réellement écrits, jamais par défaut.
- `plan_features` reste créée vide — toujours aucune ligne de référence semée (quelles
  fonctionnalités par plan DEMO/STARTER/PRO/ENTERPRISE reste une décision produit non prise).
- Flux d'onboarding self-service (une entreprise crée elle-même son organisation) toujours non
  implémenté — voir `docs/CDC/MULTI_TENANT_SAAS.md`.
- **Garde de transition de statut sur `documents.status`** : `enforce_ppsps_preedition()` (`0035`)
  ne garantit qu'un état de *naissance* (`BEFORE INSERT`) pour un PPSPS — aucun trigger ni
  contrainte ne contrôle les transitions ultérieures d'un `UPDATE` sur `documents.status` (pour
  un PPSPS comme pour toute autre catégorie). En cours de correction par ailleurs (voir
  `database/migrations/` pour une éventuelle migration `0050` au moment de la lecture ; à ce jour
  elle n'existe pas encore dans ce dossier, donc signalé ici comme point ouvert).
- **Pas de fonction de révocation d'achat de modèle Marketplace Phase C** : `0041`-`0042`
  fournissent `request_template_purchase()` et `approve_template_purchase_request()`, mais aucune
  fonction symétrique (`revoke_template_purchase()` ou équivalent) ne permet à `ADMIN_PLATEFORME`
  de retirer un achat déjà accordé — contrairement aux entitlements de Phase A
  (`revoke_entitlement()`) et aux abonnements de Phase D (`cancel_subscription()`).
- **Pas de codes de récupération MFA** : `0039` synchronise uniquement l'état TOTP
  (`auth.mfa_factors`) vers `public.users.mfa_enabled` ; aucun mécanisme de codes de récupération
  (backup codes) n'existe en base ni côté application pour un utilisateur qui perd l'accès à son
  authentificateur.
- Numérotation des migrations : `0038`, `0040`, `0043`-`0045` sont absentes de ce dossier à ce
  jour — à surveiller si un travail parallèle doit les introduire, pour éviter toute collision de
  numéro.
