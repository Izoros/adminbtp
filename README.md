# AdminBTP

Depot monorepo de cadrage et de developpement initial pour la plateforme AdminBTP.

## Contenu

- [Depot GitHub](/Users/symba/Documents/9_AdminBTP/README.md:1) : [Izoros/adminbtp](https://github.com/Izoros/adminbtp)
- [Socle architecture produit](/Users/symba/Documents/9_AdminBTP/docs/adminbtp-platform-architecture.md)
- [Plan de deploiement V1/V2](/Users/symba/Documents/9_AdminBTP/docs/adminbtp-v1-v2-rollout.md)
- [Roadmap de developpement](/Users/symba/Documents/9_AdminBTP/docs/ROADMAP.md)
- [Checklist de validation](/Users/symba/Documents/9_AdminBTP/docs/VALIDATION_CHECKLIST.md)
- [Regles de contribution](/Users/symba/Documents/9_AdminBTP/docs/CONTRIBUTING.md)
- [Runbook de deploiement](/Users/symba/Documents/9_AdminBTP/docs/DEPLOYMENT.md)
- [Checklist de release](/Users/symba/Documents/9_AdminBTP/docs/RELEASE_CHECKLIST.md)
- [Politique de securite](/Users/symba/Documents/9_AdminBTP/docs/SECURITY.md)
- [Runbook archivage 25 ans](/Users/symba/Documents/9_AdminBTP/docs/ARCHIVAL_25Y.md)
- [Prochaines actions recommandees](/Users/symba/Documents/9_AdminBTP/docs/NEXT_STEPS.md)
- [Guide Supabase local](/Users/symba/Documents/9_AdminBTP/docs/SUPABASE_LOCAL.md)
- [Guide Supabase distant](/Users/symba/Documents/9_AdminBTP/docs/SUPABASE_REMOTE.md)
- [Plan de workstreams paralleles](/Users/symba/Documents/9_AdminBTP/docs/PARALLEL_WORKSTREAMS.md)
- [CDC minimal V1](/Users/symba/Documents/9_AdminBTP/docs/CDC/AdminBTP_V1.md)
- [Schema SQL du pole expertise](/Users/symba/Documents/9_AdminBTP/database/adminbtp_consulting_foundation.sql)
- [Seed SQL des profils experts](/Users/symba/Documents/9_AdminBTP/database/adminbtp_consulting_seed.sql)
- [Validation d'execution de la phase 0](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_0.md)
- [Validation d'execution de la phase 1](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_1.md)
- [Validation d'execution de la phase 2](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_2.md)
- [Validation d'execution de la phase 3](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_3.md)
- [Validation d'execution de la phase 4](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_4.md)
- [Validation d'execution de la phase 5](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_5.md)
- [Validation d'execution de la phase 6](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_6.md)
- [Validation d'execution de la phase 7](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_7.md)
- [Validation d'execution de la phase 8](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_8.md)
- [Validation d'execution de la phase 9](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_9.md)
- [Validation d'execution de la phase 10](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_10.md)
- [Validation d'execution de la phase 11](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_11.md)
- [Validation d'execution de la phase 12](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_12.md)
- [Validation d'execution de la phase 13](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_13.md)
- [Validation d'execution de la phase 14](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_14.md)
- [Validation d'execution de la phase 15](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_15.md)
- [Validation d'execution de la phase 16](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_16.md)
- [Validation d'execution de la phase 17](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_17.md)
- [Validation d'execution de la phase 18](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_18.md)
- [Validation d'execution de la phase 19](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_19.md)
- [Validation d'execution de la phase 20](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_20.md)
- [Validation d'execution de la phase 21](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_21.md)
- [Validation d'execution de la phase 22](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_22.md)
- [Validation d'execution de la phase 23](/Users/symba/Documents/9_AdminBTP/docs/phases/PHASE_23.md)

## Finalite

Concevoir AdminBTP comme une plateforme de gestion administrative BTP et d'accompagnement technique, capable d'integrer:

- logiciel SaaS
- automatisation IA
- gestionnaires administratifs externalises
- expertise humaine internalisee

## Prochaine etape logique

La stack cible retenue pour le lancement du projet est:

- monorepo `npm workspaces`
- application `Next.js` dans `apps/web`
- `Tailwind CSS`
- `shadcn/ui`
- client `Supabase`

## Demarrage local

```bash
npm install
npm run dev
```

Application web :

- `http://localhost:3000`

## Mise en ligne

Deploiement Vercel realise et verifie le `2026-05-26` :

- URL de production principale : [adminbtp.vercel.app](https://adminbtp.vercel.app)
- URL de deploiement validee : [adminbtp-ovohepeob-izoros-projects.vercel.app](https://adminbtp-ovohepeob-izoros-projects.vercel.app)

Note d'exploitation :

- l'application est publiquement accessible en `200`
- la route de sante [adminbtp.vercel.app/api/health](https://adminbtp.vercel.app/api/health) repond `200`
- le projet Vercel est configure en monorepo avec `rootDirectory = apps/web`
- les deploiements de production doivent etre lances depuis la racine du depot
- le depot GitHub source est [Izoros/adminbtp](https://github.com/Izoros/adminbtp)

## Scripts utiles

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run verify:guards
npm run build
npm run verify
npm run verify:prod
npm run audit:prod
npm run supabase:check
npm run supabase:bootstrap
npm run supabase:start
npm run supabase:reset
npm run supabase:types
```

## Etat actuel du socle

Le depot est maintenant aligne sur un fonctionnement production :

- authentification reelle Supabase par mot de passe ou lien magique, avec cookies SSR
- ecritures sensibles `organizations` et `projects` proteges par session + fonctions SQL dediees
- garde-fous de scope serveur verifies sur `documents`, `signatures`, `consulting` et `client-space`
- RLS consolidee sur les zones `ai` et `client-space`
- endpoint `/api/health`, verification locale ciblee `npm run verify:guards` et verification distante `npm run verify:prod`
- modules serveurs branches sur des etats Supabase reels ou des etats vides honnetes, sans injection de donnees de demonstration au runtime

## Structure projet

```text
apps/
  web/
database/
docs/
packages/
```

## Orientation produit

Brancher ce socle sur la stack applicative cible et derouler ensuite la roadmap par phases:

- Supabase
- multi-tenant
- gestion chantiers
- base documentaire
- signatures
- workflows n8n
- Odoo
- consulting expert
- IA metier
