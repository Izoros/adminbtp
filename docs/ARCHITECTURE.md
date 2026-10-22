# Architecture AdminBTP

## Vue d'ensemble

AdminBTP est un monorepo pnpm workspaces regroupant une application Next.js et des packages
partagés. Il n'existe **aucun backend applicatif custom** en Phase 1 : les données sont des
fixtures en mémoire (`apps/web/src/lib/mock-data`), et le schéma SQL/RLS destiné à Supabase est
écrit mais non appliqué (voir `database/README.md`).

```
AdminBTP/
├── apps/
│   └── web/                  Next.js 16 (App Router) — unique application Phase 1
│       └── src/
│           ├── app/
│           │   ├── page.tsx              Connexion (démo, pas d'auth réelle)
│           │   └── (app)/                Route group : écrans protégés par AppShell
│           │       ├── dashboard/
│           │       ├── organisations/[id]/
│           │       ├── portefeuille/
│           │       ├── chantiers/[id]/
│           │       ├── documents/
│           │       ├── mails/
│           │       ├── taches/
│           │       ├── validations/
│           │       ├── relances/
│           │       └── parametres/
│           ├── components/
│           │   ├── ui/        Primitives (Button, Badge, Card, Input, Skeleton, EmptyState,
│           │   │               PageHeader, Tabs) — cva, pattern shadcn/ui écrit à la main
│           │   ├── layout/     Sidebar, Topbar, MobileNav, AppShell
│           │   └── dashboard/  KpiCard
│           └── lib/
│               ├── mock-data/  Fixtures Phase 1 (organisations, chantiers, phases, documents...)
│               ├── navigation.ts
│               └── utils.ts    cn() — clsx + tailwind-merge
├── packages/
│   ├── types/          Schémas Zod — SOURCE DE VÉRITÉ des types métier (@adminbtp/types)
│   ├── ui/              Logique de présentation indépendante de React (@adminbtp/ui)
│   ├── config/          Tokens de design partagés (@adminbtp/config)
│   └── integrations/    Interfaces d'adaptateur + implémentations Demo* (@adminbtp/integrations)
├── database/
│   ├── migrations/      SQL non appliqué — dérivé de packages/types
│   ├── policies/        RLS non appliqué — isolation multi-tenant
│   ├── schemas/ seeds/   Réservés aux phases suivantes
├── n8n/workflows/        Réservé — aucun workflow exporté en Phase 1
├── odoo/                 Réservé — aucune connexion Odoo en Phase 1
├── .claude/
│   ├── skills/           8 skills métier adminbtp-*
│   └── agents/           6 agents spécialisés
└── docs/                 Cette documentation
```

## Pourquoi ce découpage en packages

- **`@adminbtp/types`** : chaque entité métier (Organization, Site, Document, Task, Situation...)
  est un schéma Zod. C'est la source unique de vérité — les migrations SQL, les mocks, et les
  composants React s'y réfèrent, jamais l'inverse. Un changement de modèle métier commence
  toujours ici.
- **`@adminbtp/ui`** : logique de présentation (ex: `toneForSiteStatus()`, mapping statut →
  couleur sémantique) volontairement **indépendante de React**, pour pouvoir être réutilisée par
  un futur client mobile sans dépendre de composants web. Les composants React concrets
  (Badge, etc.) restent dans `apps/web`. Voir `docs/DECISIONS.md` pour le contexte de cet écart
  par rapport à un simple dossier `apps/web/src/components/ui`.
- **`@adminbtp/config`** : tokens de couleur/typographie/radius partagés, dupliqués en variables
  CSS dans `apps/web/src/app/globals.css` (Tailwind v4 ne lit pas directement un fichier TS pour
  le thème — voir `docs/DECISIONS.md`).
- **`@adminbtp/integrations`** : une interface `I*Adapter`/`I*Provider` par système externe
  (Odoo, email, WhatsApp, IA, n8n), chacune avec une implémentation `Demo*` sans I/O réseau. C'est
  le seul point d'entrée vers un système tiers — `apps/web` ne doit jamais importer un SDK tiers
  directement.

## Flux de données Phase 1

```
mock-data (fixtures statiques)
        │
        ▼
  Pages React Server/Client (apps/web/src/app/(app)/**)
        │
        ▼
  Composants UI (apps/web/src/components/ui) + logique de présentation (@adminbtp/ui)
```

Aucune requête réseau, aucune base de données réelle. L'authentification sur `/` redirige vers
`/dashboard` sans vérification (formulaire React Hook Form + Zod validé côté client uniquement).

## Ce qui n'existe pas encore (volontairement, hors scope Phase 1)

- Authentification réelle (Supabase Auth, MFA).
- Base de données connectée (les fichiers SQL de `database/` sont écrits mais non appliqués).
- Tout appel réseau réel vers Odoo, un fournisseur email/WhatsApp, un LLM, ou n8n.
- Persistance d'aucune action utilisateur (approuver une validation, enregistrer un paramètre) —
  ces actions sont visuellement présentes mais non branchées, clairement indiqué dans l'UI.

Voir `docs/ROADMAP.md` pour quand ces éléments sont prévus, et `docs/INTEGRATIONS_STATUS.md` pour
le détail des services externes et outils CLI non disponibles dans cet environnement.

## Module Marketplace & Entitlements (2026-10-22)

