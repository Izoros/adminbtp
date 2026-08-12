# Phase 27 - Passerelle WhatsApp securisee

## Objectif

Preparer un canal WhatsApp Business permettant d'envoyer des demandes a
AdminBTP depuis une liste blanche, sans execution automatique et sans exposer
le numero de l'expediteur dans la base ou l'interface.

## Livrables

- route publique `/api/webhooks/whatsapp`
- challenge Meta protege par token
- verification HMAC SHA-256 du corps brut
- limite de payload et messages texte uniquement
- liste blanche E.164
- table `whatsapp_command_requests` avec idempotence et retention 90 jours
- lecteur `service_role` apres verification `is_platform_admin`
- page de supervision `/admin/commands`
- runbook `docs/WHATSAPP_COMMAND_GATEWAY.md`
- controles smoke local et production

## Decisions

- la passerelle est desactivee par defaut
- aucune cle OpenAI n'est requise ni utilisee dans ce lot
- aucune demande ne peut executer du code, un shell, un deploiement ou une mutation
- toutes les demandes autorisees entrent en `pending_review`
- le numero est compare a la liste blanche en memoire puis remplace par une empreinte HMAC
- une indisponibilite Supabase retourne `503` afin que Meta puisse retenter
- un identifiant Meta deja traite est accepte comme doublon idempotent

## Validation locale du 2026-08-12

- tests WhatsApp et pages admin cibles : `6` fichiers, `20` tests passes
- typecheck cible : passe
- `npm run verify` : passe
- lint : passe
- typecheck : passe
- garde-fous serveur : `26` tests passes
- suite complete : `58` fichiers, `268` tests passes
- build : Next.js `16.3.0`, `28` pages generees
- smoke production local : tous les parcours critiques, dont `/admin/commands`, passent
- webhook local sans configuration : `503`, aucun traitement ouvert par defaut

## Limites explicites

- la migration n'est pas appliquee sur un Supabase distant dans ce lot
- aucun compte WhatsApp Business ni secret Meta n'est configure
- aucune reponse WhatsApp sortante n'est envoyee
- aucune demande n'est executee automatiquement
- la mise en production du code ne vaut pas activation de la passerelle
