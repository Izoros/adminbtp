# Phase 17 - Verification transverse des garde-fous serveur

## Perimetre livre

- formalisation d'une verification locale dediee aux garde-fous auth et scope serveur
- couverture ciblee du noyau permissions partage `server-scope` et `server-guards`
- couverture ciblee des refus de scope sur `documents`, `signatures`, `consulting` et `client-space`
- mise a jour de la documentation transverse pour refleter l'etat reel du socle de securite applicatif

## Validation cible

- les refus de scope serveur critiques sont testes avant la suite de la validation globale
- l'equipe dispose d'un point d'entree simple pour verifier les garde-fous sans lancer toute la batterie
- la documentation produit et projet decrit les garde-fous reellement en place, et pas seulement les intentions

## Verification locale

Le depot dispose maintenant d'un point d'entree cible pour les garde-fous :

- commande dediee : [package.json](/Users/symba/Documents/9_AdminBTP/package.json:1) expose `npm run verify:guards`
- orchestration locale : [scripts/validate.sh](/Users/symba/Documents/9_AdminBTP/scripts/validate.sh:1) lance cette verification avant la batterie complete
- noyau permissions : [apps/web/src/lib/permissions/server-scope.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/lib/permissions/server-scope.test.ts:1) et [apps/web/src/lib/permissions/server-guards.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/lib/permissions/server-guards.test.ts:1)
- refus de scope sur actions sensibles : [apps/web/src/modules/documents/tests/document-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/documents/tests/document-actions.test.ts:1), [apps/web/src/modules/signatures/tests/signature-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/signatures/tests/signature-actions.test.ts:1), [apps/web/src/modules/consulting/tests/consulting-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/consulting/tests/consulting-actions.test.ts:1) et [apps/web/src/modules/client-space/tests/client-space-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/client-space/tests/client-space-actions.test.ts:1)

## Points de securite

- la verification ciblee ne remplace pas la RLS ni les fonctions SQL, elle ajoute un filet de non-regression rapide autour du core permissions
- les tests portent sur les refus de perimetre les plus sensibles, la ou une regression serait la plus couteuse en multi-tenant
- l'approche reste non intrusive : la batterie complete continue de tourner ensuite via `npm run verify`

## Resultat d'execution

- `npm run verify:guards` : OK
- verification ciblee : `6` fichiers de test passes
- verification ciblee : `18` tests passes
