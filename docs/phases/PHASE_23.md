# Phase 23 — Acces test interface

## Objectif

Permettre un test rapide de l'interface AdminBTP sans compte Supabase reel, tout en gardant un perimetre strictement `lecture seule`.

## Livrables

- cookie de session de test `adminbtp_test_access`
- routes `/auth/test-access` et `/auth/test-access/logout`
- bypass controle du login pour les routes protegees sans ouvrir les ecritures sensibles
- affichage explicite du statut `Acces test lecture seule`
- activation pilotable par `NEXT_PUBLIC_ENABLE_TEST_ACCESS`

## Fichiers principaux

- `apps/web/src/modules/auth/services/test-access.ts`
- `apps/web/src/app/auth/test-access/route.ts`
- `apps/web/src/app/auth/test-access/logout/route.ts`
- `apps/web/src/lib/supabase/proxy.ts`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/components/layout/app-shell.tsx`
- `apps/web/src/modules/auth/tests/test-access.test.ts`
- `apps/web/src/app/auth/test-access/route.test.ts`
- `.env.example`

## Resultat

- un testeur peut entrer dans l'application sans creer de compte
- le mode test est explicite dans l'interface
- le mode test reste borne a une navigation `lecture seule`
- l'acces peut etre coupe simplement par variable d'environnement

## Validation

- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/modules/auth/tests/test-access.test.ts src/app/auth/test-access/route.test.ts src/modules/auth/tests/session-navigation.test.ts`
- `npm run verify`
- `npm run verify:prod`
