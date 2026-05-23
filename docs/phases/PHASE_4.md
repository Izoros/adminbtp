# Phase 4 - Base documentaire

## Perimetre livre

- schema SQL `document_templates`
- schema SQL `documents`
- politiques RLS de base documentaire
- types TypeScript du module `documents`
- moteur de rendu de template avec variables dynamiques
- entete, logo, tampon et signature simple
- generation PDF simple via `pdf-lib`
- page `/documents`
- tests de remplacement de variables et de generation PDF

## Validation cible

- un document peut etre genere depuis un template
- variables dynamiques remplacees correctement

## Validation locale

La page `/documents` permet d'afficher un template de compte rendu chantier,
de le rendre avec des variables de demonstration et d'ouvrir un PDF simple dans
un nouvel onglet.

## Points de securite

- lecture documentaire reservee aux membres de l'organisation
- gestion des templates reservee aux gestionnaires d'organisation
- generation PDF locale sans exposition de secret
- contenu rendu stockable sans eval dynamique cote client

## Resultat d'execution

- `lint` : OK
- `typecheck` : OK
- `test` : OK
- `build` : OK
- validation locale du rendu de template et du PDF simple : OK
