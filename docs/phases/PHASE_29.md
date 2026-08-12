# Phase 29 - Revue humaine des commandes WhatsApp

## Objectif

Permettre a un administrateur plateforme d'approuver ou de refuser une demande
WhatsApp en conservant une decision atomique et auditable, sans executer le
contenu de la demande.

## Livrables

- table immuable `whatsapp_command_events`
- fonction SQL `review_whatsapp_command`
- controle `auth.uid()` et `is_platform_admin()` dans la fonction
- Server Action avec nouvelle verification de session et de role
- boutons « Approuver la demande » et « Refuser » sur `/admin/commands`
- idempotence d'une decision deja appliquee
- journal de l'acteur et de la transition de statut

## Decisions

- seules les decisions `approve` et `reject` sont acceptees
- seule une demande `pending_review` peut changer de statut
- une approbation passe la demande a `approved`, sans `processing` ni execution
- un refus passe la demande a `rejected` sans supprimer son journal
- l'autorisation est controlee dans l'action et a nouveau dans PostgreSQL
- la logique de revue n'utilise jamais le client `service_role`

## Validation locale du 2026-08-12

- tests actions et interface cibles : `2` fichiers, `5` tests passes
- lint cible : passe
- typecheck cible : passe
- revue React : action authentifiee, donnees client minimales, aucun effet ou chargement client inutile
- `npm run verify` : passe
- garde-fous serveur : `26` tests passes
- suite complete : `64` fichiers, `287` tests passes
- build : Next.js `16.3.0`, `30` pages generees
- smoke production local : parcours critiques et refus des crons passes
- `npm audit --omit=dev` : `0` vulnerabilite detectee

## Limites explicites

- aucune commande approuvee n'est executee
- aucun repondeur WhatsApp sortant n'est branche
- la migration n'est pas appliquee sur le Supabase distant actuel
- l'activation de Meta et de Supabase reste un travail d'environnement separe
