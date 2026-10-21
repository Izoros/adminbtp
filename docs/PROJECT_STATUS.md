# Statut du projet AdminBTP

**Phase actuelle : Phase 2 — persistance réelle + sélecteur d'organisation terminés (2026-10-21).**
Phase 1 validée. Voir `docs/ROADMAP.md` pour le détail des cases cochées/restantes.

## Ce qui fonctionne aujourd'hui

### Base de données et authentification (réelles)

Projet Supabase **"AdminBTP"** (ref `azphgxzapyuazxtqzvta`) connecté et opérationnel :
- Schéma complet (24 tables, RLS active partout) — voir `database/README.md`.
- Durci suite aux advisors de sécurité et de performance Supabase.
- Exigences SaaS multi-tenant actées et traduites au schéma — voir
  `docs/CDC/MULTI_TENANT_SAAS.md` (`role_scope`, `organization_domains`, `plan_features`,
  `organization_integrations`, `signature_profiles`, révocation tracée, collaboration
  inter-entreprises sur chantier partagé).
- Authentification réelle : inscription, connexion, déconnexion, session via middleware, routes
  `(app)/*` protégées.

### Application Next.js — données et actions réelles (2026-10-21)

```bash
pnpm --filter @adminbtp/web dev
```
Les 13 écrans lisent désormais Supabase via `apps/web/src/lib/data/*` — `mock-data` a été
supprimé. Un jeu de données de démonstration réel est semé
(`database/seeds/0002_demo_dataset.sql`), équivalent aux anciennes fixtures : 3 organisations,
2 collaborateurs plateforme (Amina Chanfi, Julien Perrot), 5 chantiers, 5 phases, 6 documents,
5 mails, 5 tâches, 4 situations, 4 validations.

Les deux actions explicitement visées par la Phase 2 écrivent réellement en base :
- **Validations** (`/validations`) — Approuver/Refuser met à jour `validation_records` via
  `apps/web/src/lib/actions/validations.ts` (Server Action).
- **Paramètres** (`/parametres`) — Enregistrer le profil d'organisation met à jour `organizations`
  via `apps/web/src/lib/actions/organizations.ts` (Server Action).

**Sélecteur d'organisation** : un `OrgSwitcher` dans la barre supérieure (icône seule sur mobile)
liste les organisations accessibles à l'utilisateur et persiste le choix dans un cookie. Utilisé
par `/parametres`, qui montrait auparavant la première organisation triée par nom. Les autres
écrans restent des vues consolidées multi-organisations (comportement attendu pour un
collaborateur qui supervise plusieurs sociétés).

Se connecter avec le compte de démonstration documenté dans `apps/web/.env.local` (non committé).

Vérifié à cette étape : `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` tous verts ;
parcours complet en navigateur de tous les écrans avec données réelles, et test effectif des deux
actions d'écriture (persistance confirmée en base, valeurs de test nettoyées après vérification).

## Bug trouvé et corrigé en cours de route

Une fonction RLS (`can_access_site()`, posée pour la collaboration inter-entreprises) provoquait
une récursion via les policies des tables qu'elle interrogeait, bloquant toute requête liée à un
chantier pendant ~47s avant timeout. Corrigé en passant les fonctions utilitaires RLS en
`SECURITY DEFINER` — voir `docs/DECISIONS.md` pour l'analyse complète.

## Ce qui n'est pas branché

- Les autres actions (hors Validations/Paramètres) restent en lecture seule côté UI — pas de
  formulaire de création de chantier/organisation/document, par exemple.
- Odoo, email, WhatsApp, IA, n8n : toujours en implémentation `Demo*`, aucun I/O réseau réel.
- MFA, onboarding self-service, feature-gating par `plan_features` : non implémentés (schéma
  prêt, voir `docs/ROADMAP.md` Phase 8).
- "Leaked password protection" Supabase Auth : désactivé, à activer manuellement (dashboard).

## Structure du dépôt

Voir `docs/ARCHITECTURE.md`. Ajouts notables de cette phase : `apps/web/src/lib/data/` (requêtes
Supabase typées, mappées vers les schémas Zod existants, dont `organization-context.ts` pour le
sélecteur), `apps/web/src/lib/actions/` (Server Actions),
`apps/web/src/components/layout/org-switcher.tsx`, `database/migrations/0005` à `0009`,
`database/seeds/0002_demo_dataset.sql`, `docs/CDC/MULTI_TENANT_SAAS.md`.

## Décisions notables de cette phase

Voir `docs/DECISIONS.md` — notamment : suppression d'un schéma Supabase hérité, exigences SaaS
multi-tenant actées (jamais un outil MAWU), bug de récursion RLS et sa correction.

## Prochaine étape

Non démarré sans confirmation explicite de l'utilisateur. Candidats naturels : Phase 3
(génération de documents réelle), ou des formulaires de création pour les entités encore en
lecture seule (chantier, organisation, document).
