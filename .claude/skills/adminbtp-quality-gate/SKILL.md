---
name: adminbtp-quality-gate
description: Critères de validation à vérifier avant de considérer une phase du roadmap AdminBTP (Phase 0 à Phase 11) comme terminée — vérifications techniques, revue des règles métier non négociables, et format du bilan à présenter. Utiliser avant d'annoncer qu'une phase ou une fonctionnalité significative est terminée.
---

# Porte de qualité (quality gate) AdminBTP

## Avant d'annoncer une fonctionnalité ou une phase terminée

1. **Typecheck** (`pnpm typecheck`) sans erreur sur tout le monorepo (apps/web + packages/*).
2. **Lint** (`pnpm lint`) sans erreur.
3. **Build** (`pnpm build`) réussi — en particulier vérifier qu'aucune route ne casse le
   prerendering (ex: incompatibilité `cacheComponents`/hooks client dynamiques rencontrée en
   Phase 1 sur `/chantiers/[id]`).
4. **Tests** (`pnpm test`) : au minimum les utilitaires partagés (`cn`, logique de présentation
   de statut type `toneForSiteStatus`) et un composant UI de base doivent avoir des tests qui
   passent — ne jamais laisser `pnpm test` échouer faute de fichier de test.
5. **Vérification navigateur** : démarrer le serveur dev et naviguer manuellement (ou via l'outil
   navigateur) sur chaque écran prioritaire touché, en vérifiant l'absence d'erreur console et
   d'erreur serveur, en desktop **et** en largeur mobile (~375px).

## Règles métier non négociables à vérifier dans toute revue

Ces règles viennent du cahier des charges produit et ne doivent **jamais** être affaiblies, même
pour simplifier une fonctionnalité en mode démo :

- Un PPSPS généré par la plateforme naît toujours en statut `PREEDITION` (jamais `VALIDE`
  directement) — voir [[adminbtp-documents]].
- Une preuve WhatsApp (`whatsappProofUrl`) ne vaut jamais signature électronique
  (`isLegallyBindingSignature`) — voir [[adminbtp-project-workflows]].
- Toute donnée métier est isolée par `organization_id`, avec RLS actif sur chaque nouvelle table
  — voir [[adminbtp-multitenant-security]].
- Odoo (et plus largement toute intégration externe) ne doit jamais bloquer une fonctionnalité
  cœur si elle est indisponible — voir [[adminbtp-odoo]].
- Le mode démo ne fait jamais de vrai I/O réseau (email, WhatsApp, Odoo, IA, n8n) — tout
  adaptateur `Demo*` doit rester silencieux côté réseau et préfixer ses logs `[DEMO]`.

## Format du bilan de fin de phase

À chaque validation de phase présentée à l'utilisateur, inclure explicitement :
1. URL locale de l'application et commandes exactes de redémarrage.
2. Récapitulatif des fichiers/dossiers créés ou modifiés (par zone : apps/web, packages/*,
   database/, docs/, .claude/).
3. Résultat des vérifications (typecheck/lint/build/test) — pas seulement "ça marche", donner le
   résultat réel de chaque commande.
4. Liste des services externes qui restent à connecter (Supabase, Odoo, n8n, email, WhatsApp, IA)
   avec leur statut actuel — voir `docs/INTEGRATIONS_STATUS.md`.
5. Critères de validation de la phase explicitement listés, et **ne jamais démarrer la phase
   suivante sans confirmation explicite de l'utilisateur**, même si tout est techniquement vert.
