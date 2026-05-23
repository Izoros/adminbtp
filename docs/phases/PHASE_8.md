# Phase 8 - Relances decomptes et tresorerie

## Perimetre livre

- schema SQL `situations`
- schema SQL `payment_followups`
- types TypeScript du module `followups`
- generation automatique des relances J+7, J+15, J+30, J+45
- page `/followups`
- tests de calcul d'echeancier

## Validation cible

- une situation genere automatiquement un planning de relance

## Validation locale

La page `/followups` expose une situation de demonstration et le planning de
relance calcule automatiquement a partir de la date d'echeance.

## Points de securite

- situations reservees aux membres de l'organisation
- relances heritant des droits de l'organisation
- planning calcule de maniere deterministe sans dependance externe

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du planning J+7/J+15/J+30/J+45 : OK
