# Phase 26 - Maintenance securite Next.js

## Objectif

Actualiser le socle Next.js et ses dependances transitives apres l'audit local,
sans changement de majeure ni correction forcee, puis verifier l'absence de
regression fonctionnelle.

## Livrables

- `next` mis a niveau de `16.2.6` vers `16.3.0`
- `eslint-config-next` aligne sur `16.3.0`
- dependances transitives actualisees par `npm audit fix`, sans `--force`
- fichier de verrouillage npm actualise
- documentation de securite remise en coherence avec l'audit courant

## Decision de mise a niveau

La ligne `16.x` est la ligne Active LTS de Next.js. Le correctif `16.2.11`
recommande par la publication de securite de juillet 2026 a d'abord ete teste.
L'audit npm signalait encore des dependances embarquees vulnerables. La version
stable `16.3.0`, publiee dans la meme majeure, puis l'actualisation non forcee
des transitives ont ramene l'audit a zero.

Aucun codemod de migration majeure n'etait requis pour ce passage de version.

## Validation locale du 2026-08-12

- `npm audit --omit=dev` : `0` vulnerabilite detectee
- `npm run verify` : passe
- lint : passe
- typecheck : passe
- garde-fous serveur : `26` tests passes
- suite complete : `53` fichiers, `249` tests passes
- build : Next.js `16.3.0`, `26` pages generees
- smoke production local : routes publiques, `/admin` et `/admin/archives` passees

## Limites explicites

- aucun deploiement Vercel n'a ete lance
- aucun secret Vercel, Supabase ou LWS n'a ete modifie
- aucun test de restauration distante n'a ete effectue
- l'audit npm ne remplace pas une revue de securite independante
