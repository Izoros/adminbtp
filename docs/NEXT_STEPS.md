# Prochaines actions recommandees

## Priorite immediate

1. appliquer les migrations `archive_runs`, `whatsapp_command_requests` et `operations_alerts` sur une preproduction Supabase controlee
2. executer un test controle de transfert et de relecture sur la cible LWS
3. configurer un compte WhatsApp Business de test selon `WHATSAPP_COMMAND_GATEWAY.md`, sans activer l'execution automatique
4. connecter l'outbox d'alertes a un webhook HTTPS controle et verifier une livraison de test
5. ajouter la sauvegarde des pieces binaires Supabase Storage et un exercice de restauration

## Priorite equipe

1. ouvrir les tickets GitHub par module
2. creer les branches `feature/...` correspondantes
3. affecter les modules aux developpeurs ou agents IA
4. imposer `npm run verify` avant chaque merge
5. imposer `npm run verify:prod` avant tout changement de configuration Vercel

## Priorite production

1. verifier les secrets d'archivage LWS et Supabase dans Vercel sans les exposer
2. garder la passerelle WhatsApp desactivee tant que la migration, Meta et la liste blanche ne sont pas valides
3. controler la prochaine execution du cron d'archivage et effectuer un test de restauration
4. brancher les alertes sur `/api/health`, les webhooks critiques, les echecs d'auth et d'archivage
5. executer et tracer periodiquement `npm run verify:prod` et `npm run audit:prod`
