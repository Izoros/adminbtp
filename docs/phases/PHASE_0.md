# Phase 0 - Socle projet

## Perimetre livre

- monorepo `npm workspaces`
- application `Next.js` dans `apps/web`
- `Tailwind CSS`
- `shadcn/ui`
- client `Supabase`
- `.env.example`
- structure modulaire initiale dans `apps/web/src`
- navigation principale AdminBTP
- tests minimum de rendu et de configuration

## Validation attendue

- l'application demarre localement
- le design system de base est disponible
- la navigation principale est visible

## Verifications a executer

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Controle securite minimum

- aucune cle sensible commitee
- variables d'environnement documentees dans `.env.example`
- client Supabase encapsule derriere une fonction unique
- aucune action critique cote client sans garde-fou
- dependances auditees avant passage a la phase suivante

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- verification navigateur locale : OK
- `npm audit --omit=dev` : 2 vulnerabilites moderes detectees dans la chaine `next -> postcss`, sans correctif non cassant propose localement
