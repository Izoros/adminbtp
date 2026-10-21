import { z } from "zod";

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
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Document = z.infer<typeof Document>;
