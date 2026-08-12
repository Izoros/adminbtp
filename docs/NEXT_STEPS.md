# Prochaines actions recommandees

## Priorite immediate

La page `/admin/readiness` centralise maintenant ces prerequis sans afficher les
secrets. Un statut `Pret a tester` confirme la configuration, pas la connexion.

1. appliquer dans l'ordre les migrations `archive_runs`, `whatsapp_command_requests`, `operations_alerts`, `whatsapp_command_reviews`, `operations_retention`, `odoo_social_bindings` et `security_audit_hardening` sur une preproduction Supabase controlee
2. executer un test controle de transfert et de relecture sur la cible LWS
3. configurer un compte WhatsApp Business de test selon `WHATSAPP_COMMAND_GATEWAY.md`, sans activer l'execution automatique
4. connecter l'outbox d'alertes a un webhook HTTPS controle et verifier une livraison de test
5. definir le contrat des pieces jointes avant d'ajouter Supabase Storage et un exercice de restauration
6. inventorier les modules et champs de l'instance Odoo cible via `/doc`, puis executer un probe JSON-2 en lecture seule
7. rejouer les contrats RLS avec au moins trois comptes de trois organisations, verifier les reglages anti-abus/MFA du Supabase distant et faire realiser un test d'intrusion independant

Note d'audit : aucun bucket ou objet metier n'est encore utilise par le code
AdminBTP. Le lot Storage doit donc commencer par le modele de pieces jointes et
ses controles d'upload, avant la replication binaire.

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
6. laisser Odoo desactive en production jusqu'a validation des droits, de l'idempotence et du rapprochement en preproduction
