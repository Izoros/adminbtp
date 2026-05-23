# Phase 16 - Auth reelle, garde-fous core et observabilite initiale

## Perimetre livre

- flux de connexion reelle Supabase par OTP email depuis la page `login`
- callback `/auth/callback` pour l'echange `code -> session`
- proxy SSR pour maintenir les cookies de session Supabase
- verifications d'authentification cote serveur avant creation d'organisation ou de chantier
- fonctions SQL atomiques `create_organization_with_owner` et `create_project_with_owner_role`
- durcissement RLS sur `ai_suggestions`, `ai_suggestion_audit_logs`, `client_portal_accesses` et `client_feedback_threads`
- garde-fous d'entree pour les webhooks `n8n` avec validation JSON et token partage optionnel
- observabilite initiale via `/api/health`, tests dedies et verification distante `npm run verify:prod`

## Validation cible

- la connexion reelle ne depend plus uniquement d'un mode demonstration
- les ecritures sensibles passent par un socle d'autorisation lisible et central
- les integrations entrantes les plus exposes disposent d'un contrat minimum defensif
- la production publie un etat de sante exploitable et des controles HTTP verifiables

## Verification locale

Le depot montre un socle plus mature sur trois axes :

- auth reelle : [apps/web/src/modules/auth/components/login-form.tsx](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/auth/components/login-form.tsx:1), [apps/web/src/app/auth/callback/route.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/auth/callback/route.ts:1) et [apps/web/proxy.ts](/Users/symba/Documents/9_AdminBTP/apps/web/proxy.ts:1) branchent un flux Supabase SSR complet, tout en conservant un message explicite quand la configuration manque
- garde-fous core : [apps/web/src/app/organizations/actions.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/organizations/actions.ts:1) et [apps/web/src/app/projects/actions.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/projects/actions.ts:1) refusent les creations sans session, puis deleguent l'ecriture a des fonctions SQL securisees definies dans [supabase/migrations/20260522101500_organizations_projects_write.sql](/Users/symba/Documents/9_AdminBTP/supabase/migrations/20260522101500_organizations_projects_write.sql:1)
- observabilite initiale : [apps/web/src/app/api/health/route.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/api/health/route.ts:1), [apps/web/src/app/api/health/route.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/api/health/route.test.ts:1) et [scripts/verify-production.sh](/Users/symba/Documents/9_AdminBTP/scripts/verify-production.sh:1) exposent puis verifient un signal de sante simple avec controle des en-tetes de securite

## Points de securite

- l'autorisation ne repose pas sur des donnees clientes, mais sur `auth.uid()`, les memberships et les politiques RLS
- `public.is_org_manager` reste le predicate central pour les droits de gestion d'organisation
- les creations critiques utilisent des fonctions `SECURITY DEFINER` courtes et bornees au strict necessaire
- les routes `n8n` rejettent les payloads non JSON et peuvent imposer `ADMINBTP_N8N_WEBHOOK_TOKEN`
- les modules `ai` et `client-space` disposent maintenant de contraintes de liaison explicites et de politiques RLS dediees via [supabase/migrations/20260521190842_security_hardening.sql](/Users/symba/Documents/9_AdminBTP/supabase/migrations/20260521190842_security_hardening.sql:1)

## Limites connues

- plusieurs vues applicatives conservent encore un fallback demo quand Supabase ou la session ne sont pas disponibles
- l'observabilite reste basique : pas encore de logs centralises, d'alerting ni de traces fonctionnelles bout en bout
- les webhooks `n8n` n'imposent un secret que si `ADMINBTP_N8N_WEBHOOK_TOKEN` est renseigne

## Resultat d'execution

- `npm run verify` : OK
- `npm run verify:prod` : OK
- tests auth/permissions/webhooks/health presents dans le depot
- deploiement public verifie le `2026-05-22`
