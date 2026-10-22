import { z } from "zod";
import { MissionRole } from "./roles";

export const DocumentCategory = z.enum([
  "COURRIER",
  "COMPTE_RENDU",
  "PPSPS",
  "DC4",
  "AGREMENT_SOUS_TRAITANT",
  "RESERVES",
  "SITUATION_TRAVAUX",
  "DOE",
  "DGD",
  "MARCHE",
  "ADMINISTRATIF",
  "AUTRE",
  // Actes de lancement (voir ActTemplate ci-dessous) et pièces de marché structurées.
  "AE",
  "OS",
  "NOTIFICATION_MARCHE",
  "CCAP",
  "CCTP",
  "DPGF",
  "BPU",
]);
export type DocumentCategory = z.infer<typeof DocumentCategory>;

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  COURRIER: "Courrier administratif",
  COMPTE_RENDU: "Compte-rendu",
  PPSPS: "PPSPS (préédition)",
  DC4: "DC4",
  AGREMENT_SOUS_TRAITANT: "Agrément de sous-traitant",
  RESERVES: "Tableau de réserves",
  SITUATION_TRAVAUX: "Situation de travaux",
  DOE: "DOE",
  DGD: "DGD",
  MARCHE: "Marché",
  ADMINISTRATIF: "Administratif",
  AUTRE: "Autre",
  AE: "Acte d'engagement",
  OS: "Ordre de service",
  NOTIFICATION_MARCHE: "Notification du marché",
  CCAP: "CCAP",
  CCTP: "CCTP",
  DPGF: "DPGF",
  BPU: "BPU",
};

/**
 * Modèle de document réutilisable (DOCX) propre à une organisation, avec en-tête/pied
 * de page personnalisés et variables métier (ex: {{chantier.nom}}, {{societe.siret}}).
 * Le PPSPS doit toujours être généré avec le statut "PREEDITION" : il nécessite un contrôle
 * et une adaptation par les personnes compétentes avant toute valeur contractuelle/sécurité.
 */
export const DocumentTemplate = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  category: DocumentCategory,
  name: z.string().min(1),
  fileUrl: z.string(), // chemin Storage privé
  variables: z.array(z.string()).default([]),
  requiresExpertReview: z.boolean().default(false), // true pour PPSPS notamment
  version: z.number().int().positive().default(1),
  /**
   * Tags optionnels de préfiltre par profil d'organisation (forme juridique, corps d'état) — un
   * modèle sans tag reste visible à tous. Ne crée aucun droit ; si un modèle devient un service
   * premium, c'est has_entitlement() qui gouverne l'accès, pas ces tags.
   */
  audienceLegalKind: z.string().optional(),
  audienceTradeCode: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type DocumentTemplate = z.infer<typeof DocumentTemplate>;

export const DocumentStatus = z.enum([
  "BROUILLON",
  "PREEDITION",
  "EN_CONTROLE",
  "EN_VALIDATION",
  "VALIDE",
  "ENVOYE",
  "ARCHIVE",
]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  BROUILLON: "Brouillon",
  PREEDITION: "Préédition",
  EN_CONTROLE: "En contrôle",
  EN_VALIDATION: "En validation",
  VALIDE: "Validé",
  ENVOYE: "Envoyé",
  ARCHIVE: "Archivé",
};

export const Document = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  category: DocumentCategory,
  title: z.string().min(1),
  status: DocumentStatus,
  fileUrl: z.string(),
  version: z.number().int().positive().default(1),
  templateId: z.string().uuid().optional(),
  /**
   * Organisation concernée par ce document quand il ne s'agit pas de son auteur (ex: un DC4 ou un
   * AGREMENT_SOUS_TRAITANT désigne un sous-traitant précis, distinct de `organizationId` qui reste
   * l'organisation propriétaire/auteure du document). Vide pour la plupart des documents.
   */
  concernsOrganizationId: z.string().uuid().optional(),
  /** Code d'acte précis (voir ActTemplate) quand ce document en est l'émission — ex: "OS_DEMARRAGE". */
  actCode: z.string().optional(),
  /**
   * Diffusion ciblée : quand un acte concerne un lot précis, il vise le titulaire de ce lot
   * (site_participants + lotId), pas tout le chantier. Vide pour un document chantier-large.
   */
  lotId: z.string().uuid().optional(),
  /** Entrée de journal citée comme motif (ex: un OS de prolongation après une intempérie). */
  sourceLogEntryId: z.string().uuid().optional(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Document = z.infer<typeof Document>;

/**
 * Référentiel déclaratif des actes de lancement par famille de mission (ex: MOE en ACT/DET) —
 * une checklist de dépendances entre actes, pas une machine à états parallèle à `Document`.
 * Chaque acte produit un `Document` de la catégorie indiquée, dont le cycle de statuts standard
 * (BROUILLON → EN_VALIDATION → VALIDE → ENVOYE) s'applique normalement. `dependsOnActCode`
 * référence un autre `ActTemplate.code` de la même `missionFamily` qui doit être `ENVOYE` avant
 * que celui-ci ne soit proposé — un blocage affiché, pas un verrou impossible à outrepasser (voir
 * docs/MONETIZATION_AND_ENTITLEMENTS.md pour un précédent similaire côté entitlements : toujours
 * une vérification explicite, jamais un verrou silencieux côté UI seule).
 */
export const ActTemplate = z.object({
  id: z.string().uuid(),
  missionFamily: z.string().min(1), // ex: "MOE"
  code: z.string().min(1), // ex: "NOTIFICATION_MARCHE", "OS_DEMARRAGE"
  label: z.string().min(1),
  documentCategory: DocumentCategory,
  requiredMissionRole: MissionRole, // qui peut émettre cet acte (MOE, ou OPC si le template le dit)
  dependsOnActCode: z.string().optional(),
  unlocksPhaseTemplateCode: z.string().optional(), // ex: OS_DEMARRAGE débloque "EXE"
  sortOrder: z.number().int().default(0),
});
export type ActTemplate = z.infer<typeof ActTemplate>;

export const DocumentReviewSource = z.enum(["AI", "HUMAIN"]);
export type DocumentReviewSource = z.infer<typeof DocumentReviewSource>;

export const DocumentReviewVerdict = z.enum(["OK", "ECARTS", "INSUFFISANT"]);
export type DocumentReviewVerdict = z.infer<typeof DocumentReviewVerdict>;

export const DOCUMENT_REVIEW_VERDICT_LABELS: Record<DocumentReviewVerdict, string> = {
  OK: "Conforme",
  ECARTS: "Écarts constatés",
  INSUFFISANT: "Insuffisant",
};

/**
 * Trace de contrôle d'un document — IA ou humain. Un contrôle IA fait au plus passer le document
 * en `EN_CONTROLE` : seul un utilisateur `VALIDATEUR` (ou l'action de validation existante côté
 * chantier) peut le faire passer à `VALIDE`. Pas de nouveau statut "validé par IA".
 */
export const DocumentReview = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  source: DocumentReviewSource,
  verdict: DocumentReviewVerdict,
  findings: z.record(z.string(), z.unknown()).default({}),
  createdByUserId: z.string().uuid().optional(), // vide pour un contrôle IA
  createdAt: z.string().datetime(),
});
export type DocumentReview = z.infer<typeof DocumentReview>;
