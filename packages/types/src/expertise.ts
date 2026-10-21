import { z } from "zod";

/**
 * Demande d'expertise technique (ingénieur BTP / architecte HMONP). Réservé aux
 * missions nécessitant une habilitation/assurance adaptée — le statut ASSIGNE suppose
 * une vérification préalable du périmètre contractuel de l'expert.
 */
export const ExpertiseRequestType = z.enum([
  "AVIS_INGENIEUR",
  "CONSULTATION_ARCHITECTE",
  "ANALYSE_EXE",
  "ANALYSE_DOE",
  "RELECTURE_MEMOIRE_TECHNIQUE",
  "ASSISTANCE_APPEL_OFFRES",
  "AUTRE",
]);
export type ExpertiseRequestType = z.infer<typeof ExpertiseRequestType>;

export const ExpertiseRequestStatus = z.enum([
  "NOUVELLE",
  "ASSIGNEE",
  "EN_COURS",
  "RAPPORT_LIVRE",
  "CLOTUREE",
]);
export type ExpertiseRequestStatus = z.infer<typeof ExpertiseRequestStatus>;

export const ExpertiseRequest = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  type: ExpertiseRequestType,
  status: ExpertiseRequestStatus,
  requestedByUserId: z.string().uuid(),
  assignedExpertUserId: z.string().uuid().optional(),
  description: z.string(),
  attachedDocumentIds: z.array(z.string().uuid()).default([]),
  hoursSpent: z.number().nonnegative().default(0),
  createdAt: z.string().datetime(),
});
export type ExpertiseRequest = z.infer<typeof ExpertiseRequest>;
