# Phase 15 - CRUD Supabase reel et consolidation parallele

## Perimetre livre

- actions serveur reelles pour `organizations` et `projects`
- actions serveur reelles pour `documents` et `signatures`
- lectures Supabase reelles et webhooks durcis pour `emails`, `followups` et `n8n`
- lectures/ecritures minimales reelles pour `consulting`, `ai` et `client-space`
- verification de production automatisee via `npm run verify:prod`
- orchestration de plusieurs agents sur des lots disjoints

## Validation cible

- les modules prioritaires ne dependent plus uniquement de donnees de demonstration
- le fallback demo reste disponible quand Supabase ou la session utilisateur ne sont pas exploitables
- le tronc principal reste validable de bout en bout apres consolidation

## Validation locale

- `npm run verify` : OK
- `npm run verify:prod` : OK
- `npm run audit:prod` : 2 vulnerabilites moderees transitives `next -> postcss`, sans correctif non cassant applique

## Resultat d'execution

- `28` fichiers de test passes
- `119` tests passes
- build `Next.js` de production OK
- verification distante de `/` en `200`
- verification distante de `/api/health` en `200`
- verification des en-tetes `CSP`, `HSTS`, `nosniff`, `DENY` et `permissions-policy` OK
