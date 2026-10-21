---
name: adminbtp-project-workflows
description: Fonctionnement du moteur de phases configurable (PhaseTemplate/PhaseInstance) et du circuit de validation (préparation→contrôle→dirigeant→signature→envoi→archivage), avec la distinction stricte approbation humaine / preuve WhatsApp / signature électronique. Utiliser pour toute fonctionnalité de phases, checklists ou validations.
---

# Moteur de phases et circuit de validation

## Un seul moteur, jamais de duplication par profil

`PhaseTemplate` (référentiel réutilisable, ex: "APD", "DOE") et `PhaseTemplateSet` (regroupement
par `missionFamily`, ex: "MOE", "TCE", "MOA") sont des référentiels **partagés entre toutes les
organisations**. Une organisation ne doit jamais avoir sa propre copie dupliquée d'un template —
si une personnalisation est nécessaire, elle se fait par instance (`PhaseInstance`), pas par
fork du référentiel.

`PhaseInstance` est l'exécution réelle sur un chantier. Son avancement n'est **pas** une machine
à états strictement séquentielle : `dependsOnPhaseInstanceIds` exprime des conditions de passage
déclaratives, qui permettent à des phases de se chevaucher (ex: VISA et DET peuvent se
chevaucher en fin de chantier MOE). Ne jamais coder en dur "la phase N+1 ne peut commencer que si
la phase N a le statut VALIDEE" sans vérifier `dependsOnPhaseInstanceIds` — certains chantiers
légitimement avancent plusieurs phases en parallèle.

`PhaseInstanceStatus` : `A_VENIR → EN_COURS → EN_ATTENTE_VALIDATION → VALIDEE`, avec les
embranchements `BLOQUEE` et `ANNULEE` possibles depuis n'importe quel état actif.

## Checklist de phase

Chaque `PhaseInstance.checklist` est un tableau de `ChecklistItem` (label, done,
responsibleUserId, dueDate) — c'est une checklist **libre**, pas un schéma fixe par type de
phase. Un chantier atypique doit pouvoir avoir une checklist différente d'un chantier standard de
la même famille de mission, sans modification de code.

## Circuit de validation (ValidationStep)

```
PREPARATION → CONTROLE_GESTIONNAIRE → VALIDATION_DIRIGEANT → SIGNATURE → ENVOI → ARCHIVAGE
```

Chaque étape produit un `ValidationRecord` avec une `decision` (`APPROUVE` / `REFUSE` /
`MODIFICATION_DEMANDEE`). Règles non négociables :

1. **`whatsappProofUrl` n'est jamais suffisant pour marquer `isLegallyBindingSignature: true`.**
   Une preuve WhatsApp est un élément de preuve d'échange, rien de plus. Seule une signature
   via un prestataire dédié (`signatureProvider` + `signatureEnvelopeId`, ex: Yousign, DocuSign —
   non branché en Phase 1) peut mettre `isLegallyBindingSignature` à `true`.
2. Toute étape de validation franchie doit être tracée dans `AuditLogEntry` (`action`:
   `"document.validate"` ou équivalent), avec `actorType` cohérent (`USER` pour une décision
   humaine, `AUTOMATION` si une règle n8n fait avancer automatiquement une étape non critique).
3. L'étape `SIGNATURE` ne doit jamais être automatiquement marquée franchie par une simple
   réponse WhatsApp ou email — elle nécessite une action explicite de signature électronique ou,
   en son absence (Phase 1, démo), reste bloquée en l'état avec un message clair à l'utilisateur.

Voir [[adminbtp-btp-expert]] pour le contexte métier des documents concernés et
[[adminbtp-quality-gate]] pour les critères de validation de ces écrans avant mise en production.
