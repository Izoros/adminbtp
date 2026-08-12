# Prochaines actions recommandees

## Priorite immediate

1. appliquer la migration `archive_runs` sur les environnements cibles avant de deployer la phase 24
2. executer un test controle de transfert et de relecture sur la cible LWS
3. relier la supervision locale a un canal d'alerte externe pour les executions `failed` ou bloquees
4. ajouter la sauvegarde des pieces binaires Supabase Storage et un exercice de restauration
5. cadrer puis ouvrir la prochaine phase produit avec des criteres d'acceptation explicites

## Priorite equipe

1. ouvrir les tickets GitHub par module
2. creer les branches `feature/...` correspondantes
3. affecter les modules aux developpeurs ou agents IA
4. imposer `npm run verify` avant chaque merge
5. imposer `npm run verify:prod` avant tout changement de configuration Vercel

## Priorite production

1. verifier les secrets d'archivage LWS et Supabase dans Vercel sans les exposer
2. controler la prochaine execution du cron d'archivage et effectuer un test de restauration
3. brancher les alertes sur `/api/health`, les webhooks critiques, les echecs d'auth et d'archivage
4. definir la retention des logs et les sauvegardes des objets binaires Supabase Storage
5. executer et tracer periodiquement `npm run verify:prod` et `npm run audit:prod`
