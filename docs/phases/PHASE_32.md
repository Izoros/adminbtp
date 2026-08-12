# Phase 32 - Tableau de preparation des integrations

## Objectif

Donner a l'administrateur plateforme une vue exploitable des connexions encore
a configurer, sans exposer les valeurs des secrets et sans simuler un test reel.

## Livrables

- page protegee `/admin/readiness`
- acces depuis le cockpit `/admin`
- controles de presence pour Supabase, WhatsApp, archives et alertes
- distinction entre `Pret a tester`, `Configuration incomplete` et `Desactive`
- compteur des expediteurs et hotes autorises sans afficher leur contenu
- couverture par le smoke de production

## Decisions de securite

- la page exige une session puis le role `is_platform_admin`
- aucune cle, aucun token, aucun numero et aucune URL n'est retourne au composant
- le service ne lit les variables qu'apres autorisation
- la presence d'une variable ne vaut jamais test de connexion
- aucun interrupteur externe n'est active par cette page

## Validation locale du 2026-08-12

- une configuration vide classe Supabase en attention et les services optionnels
  en desactive
- une configuration complete classe les quatre groupes `Pret a tester`
- la serialisation du modele de vue ne contient aucune valeur source
- un non-administrateur ne voit aucun indicateur
- `/admin/readiness` passe les controles de build et de smoke
- `npm run verify` : `67` fichiers et `296` tests passes
- build Next.js : `31` routes generees
- `npm audit --omit=dev` : `0` vulnerabilite detectee
- smoke du build local : routes critiques passees, crons sans secret refuses en `401`

## Limites explicites

- le projet Supabase distant doit encore etre joignable et migre dans un
  environnement controle
- WhatsApp exige toujours un compte Meta Business de test
- l'archive exige toujours une cible LWS ou SFTP testee en ecriture et relecture
- les alertes exigent toujours un webhook HTTPS controle
