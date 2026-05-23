# Prochaines actions recommandees

## Priorite immediate

1. propager la session Supabase reelle dans les modules qui reposent encore sur un fallback demo
2. etendre les garde-fous d'ecriture server-side aux modules restants
3. lier un projet Supabase distant puis pousser les migrations
4. injecter les vraies variables de production Vercel et Supabase
5. completer l'observabilite avec logs centralises, alerting et traces metier

## Priorite equipe

1. ouvrir les tickets GitHub par module
2. creer les branches `feature/...` correspondantes
3. affecter les modules aux developpeurs ou agents IA
4. imposer `npm run verify` avant chaque merge
5. imposer `npm run verify:prod` avant tout changement de configuration Vercel

## Priorite production

1. configurer Supabase preprod
2. configurer Supabase production
3. activer la CI GitHub sur le depot distant
4. definir les sauvegardes, le monitoring et la retention de logs
5. brancher les alertes sur `/api/health`, les webhooks critiques et les echecs d'auth
