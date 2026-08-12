# Phase 23 - Guide de demarrage des utilisateurs connectes

## Objectif

Accelerer la prise en main d'AdminBTP avec un parcours d'accueil court pour les
utilisateurs connectes, sans ajouter d'etat serveur ni bloquer les modules.

## Livrables

- pop-in de bienvenue pour un utilisateur connecte
- trois etapes vers les organisations, les chantiers et les documents
- fermeture depuis le bouton principal, la croix ou un lien d'etape
- memorisation locale de la fermeture par identifiant utilisateur
- integration dans les deux cadres de page partages
- tests d'affichage et de persistance de la fermeture

## Fichiers principaux

- `apps/web/src/components/onboarding/new-user-guide.tsx`
- `apps/web/src/components/onboarding/new-user-guide.test.tsx`
- `apps/web/src/components/layout/app-shell.tsx`
- `apps/web/src/components/layout/module-page-frame.tsx`

## Resultat

- un utilisateur connecte sans fermeture enregistree voit le parcours de demarrage
- la fermeture est memorisee avec une cle propre a l'utilisateur dans `localStorage`
- le guide ne reapparait pas pour ce compte sur le meme navigateur apres fermeture
- aucun contenu d'accueil n'est rendu pour une session absente

## Limites explicites

- la fermeture n'est pas synchronisee entre plusieurs navigateurs ou appareils
- vider le stockage local fait reapparaitre le guide
- le guide oriente l'utilisateur mais ne remplace pas une progression d'onboarding
  persistee en base

## Validation

- `npm run lint --workspace web`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- src/components/onboarding/new-user-guide.test.tsx`
- `npm run verify`
