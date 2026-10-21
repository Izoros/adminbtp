# Statut des intégrations et outils — AdminBTP

Dernière mise à jour : Phase 1 (2026-10-21).

## Services externes

| Service | Statut | Détail |
|---|---|---|
| Supabase (base de données) | **Connecté** (Phase 2, 2026-10-21) | Projet "AdminBTP" (ref `azphgxzapyuazxtqzvta`, eu-west-1, Postgres 17), via le connecteur MCP Supabase. Schéma + RLS + durcissement sécurité/performance appliqués (`database/migrations/0001` à `0004`). Les 13 écrans de `apps/web` lisent encore `mock-data` et pas cette base — conversion en cours, voir `docs/ROADMAP.md`. |
| Supabase Auth | **Connecté** (Phase 2, 2026-10-21) | Inscription/connexion/déconnexion réelles, session via middleware, routes `(app)` protégées. Point de vigilance restant : "Leaked password protection" désactivé — à activer manuellement dans le dashboard (Authentication → Policies → Password Security), pas accessible via SQL/MCP. MFA non branché côté UI. SMTP intégré Supabase limité à quelques emails de confirmation/heure en développement — prévoir un fournisseur SMTP custom avant d'ouvrir des inscriptions en volume. |
| Odoo | **Non connecté** | `DemoOdooAdapter` (`packages/integrations/src/odoo`) utilisé — aucun I/O réseau réel. Préférence documentée pour la JSON-2 API sur Odoo 19+ (voir skill `adminbtp-odoo`). |
| Fournisseur email | **Mode démo** | `DemoEmailProvider` — aucun envoi réel. |
| WhatsApp Business | **Mode démo** | `DemoWhatsAppProvider` — aucun envoi réel. Rappel : une preuve WhatsApp n'équivaut jamais à une signature électronique. |
| Fournisseur IA (génération de documents) | **Mode démo** | `DemoAIProvider` — aucun appel réel à un LLM. |
| n8n (automatisations) | **Non connecté** | `DemoN8nClient` — aucun webhook réel. Aucun workflow exporté dans `n8n/workflows/`. |
| Signature électronique (Yousign/DocuSign...) | **Non branché** | Prévu pour l'étape `SIGNATURE` du circuit de validation (`ValidationRecord.signatureProvider`), non implémenté en Phase 1. |

## Connecteurs MCP recherchés mais indisponibles dans cet environnement

Une recherche dans le registre MCP (`mcp-registry`) n'a retourné aucun connecteur pour :
Supabase, GitHub, n8n, Odoo, Figma, Vercel. Ces intégrations devront être configurées
manuellement (variables d'environnement + SDK/API directe derrière les adaptateurs
`packages/integrations`) plutôt que via un connecteur MCP, à ce stade.

## Outils CLI locaux

| Outil | Statut | Détail |
|---|---|---|
| Node.js | **Installé** | v24.22.0 via nvm (`nvm install --lts`), alias par défaut `lts/*`. |
| npm | **Installé** | 11.19.1 (fourni avec Node). |
| pnpm | **Installé** | 12.14.0 via corepack (`corepack prepare pnpm@latest --activate`). |
| Homebrew | **Non installé** | Non nécessaire — tout le toolchain a été mis en place via nvm/corepack, sur instruction explicite de l'utilisateur. |
| `gh` (GitHub CLI) | **Non installé** | À installer si un besoin d'automatisation PR/Issues apparaît. |
| `supabase` (CLI) | **Non installé** | Nécessaire pour appliquer `database/migrations/` et `database/policies/` à un vrai projet Supabase le moment venu. |
| `docker` | **Non installé** | Non requis pour l'application Phase 1 (pas de conteneurisation en place). |

## Pour connecter un service réel

1. Créer les identifiants/clés du service (jamais en dur dans le code — variables
   d'environnement).
2. Remplacer l'implémentation `Demo*` correspondante par une implémentation réelle de la même
   interface (`I*Adapter`/`I*Provider`), sans modifier le code appelant dans `apps/web`.
3. Mettre à jour ce fichier avec le nouveau statut et la date.
4. Pour Supabase spécifiquement : installer le CLI `supabase`, créer le projet, appliquer
   `database/migrations/0001_init_core_schema.sql` puis `database/policies/0001_rls_policies.sql`
   (voir `database/README.md`).
