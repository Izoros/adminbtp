# Passerelle de commandes WhatsApp

## Objectif

Permettre a un expediteur explicitement autorise d'envoyer des demandes texte a
AdminBTP via WhatsApp Business, sans donner a WhatsApp un acces direct au code,
au shell, a Codex ou aux donnees metier.

Le webhook suit le contrat de la plateforme WhatsApp Cloud API de Meta :
[Webhooks WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks).

## Etat livre

- challenge `GET` controle par token de verification
- signature `X-Hub-Signature-256` verifiee sur le corps brut par HMAC SHA-256
- taille maximale de payload : 256 Kio
- messages texte uniquement
- liste blanche de numeros E.164
- identifiant de message Meta unique pour l'idempotence
- numero brut jamais enregistre : seule une empreinte HMAC SHA-256 est persistee
- file `whatsapp_command_requests` reservee au `service_role`
- consultation reservee aux administrateurs plateforme sur `/admin/commands`
- retention par defaut de 90 jours
- purge quotidienne a echeance, avec suppression en cascade du journal de revue

## Limite de securite volontaire

Une demande recue reste au statut `pending_review` jusqu'a sa revue dans
`/admin/commands`. L'approbation ou le refus est atomique, reserve au role
plateforme et journalise dans `whatsapp_command_events`. Meme approuvee, elle ne
lance jamais :

- une commande systeme
- une modification de base
- un deploiement
- une action Codex
- un appel OpenAI

Le transport, la file de confiance et la revue humaine sont donc disponibles.
Un futur moteur de traitement devra encore conserver une liste d'actions
autorisees, une confirmation specifique pour toute mutation et un journal
d'execution distinct.

## Variables serveur

```bash
ADMINBTP_WHATSAPP_COMMANDS_ENABLED=false
ADMINBTP_WHATSAPP_WEBHOOK_VERIFY_TOKEN=
ADMINBTP_WHATSAPP_APP_SECRET=
ADMINBTP_WHATSAPP_ALLOWED_SENDERS=+262690000000
```

Regles :

- conserver `ADMINBTP_WHATSAPP_COMMANDS_ENABLED=false` tant que la migration et
  les secrets ne sont pas verifies sur l'environnement cible
- generer un token de verification long et aleatoire
- utiliser le secret de l'application Meta pour `ADMINBTP_WHATSAPP_APP_SECRET`
- separer plusieurs expediteurs autorises par des virgules
- ne jamais prefixer ces variables par `NEXT_PUBLIC_`

## Activation controlee

1. appliquer `20260812100000_whatsapp_command_requests.sql`, puis `20260812160000_whatsapp_command_reviews.sql`
2. renseigner les trois secrets serveur et la liste blanche dans Vercel
3. conserver la passerelle desactivee
4. declarer `https://adminbtp.vercel.app/api/webhooks/whatsapp` comme callback Meta
5. verifier le challenge Meta
6. passer `ADMINBTP_WHATSAPP_COMMANDS_ENABLED=true`
7. envoyer un message depuis un seul numero de test autorise
8. verifier son apparition dans `/admin/commands`
9. approuver puis refuser deux demandes de test et verifier le journal SQL
10. controler qu'un numero non autorise et un doublon ne creent aucune nouvelle demande

## Desactivation d'urgence

Passer `ADMINBTP_WHATSAPP_COMMANDS_ENABLED=false` et redeployer. Les requetes
signees sont alors acquittees sans etre persistees. En cas de suspicion sur le
secret Meta, le faire tourner dans Meta puis dans Vercel avant toute reactivation.