Système de commercialisation — catalogue de services premium, demandes d'activation, droits
d'accès (`entitlements`). Voir `docs/MONETIZATION_AND_ENTITLEMENTS.md` pour les règles produit
complètes et `docs/ROADMAP.md` pour le découpage en phases A-E. Ce qui suit décrit uniquement la
Phase A (catalogue + moteur d'autorisation), seule implémentée à ce stade.

```
packages/types/src/entitlements.ts   Schémas Zod (ServiceCatalogItem, AccessRequest,
                                      OrganizationEntitlement, EntitlementGrant, ...)
database/migrations/0010_*.sql       Tables + fonctions SECURITY DEFINER + RLS
database/migrations/0011_*.sql       Index de couverture FK (suivi advisor performance)
database/seeds/0003_*.sql            Catalogue initial (14 services) + scénario de démo
apps/web/src/lib/data/entitlements.ts     Lectures (mapping snake_case → Zod)
apps/web/src/lib/actions/entitlements.ts  Server Actions — appellent uniquement les RPC SQL,
                                           aucune logique d'autorisation dupliquée côté Next.js
apps/web/src/app/(app)/services/page.tsx  Catalogue client + demandes
apps/web/src/app/(app)/admin/            Interface Super Administrateur (layout = garde de rôle)
```

**Principe central** : toute mutation d'un droit d'accès passe par une fonction SQL
`SECURITY DEFINER` dédiée (`grant_entitlement`, `approve_access_request`, etc.), jamais par un
`UPDATE`/`INSERT` direct depuis le code applicatif — `organization_entitlements` et
`entitlement_grants` n'ont **aucune** policy RLS d'écriture, pas même pour `ADMIN_PLATEFORME`.
Chaque fonction de mutation réservée à l'administration revérifie explicitement
`current_user_permission_role() = 'ADMIN_PLATEFORME'` en première instruction, parce que
`SECURITY DEFINER` contourne RLS — cette vérification applicative est donc la seule protection
réelle sur ces fonctions, pas une redondance. Voir
`docs/MONETIZATION_AND_ENTITLEMENTS.md#règle-absolue` pour le détail des trois niveaux de défense.

La fonction `has_entitlement(organization_id, service_code)` est le point d'entrée réutilisable
unique pour vérifier un accès premium — pensée dès Phase A pour être appelée depuis une future
policy RLS d'une table protégée (annuaire Phase B, bibliothèque Phase C), jamais dupliquée dans du
code React ou une route API.

## Module Marketplace — Phase B : annuaire professionnel BTP (2026-10-22)

```
database/migrations/0017_directory_phase_b_schema.sql        Tables + fonctions + RLS + privilèges colonne
database/migrations/0018 à 0020_*.sql                        Index FK, quota à l'octroi, correctif surcharge
database/seeds/0005_directory_phase_b_seed.sql                Catégories + 6 fiches de démonstration
packages/types/src/directory.ts                                Schémas Zod
apps/web/src/lib/data/directory.ts                              Lectures — colonnes de navigation en direct,
                                                                 coordonnées/contacts via RPC uniquement
apps/web/src/lib/actions/directory.ts                           Import CSV (parseur maison, pas de dépendance)
apps/web/src/app/(app)/annuaire/                                Catalogue client + fiche détail (consomme le quota)
apps/web/src/app/(app)/admin/page.tsx (onglet Annuaire)          Import, liste complète, compteurs
```

**Deux niveaux de protection, tous deux côté base** (voir `docs/MONETIZATION_AND_ENTITLEMENTS.md`
pour les règles produit complètes) :

1. **RLS** (`has_any_accessible_entitlement()`) — une organisation sans entitlement `ACTIVE` pour
   la catégorie (`directory.btp`/`directory.bet`/`directory.suppliers`) ne voit **aucune ligne**
   de `directory_companies`, même via un appel API direct.
2. **Privilèges par colonne**, indépendants de RLS — même avec l'entitlement, un `SELECT` direct
   sur `directory_companies` ne retourne que les colonnes de navigation (`id`, `category_id`,
   `name`, `trade_code_id`, `city`, `postal_code`, `source_id`, `created_at`, `updated_at` :
   `grant select (...)` nommé explicitement, après `revoke select` du grant large par défaut).
   Les coordonnées (téléphone, email, site, adresse, SIRET, notes) ne sont accessibles que via
   `get_directory_company_detail()`, qui applique en plus le quota et journalise. `directory_contacts`
   n'a **aucune** policy ni privilège `SELECT` direct : uniquement `get_directory_company_contacts()`.

**Conséquence pour le code applicatif** : `apps/web/src/lib/data/directory.ts` ne doit **jamais**
faire `select("*")` sur `directory_companies` pour la navigation (ça échouerait avec
`permission denied for column`) — toujours la liste exacte de colonnes autorisées. Les coordonnées
et contacts passent systématiquement par `supabase.rpc(...)`, jamais par un `select()` direct.

**Quota mensuel générique** : `organization_entitlements.access_quota` (ajouté en Phase B mais pas
spécifique à l'annuaire) compte les fiches **distinctes** consultées par organisation et mois
civil dans `directory_access_log` — reconsulter une fiche déjà vue ce mois-ci ne recompte pas.
`ADMIN_PLATEFORME` n'est jamais soumis au quota. Réglable à l'octroi via `grant_entitlement()`,
étendu en Phase B avec un paramètre `p_access_quota` optionnel (rétrocompatible).

**Piège rencontré, à retenir pour toute future fonction `SECURITY DEFINER`** : changer le nombre
de paramètres d'une fonction existante (`grant_entitlement`, `_upsert_entitlement`) avec
`create or replace function` ne la remplace pas — ça crée une **surcharge** coexistant avec
l'ancienne signature, puisque Postgres identifie une fonction par nom **et** types de paramètres.
Toujours `drop function if exists <ancienne signature exacte>` avant de recréer avec une arité
différente. Voir `docs/DECISIONS.md` (2026-10-22) pour cette leçon et deux autres bugs réels
(référence de colonne ambiguë dans une fonction `RETURNS TABLE`, cast `char(14)`→`text` manquant)
trouvés et corrigés pendant cette implémentation.
