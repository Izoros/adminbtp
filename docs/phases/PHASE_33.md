# Phase 33 - Audit des parcours et didacticiel permanent

## Objectif

Rendre la prise en main autonome et transformer le controle des liens en garde-fou
reproductible avant chaque livraison.

## Livrables

- page `/guide` en 8 etapes ;
- progression locale par utilisateur ou visiteur, sans donnee metier ;
- acces permanent dans la navigation et l'en-tete ;
- lien vers le guide complet depuis le panneau de premiere connexion ;
- audit automatique des pages, liens sources et liens rendus ;
- extension du smoke a `/emails`, `/phases`, `/guide` et `/odoo` ;
- revue fonctionnelle avec checklist utilisateur.

## Validation du 2026-08-12

- `20` pages et `21` cibles internes controlees ;
- `6` redirections de session reconnues comme attendues ;
- navigation Accueil vers Didacticiel testee dans le navigateur ;
- contenu, progression et absence d'erreur applicative verifies visuellement ;
- tests de non-regression du guide et du panneau de premiere connexion passes.
- `npm run verify` : `70` fichiers et `307` tests passes ;
- smoke du build local : `20` pages critiques et deux crons proteges verifies.
- `npm run verify:prod` : pages, liens, redirections, sante et en-tetes de securite passes sur `adminbtp.vercel.app`.

## Limites

- la progression reste locale au navigateur et n'est pas synchronisee entre appareils ;
- les operations metier du didacticiel restent soumises aux roles et a Supabase ;
- la recette utilisateur reelle reste a effectuer avec des comptes representatifs.
