# Phase 35 - Accueil public et vitrine mahoraise

## Objectif

Remplacer l'ancien cockpit public par une entree plus classique : comprendre
rapidement AdminBTP, se connecter et decouvrir son ancrage BTP a Mayotte.

## Livrables

- connexion par mot de passe ou lien magique directement sur `/` ;
- presentation tres courte des fonctions essentielles ;
- rubrique vlog chantier en trois themes ;
- carrousel manuel et accessible de trois visuels originaux ;
- redirection de `/login` vers la connexion de l'accueil ;
- maintien de la destination demandee apres authentification ;
- credit `Create and design par FAST976.yt` en pied de page ;
- correction de l'exposition des variables `NEXT_PUBLIC_*` dans le bundle navigateur.

## Decisions

- les visuels sont des creations originales et ne representent pas des operations
  ou realisations revendiquees par AdminBTP ;
- le carrousel ne demarre pas automatiquement afin de garder le controle utilisateur ;
- la page reste un Server Component ; seule l'interaction du carrousel est cote client ;
- le formulaire conserve les controles et redirections du tunnel d'authentification existant.

## Validation

- rendu grand ecran sans debordement horizontal ;
- formulaire, configuration Supabase et champs autocomplete verifies dans le navigateur ;
- changement de visuel et chargement d'image verifies ;
- aucune erreur d'hydratation ou surcouche Next.js apres correction ;
- `npm run verify` : `70` fichiers et `308` tests passes ;
- build Next.js : `32` routes generees ;
- smoke local : pages critiques et crons proteges passes ;
- audit local : `20` pages, `21` cibles et `7` redirections attendues ;
- `npm audit --omit=dev` : `0` vulnerabilite detectee ;
- deploiement Vercel `b781b0a` : `READY` ;
- `npm run verify:prod` : pages, liens, redirections, sante et en-tetes passes ;
- observabilite Vercel : aucune erreur runtime ou fatale detectee apres verification.
