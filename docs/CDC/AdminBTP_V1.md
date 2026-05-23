# AdminBTP V1 - CDC minimal de reference

## Role du document

Ce document sert de point de lecture obligatoire avant toute nouvelle phase de developpement.

## Vision V1

AdminBTP doit etre concu comme une plateforme hybride combinant :

- SaaS de gestion administrative BTP
- automatisation IA
- gestionnaires administratifs externalises
- expertise technique humaine

## Priorite V1

Construire un socle modulaire, multi-tenant et extensible capable d'accueillir ensuite :

- gestion des organisations
- gestion des chantiers
- base documentaire
- circuits de validation
- workflows automatises
- expertise ingenieur et architecte HMONP

## Contraintes d'architecture

- monorepo obligatoire
- logique `core + modules`
- separation stricte des responsabilites
- documentation continue
- validations par phase

## Regles produit

- aucune action IA irreversible sans validation humaine
- aucune fuite inter-organisation
- chaque module doit rester autonome autant que possible
- la plateforme doit servir a la fois l'administratif et l'accompagnement technique

## Documents lies

- [Roadmap](/Users/symba/Documents/9_AdminBTP/docs/ROADMAP.md)
- [Validation checklist](/Users/symba/Documents/9_AdminBTP/docs/VALIDATION_CHECKLIST.md)
- [Contributing](/Users/symba/Documents/9_AdminBTP/docs/CONTRIBUTING.md)
- [Architecture produit](/Users/symba/Documents/9_AdminBTP/docs/adminbtp-platform-architecture.md)
