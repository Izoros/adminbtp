# Phase 13 - Production

## Perimetre livre

- en-tetes de securite Next.js
- route `/api/health` pour monitoring
- workflow GitHub Actions de CI
- configuration `vercel.json`
- variables d'environnement de production documentees

## Validation cible

- deploiement fonctionnel
- donnees protegees
- rollback possible

## Validation locale

La route `/api/health` expose un etat simple pour le monitoring. Le projet
embarque une CI qui rejoue `lint`, `typecheck`, `test` et `build` avant
integration ou deploiement.

## Points de securite

- en-tetes HTTP durcis
- secrets de production externalises dans l'environnement
- monitoring prepare avec un endpoint dedie
- base prete pour une strategie de rollback via Git et Vercel

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du socle production : OK
- `npm audit --omit=dev` : 2 vulnerabilites moderees transitive `next -> postcss`, sans correctif non cassant propose
