import { z } from "zod";
import { MissionRole } from "./roles";

export const SiteStatus = z.enum([
  "ETUDE",
  "CONSULTATION",
  "PREPARATION",
  "EN_COURS",
  "RECEPTION",
  "GPA",
  "CLOTURE",
  "SUSPENDU",
]);
export type SiteStatus = z.infer<typeof SiteStatus>;

export const SITE_STATUS_LABELS: Record<SiteStatus, string> = {
  ETUDE: "Étude",
  CONSULTATION: "Consultation",
  PREPARATION: "Préparation",
  EN_COURS: "En cours",
  RECEPTION: "Réception",
  GPA: "Garantie de parfait achèvement",
  CLOTURE: "Clôturé",
  SUSPENDU: "Suspendu",
};

/** Chantier / opération suivie par AdminBTP. */
export const Site = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  reference: z.string().min(1), // référence interne (ex: 2026-MDA-012)
  address: z.string(),
  city: z.string(),
  postalCode: z.string().optional(),
  status: SiteStatus,
  budgetHt: z.number().nonnegative().optional(),
  startDate: z.string().date().optional(),
  endDateEstimated: z.string().date().optional(),
  managerUserId: z.string().uuid().optional(), // gestionnaire AdminBTP référent
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Site = z.infer<typeof Site>;

/**
 * Participation d'une organisation à un chantier avec un rôle métier donné.
 * Une organisation peut apparaître plusieurs fois sur le même chantier avec des rôles
 * différents (rare mais possible, ex: sous-traitant + intervention ponctuelle BET interne).
 */
export const SiteParticipant = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  organizationId: z.string().uuid(),
  missionRole: MissionRole,
  lotId: z.string().uuid().optional(), // si rôle lié à un lot spécifique
  contractAmountHt: z.number().nonnegative().optional(),
  joinedAt: z.string().datetime(),
});
export type SiteParticipant = z.infer<typeof SiteParticipant>;

export const Lot = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  number: z.string(), // ex: "Lot 03"
  name: z.string(), // ex: "Terrassement - VRD"
  assignedOrganizationId: z.string().uuid().optional(),
  amountHt: z.number().nonnegative().optional(),
});
export type Lot = z.infer<typeof Lot>;
