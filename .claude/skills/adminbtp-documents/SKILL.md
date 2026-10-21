---
name: adminbtp-documents
description: Règles de génération et de cycle de vie des documents AdminBTP (statuts, préédition PPSPS, modèles, versioning). Utiliser pour toute fonctionnalité touchant DocumentTemplate, Document ou l'écran /documents.
---

# Génération et cycle de vie des documents

## Cycle de statut (DocumentStatus)

```
BROUILLON → PREEDITION → EN_CONTROLE → EN_VALIDATION → VALIDE → ENVOYE → ARCHIVE
```

Ce n'est **pas** une machine à états strictement linéaire pour tous les types de document — un
courrier simple peut sauter `EN_CONTROLE`. En revanche, certaines transitions sont **non
négociables** :

- **Tout document généré avec `category: "PPSPS"` doit naître en statut `PREEDITION`**, jamais
  directement `VALIDE` ou `ENVOYE`. C'est une règle produit du cahier des charges, pas une
  contrainte technique arbitraire : un PPSPS préédité par la plateforme n'a aucune valeur
  contractuelle ou sécurité tant qu'une personne compétente (coordinateur SPS) ne l'a pas
  contrôlé et adapté. Voir `DocumentTemplate.requiresExpertReview` (vrai pour PPSPS).
- Un document ne doit jamais passer de `BROUILLON` à `ENVOYE` sans transiter par au moins
  `EN_VALIDATION` si `requiresExpertReview` est vrai sur son modèle.

## Versioning

Chaque `Document` et `DocumentTemplate` porte un champ `version` (entier, incrémental). Une
nouvelle version d'un document existant ne doit **jamais écraser** la précédente — créer une
nouvelle ligne (ou prévoir une table d'historique en Phase 2+) plutôt que de faire un `UPDATE`
qui perd la trace de l'ancienne version. C'est une exigence d'auditabilité, notamment pour les
PPSPS et les marchés publics.

## Catégories de document (DocumentCategory) et où elles apparaissent

Voir `DOCUMENT_CATEGORY_LABELS` dans `packages/types/src/document.ts` pour la liste exhaustive et
ses libellés français. Ne jamais dupliquer ces libellés ailleurs dans le code (cf. la correction
apportée en Phase 1 : les labels vivaient à tort dans `apps/web/src/lib/mock-data/documents.ts`
au lieu de `packages/types`, source de vérité unique).

## Génération assistée par IA (Phase 2+, pas branché en Phase 1)

Le fournisseur IA est interchangeable (`IAIProvider` dans `packages/integrations/src/ai`). Toute
génération de document par IA doit :
1. Produire un document en statut `BROUILLON` ou `PREEDITION` (jamais `VALIDE`/`ENVOYE`
   directement) — l'IA ne remplace jamais le contrôle humain, elle le prépare.
2. Être tracée dans `AuditLogEntry` avec `actorType: "AI"`.
3. Respecter les `variables` déclarées sur le `DocumentTemplate` (ex: `{{chantier.nom}}`,
   `{{societe.siret}}`) sans jamais inventer de valeur absente des données du chantier.

## Écran /documents

Affiche la liste avec rappel visible de la règle PPSPS préédition (cf. `documents/page.tsx`).
Toute évolution de cet écran doit conserver ce rappel tant que la génération IA/Odoo n'impose pas
un contrôle humain systématique ailleurs dans le flux.
