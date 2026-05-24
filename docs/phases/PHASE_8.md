# Phase 8 - Relances decomptes et tresorerie

## Perimetre livre

- schema SQL `situations`
- schema SQL `payment_followups`
- types TypeScript du module `followups`
- generation automatique des relances J+7, J+15, J+30, J+45
- page `/followups`
- tests de calcul d'echeancier
- etat vide Supabase conserve quand aucune situation n'existe encore
- persistance reelle du planning de relance dans Supabase
- mise a jour reelle du statut d'une relance depuis l'interface
- feedback utilisateur relaie via les query params de la page

## Validation cible

- une situation genere automatiquement un planning de relance
- un planning calcule peut etre persiste dans `payment_followups`
- une relance persistée peut passer de `scheduled` a `sent`, `done` ou `cancelled`

## Validation locale

La page `/followups` expose une situation de demonstration et le planning de
relance calcule automatiquement a partir de la date d'echeance.

Quand la source est `supabase`, l'interface permet maintenant:
- de persister un planning de relance genere a la volee
- de piloter le statut des relances deja persistées
- d'afficher un message de retour succes/erreur apres action serveur
- et de rester sur un vrai etat vide si aucune situation n'est encore disponible

## Points de securite

- situations reservees aux membres de l'organisation
- relances heritant des droits de l'organisation
- planning calcule de maniere deterministe sans dependance externe
- ecritures `payment_followups` protegees par le scope organisation serveur
- refus explicites si la session, le scope ou les identifiants requis sont absents

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du planning J+7/J+15/J+30/J+45 : OK
- persistance et transitions de statut des relances : OK
- validation locale de l'etat vide Supabase cote relances : OK
