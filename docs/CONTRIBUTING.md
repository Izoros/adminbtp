# AdminBTP - Regles de contribution

## Objectif

Permettre a plusieurs developpeurs ou agents IA de travailler en parallele sans casser l'architecture, ni melanger les responsabilites entre core et modules.

## Principes de collaboration

- travailler par modules
- garder des tickets GitHub petits et validables
- ne coder qu'une phase a la fois
- documenter chaque livraison
- ecrire les tests minimum avant merge
- demander validation pour tout changement du core

## Branching model

Branches de reference :

- `main` : version stable
- `develop` : integration

Branches fonctionnelles recommandees :

- `feature/auth`
- `feature/organizations`
- `feature/projects`
- `feature/documents`
- `feature/signatures`
- `feature/n8n`
- `feature/odoo`
- `feature/ui-dashboard`

Regles :

- une branche par module ou sous-fonctionnalite
- un ticket GitHub minimum par branche
- pas de developpement direct sur `main`
- pas de developpement direct sur `develop`
- merge via pull request obligatoire

## Regle speciale sur le core

Le core comprend :

- auth
- organizations
- permissions
- audit logs
- design system

Aucun developpeur ne doit modifier le core sans validation.

Sont consideres comme changements core :

- modification des roles et permissions
- modification des composants de base partages
- modification de la structure des providers globaux
- modification des conventions de donnees transverses
- modification des tables supportant plusieurs modules

## Workflow de travail

### Avant de coder

1. Lire `README.md`.
2. Lire `docs/CDC/AdminBTP_V1.md`.
3. Lire `docs/ROADMAP.md`.
4. Verifier les types existants.
5. Proposer un plan court.
6. Coder uniquement la phase demandee.
7. Mettre a jour la documentation.

### Pendant le developpement

- respecter le perimetre du ticket
- isoler le code par module
- ajouter les types dans le module concerne
- versionner le schema SQL si besoin
- ajouter l'UI seulement si la phase le demande
- couvrir les cas minimum par des tests

### Avant pull request

- relire le scope de phase
- lancer les tests utiles
- verifier les types
- mettre a jour la documentation
- completer la checklist de validation

## Convention d'organisation du code

Chaque module doit contenir si necessaire :

- `types/`
- `components/`
- `services/`
- `hooks/`
- `tests/`
- `README.md` ou documentation module

Le dossier cible recommande dans `apps/web` :

```text
src/
├── app/
├── components/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── projects/
│   ├── phases/
│   ├── documents/
│   ├── signatures/
│   ├── emails/
│   ├── followups/
│   ├── consulting/
│   ├── ai/
│   └── settings/
├── lib/
├── types/
└── config/
```

## Contenu minimum d'une livraison

Chaque phase ou sous-phase doit livrer :

1. code fonctionnel
2. types TypeScript
3. schema SQL si besoin
4. pages UI si besoin
5. tests minimum
6. documentation
7. checklist de validation

## Regles de pull request

Chaque pull request doit :

- referencer un ticket GitHub
- indiquer la phase concernee
- decrire le module impacte
- lister les changements SQL
- lister les tests executes
- signaler les limites connues
- confirmer la mise a jour documentaire

## Regles de merge

Vers `develop` :

- tests passes
- revue terminee
- scope respecte
- documentation a jour

Vers `main` :

- phase validee
- integration stable
- aucune regression critique
- checklist de validation approuvee

## Regles pour agents IA

- ne jamais depasser la phase demandee
- ne pas modifier le core sans validation explicite
- ne pas renommer librement les concepts metier partages
- ne pas introduire de dependance transverse non documentee
- toujours mettre a jour la documentation en meme temps que le code
