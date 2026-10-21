---
name: adminbtp-odoo
description: Règles d'intégration Odoo pour AdminBTP — adaptateur non bloquant, préférence JSON-2 API pour Odoo 19+, ce qui reste de la responsabilité d'AdminBTP vs d'Odoo. Utiliser pour tout travail touchant IOdooAdapter ou toute synchronisation avec Odoo.
---

# Intégration Odoo

## Odoo est un système séparé, jamais une dépendance bloquante

AdminBTP doit rester **pleinement fonctionnel sans Odoo connecté** — c'est le mode par défaut en
Phase 1 (`DemoOdooAdapter`). Aucune fonctionnalité cœur (phases, documents, validations, mails,
tâches) ne doit nécessiter un appel Odoo synchrone pour fonctionner. Odoo sert à synchroniser des
données comptables/commerciales en tâche de fond, jamais à bloquer un écran utilisateur.

## Choix d'API : JSON-2 API pour Odoo 19+

Pour les instances Odoo récentes (19+), préférer la **JSON-2 API** plutôt que l'ancien XML-RPC —
plus simple à typer côté TypeScript, meilleure gestion des erreurs HTTP standard. L'adaptateur
`IOdooAdapter` (`packages/integrations/src/odoo/adapter.ts`) doit exposer une interface agnostique
de la version d'API réellement utilisée côté implémentation concrète : le code appelant
(`apps/web`) ne doit jamais savoir si l'implémentation parle JSON-2 ou XML-RPC.

## Ce qui relève d'Odoo vs d'AdminBTP

| Domaine | Système responsable |
|---|---|
| Phases, checklists, moteur de workflow | AdminBTP (source de vérité) |
| Documents BTP (PPSPS, DOE, DGD...) | AdminBTP (source de vérité) |
| Comptabilité générale, facturation définitive | Odoo (source de vérité) |
| Fiches tiers (clients/fournisseurs) si le client utilise déjà Odoo | Odoo (source de vérité), synchronisé vers `Organization` |

AdminBTP ne doit jamais dupliquer la logique comptable d'Odoo ; il consomme/pousse des données de
synthèse (ex: montant d'une situation de travaux validée → écriture dans Odoo), sans réimplémenter
la facturation.

## Démo vs réel

`DemoOdooAdapter` ne doit jamais effectuer d'appel réseau réel — toute méthode retourne des
données simulées avec un log `[DEMO]`. Avant de brancher une instance Odoo réelle, vérifier :
1. Les identifiants/URL sont dans la configuration d'environnement, jamais en dur dans le code.
2. Chaque appel Odoo réel est entouré d'une gestion d'erreur qui dégrade gracieusement
   (l'absence de réponse Odoo ne doit jamais faire échouer une action utilisateur côté
   AdminBTP — logguer l'échec et continuer).
3. Toute écriture vers Odoo déclenchée par AdminBTP doit être tracée dans `AuditLogEntry`
   (`actorType: "AUTOMATION"`).

Voir `docs/INTEGRATIONS_STATUS.md` pour le statut actuel de la connexion Odoo (non connectée en
Phase 1).
