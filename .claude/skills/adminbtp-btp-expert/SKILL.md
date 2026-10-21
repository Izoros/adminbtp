---
name: adminbtp-btp-expert
description: Vocabulaire métier BTP, profils d'intervenants, phases types par famille de mission et spécificités Mayotte/France à appliquer dans AdminBTP. Utiliser pour tout travail touchant au moteur de phases, aux rôles métier (MissionRole) ou aux documents réglementaires du secteur.
---

# Expertise métier BTP — AdminBTP

## Profils d'intervenants (MissionRole) et ce qu'ils impliquent

AdminBTP sert **un même moteur de phases/documents/validations** pour tous ces profils — ne
jamais créer de système ou de table séparée par profil. La différence entre profils est une
question de **configuration** (quel PhaseTemplateSet, quels types de documents attendus, quels
intervenants sur la fiche chantier), pas d'architecture.

| MissionRole | Rôle réel | Implication produit |
|---|---|---|
| MOA | Maîtrise d'ouvrage (le client final/propriétaire) | Valide les phases de programmation/réception, signe les marchés |
| MOE | Maîtrise d'œuvre (architecte, BET mandataire) | Pilote ESQ→APS→APD→PRO→DCE→ACT→VISA→DET→AOR |
| AMO | Assistance à maîtrise d'ouvrage | Conseille la MOA, pas de responsabilité de conception |
| OPC | Ordonnancement, pilotage, coordination | Gère le planning d'exécution multi-lots, pas la conception |
| BET | Bureau d'études techniques | Produit des notes de calcul, études spécialisées (structure, fluides...) |
| ENTREPRISE_GENERALE | Marché unique tous corps d'état | Un seul interlocuteur travaux pour la MOA |
| ENTREPRISE_TCE | Entreprise tous corps d'état en groupement/cotraitance | Similaire à EG mais répartition contractuelle différente |
| ENTREPRISE_LOT | Entreprise sur un lot technique précis | Un lot = un corps d'état (gros œuvre, VRD, électricité...) |
| SOUS_TRAITANT | Sous-traitant d'une entreprise titulaire | Nécessite un DC4 (déclaration de sous-traitance) validé par la MOA |
| PROMOTEUR | Monte l'opération immobilière | Souvent MOA + financement, suit la commercialisation |
| BAILLEUR_SOCIAL | MOA spécifique au logement social | Contraintes de financement public, délais réglementaires propres |
| COLLECTIVITE | MOA publique | Marchés publics : formalisme CCAG/CCTP, DC4 obligatoire, publicité des marchés |

Une organisation peut avoir des rôles **différents selon le chantier** (cf. `SiteParticipant`).
Ne jamais supposer qu'une société a un rôle fixe.

## Phases types par famille de mission (PhaseTemplateSet.missionFamily)

Ces séquences sont **indicatives**, pas imposées strictement (le moteur accepte des
chevauchements via `dependsOnPhaseInstanceIds`) :

- **MOE** : ESQ (esquisse) → APS (avant-projet sommaire) → APD (avant-projet définitif) → PRO
  (projet) → DCE (dossier de consultation des entreprises) → ACT (assistance aux contrats de
  travaux) → VISA (visa des études d'exécution) → DET (direction de l'exécution des travaux) →
  AOR (assistance aux opérations de réception).
- **TCE / Entreprise** : CONSULTATION → ATTRIBUTION → PREPARATION → EXE (études d'exécution) →
  TRAVAUX → RECEPTION → DOE (dossier des ouvrages exécutés) → DGD (décompte général définitif) →
  GPA (garantie de parfait achèvement, 1 an après réception).
- **MOA** : PROGRAMMATION → FINANCEMENT → ETUDES → CONSULTATION → EXECUTION → RECEPTION →
  EXPLOITATION.

Avant de créer ou modifier un `PhaseTemplate`, vérifier avec l'utilisateur si une séquence
diffère de ces standards pour son organisation (marchés publics vs privés, notamment).

## Documents réglementaires à connaître

- **PPSPS** (Plan Particulier de Sécurité et de Protection de la Santé) : obligatoire dès qu'il
  y a coordination SPS (chantier avec plusieurs entreprises). **Doit toujours être généré en
  statut PREEDITION** — jamais directement validé par la plateforme, cf.
  [[adminbtp-documents]].
- **DC4** : déclaration de sous-traitance, nécessite l'agrément du sous-traitant par la MOA et
  l'acceptation de ses conditions de paiement.
- **DOE** (Dossier des Ouvrages Exécutés) : livré par l'entreprise à réception, contient plans
  de récolement, notices d'entretien, PV d'essais.
- **DGD** (Décompte Général Définitif) : solde financier du marché, signature = fin de la
  relation contractuelle (hors GPA).
- **Situation de travaux** : décompte mensuel d'avancement, base du paiement — voir les statuts
  dans `PaymentStatus` (A_ETABLIR → TRANSMIS → EN_VERIFICATION → ACCEPTE/CONTESTE → PAYE).

## Spécificités Mayotte (territoire cible initial)

- Fuseau horaire **Indian/Mayotte** (UTC+3, pas de changement d'heure) — toujours utiliser ce
  fuseau pour les échéances et notifications, jamais Europe/Paris par défaut.
- Codes postaux en 976xx, département 976.
- Marché de la construction très majoritairement composé de TPE/PME locales — les circuits de
  validation doivent rester simples (éviter les workflows à 6 étapes par défaut pour une petite
  structure, cf. `ReminderRule` configurable par contrat plutôt que loi générale imposée).
- Nombreux marchés publics (collectivités, bailleurs sociaux) → formalisme CCAG-Travaux à
  respecter dans les modèles de courriers et DC4.

## Règle à ne jamais enfreindre

**Une approbation WhatsApp n'est pas une signature électronique.** Ces deux notions doivent
toujours être tracées séparément dans `ValidationRecord` (`whatsappProofUrl` vs
`signatureProvider`/`signatureEnvelopeId`/`isLegallyBindingSignature`). Voir
[[adminbtp-project-workflows]] pour le détail du circuit de validation.
