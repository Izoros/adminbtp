# Supabase local

## Objectif

Ce document decrit le flux local recommande pour travailler avec Supabase
dans le depot AdminBTP.

## Structure mise en place

- configuration locale : [supabase/config.toml](/Users/symba/Documents/9_AdminBTP/supabase/config.toml:1)
- migrations : [supabase/migrations](/Users/symba/Documents/9_AdminBTP/supabase/migrations)
- manifest des migrations : [supabase/MIGRATIONS.md](/Users/symba/Documents/9_AdminBTP/supabase/MIGRATIONS.md:1)
- seed neutre : [supabase/seed.sql](/Users/symba/Documents/9_AdminBTP/supabase/seed.sql:1)

## Commandes utiles

```bash
npm run supabase:check
npm run supabase:bootstrap
npm run supabase:start
npm run supabase:reset
npm run supabase:lint
npm run supabase:types
```

## Workflow recommande

1. demarrer la stack locale Supabase
2. verifier les prerequis avec `npm run supabase:check`
3. appliquer les migrations avec `npm run supabase:reset`
4. developper la fonctionnalite
5. regenerer les types avec `npm run supabase:types`
6. verifier l'application avec `npm run verify`

Alternative pratique :

- `npm run supabase:bootstrap` pour enchainer preflight, demarrage, reset et generation des types

## Limites connues dans cet environnement

- `npm run supabase:start` requiert un daemon Docker actif
- `npx supabase migration list` sans `--local` ni projet lie requiert un projet distant relie

## Historique des migrations

L'historique couvre :

- auth et multi-tenant
- chantiers
- phases chantier
- documents
- signatures et audit
- emails
- tresorerie
- Odoo
- consulting
- IA metier
- espace client
- durcissement securite

## Notes de securite

- les tables en schema `public` sont protegees par RLS
- la vue `consulting_mission_capacity` est definie avec `security_invoker = true`
- les modules `ai` et `client-space` ont ete completes avec contraintes et politiques RLS

## Etat courant valide

- stack Supabase locale demarree
- migrations appliquees avec succes via `npm run supabase:reset`
- types re-generes dans [apps/web/src/types/supabase.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/types/supabase.ts:1)
- `.env.local` aligne sur les endpoints et cles locales Supabase
