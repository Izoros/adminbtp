# Statut du projet AdminBTP

**Phase actuelle : Phase 1 terminée (2026-10-21), en attente de validation utilisateur avant
Phase 2.** Voir `docs/VALIDATION_CHECKLIST.md` pour le détail coché, `docs/ROADMAP.md` pour la
suite.

## Ce qui fonctionne aujourd'hui

Application Next.js locale, mode démonstration complet (aucune donnée réelle, aucun service
externe connecté) :

```bash
pnpm --filter @adminbtp/web dev
```
puis ouvrir `http://localhost:3000` — formulaire de connexion (n'importe quel email/mot de passe
valide) → redirection `/dashboard` → navigation complète (10 entrées de menu, 13 écrans au total
avec les pages de détail).

Vérifié : `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` tous verts ; navigation
manuelle en navigateur desktop et mobile (375px) sans erreur console ni serveur.

## Ce qui n'est pas branché (volontairement, documenté dans `docs/INTEGRATIONS_STATUS.md`)

- Pas d'authentification réelle, pas de base de données connectée.
- Toutes les intégrations (Odoo, email, WhatsApp, IA, n8n) en implémentation `Demo*`.
- Les actions de l'UI qui semblent écrire des données (Approuver/Refuser une validation,
  Enregistrer un paramètre) n'ont aucun effet persistant — c'est indiqué dans l'UI elle-même.

## Structure du dépôt

Voir `docs/ARCHITECTURE.md` pour le détail complet. En résumé : monorepo pnpm avec `apps/web`
(Next.js) et 4 packages partagés (`types`, `ui`, `config`, `integrations`), un schéma SQL +
policies RLS écrits mais non appliqués (`database/`), 8 skills métier et 6 agents spécialisés
(`.claude/`), documentation (`docs/`).

## Décisions notables de cette phase

Voir `docs/DECISIONS.md` — notamment : séparation `packages/ui` (logique pure) vs composants
React (`apps/web`), désactivation de `cacheComponents` Next.js 16 (incompatible avec les hooks
client dynamiques du layout en l'état), correction d'un emplacement incohérent pour les labels de
statut de document.

## Prochaine étape

Phase 2 (authentification et persistance réelles) — **non démarrée**, attend confirmation
explicite de l'utilisateur après revue du bilan de Phase 1.
