# Supabase distant

## Objectif

Ce document decrit comment relier le depot AdminBTP a un projet Supabase
distant pour deployer les migrations versionnees.

## Prerequis

- Supabase CLI installe dans le projet
- compte Supabase accessible
- projet distant cree
- Docker actif si vous voulez tester localement avant push

## Etapes recommandees

1. se connecter au CLI :

```bash
npx supabase login
```

2. lier le projet distant :

```bash
npx supabase link --project-ref <project-ref>
```

3. verifier l'historique :

```bash
npx supabase migration list
```

4. pousser les migrations :

```bash
npx supabase db push
```

5. regenerer les types si besoin :

```bash
npm run supabase:types
```

## Verification apres liaison

- `npx supabase migration list` doit repondre sans erreur
- `npx supabase db push --dry-run` doit presenter les changements attendus
- les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` doivent correspondre au projet cible

## Vigilance

- ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans le frontend
- ne pas pousser sans revue des migrations
- documenter tout ecart entre la base distante et `supabase/migrations`
