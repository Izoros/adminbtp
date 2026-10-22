# AdminBTP

Plateforme SaaS de gestion administrative et opérationnelle pour le secteur du BTP (Mayotte /
France). AdminBTP centralise le pilotage d'un chantier — phases, documents réglementaires, marché,
décomptes, visas, réserves, journal de chantier, relances — pour les entreprises du bâtiment, leurs
maîtres d'œuvre et leurs sous-traitants.

**AdminBTP est une plateforme commerciale multi-tenant**, pas un outil interne à une seule
entreprise : aucune société cliente (y compris celle qui sert de démonstration) n'a de privilège
implicite sur les données des autres. Voir [`docs/CDC/MULTI_TENANT_SAAS.md`](docs/CDC/MULTI_TENANT_SAAS.md).

## Ce que fait la plateforme

- **Moteur de chantier unique** : un seul moteur de phases/documents/lots/situations/validations,
  configuré par mission (`MissionRole`) et par profil d'organisation — jamais un moteur dupliqué
  par métier.
- **Actes de lancement MOE** (AE, notification du marché, OS de démarrage/prolongation...), avec
  checklist de dépendances et diffusion ciblée par lot.
- **Marché et décomptes** : pièces de marché structurées (CCAP/CCTP/DPGF/BPU), avenants, retenue de
  garantie, avance forfaitaire, situations de travaux avec ventilation vers des sous-traitants
  agréés, DGD.
- **Exécution de chantier** : visa de plans, réserves, journal de chantier, comptes-rendus dont
  chaque décision devient une tâche, avancement déclaré par lot.
- **Suivi quotidien** : classement de mail assisté, relances internes automatiques (visa en retard,
  situation non transmise, pièce d'agrément expirée), relances de situation (email/WhatsApp/courrier).
- **Marketplace & entitlements** : catalogue de services premium, annuaire professionnel BTP,
  activation strictement réservée à un Super Administrateur plateforme.

Les documents réglementaires sensibles (notamment le **PPSPS**) sont toujours générés en statut
*préédition* — jamais directement validés, qu'ils soient créés manuellement ou assistés par IA.

## Stack technique

- **Monorepo** pnpm workspaces — `apps/web` (Next.js 16, App Router, React 19, TypeScript strict)
  et des packages partagés (`packages/types`, `packages/ui`, `packages/config`,
  `packages/integrations`).
- **Supabase** (Postgres) pour l'authentification et la persistance réelle, avec RLS pour
  l'isolation multi-tenant.
- **`packages/types`** (schémas Zod) comme source unique de vérité du modèle métier — les
  migrations SQL et l'UI s'y réfèrent, jamais l'inverse.
- **Intégrations externes** (Odoo, email, WhatsApp, IA, n8n) toujours derrière une interface
  d'adaptateur dans `packages/integrations`, avec une implémentation `Demo*` sans I/O réseau tant
  qu'un fournisseur réel n'est pas branché.

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour le détail de l'organisation du code.

## Démarrer en local

```bash
pnpm install
pnpm --filter @adminbtp/web dev
```

Nécessite Node ≥ 20.9 et un projet Supabase configuré (voir [`database/README.md`](database/README.md)).

```bash
pnpm -r typecheck   # vérification des types sur tout le monorepo
pnpm -r lint        # lint
pnpm -r test        # tests unitaires
pnpm --filter @adminbtp/web build   # build de production
```

## État du projet

Le projet avance par phases avec portes de validation explicites — rien n'est considéré comme
terminé tant que l'utilisateur ne l'a pas validé. L'état exact de ce qui est livré, vérifié, ou
explicitement non fait est documenté dans :

- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — statut détaillé, phase par phase.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — roadmap complète et cases restantes.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — décisions techniques notables et bugs corrigés.
