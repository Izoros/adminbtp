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
  /**
   * Nombre de jours avant qu'un visa en attente, une situation due non transmise, ou une pièce
   * d'agrément manquante ne déclenche une relance interne (tâche) — paramètre de chantier avec un
   * défaut explicite en base, jamais une constante cachée côté UI. Voir check_internal_reminders().
   */
  internalReminderDays: z.number().int().positive().default(7),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Site = z.infer<typeof Site>;

/**
 * Participation d'une organisation à un chantier avec un rôle métier donné.
 * Une organisation peut apparaître plusieurs fois sur le même chantier avec des rôles
 * différents (rare mais possible, ex: sous-traitant + intervention ponctuelle BET interne).
 */
/**
 * `leftAt` clôture une participation sans réécrire l'historique (OS, décomptes passés restent
 * intacts — ils référencent le lot/l'organisation, pas cette ligne de participation). Un
 * remplacement d'intervenant clôture l'ancienne ligne (leftAt renseigné) et en crée une nouvelle,
 * jamais une réécriture de joinedAt.
 */
export const SiteParticipant = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  organizationId: z.string().uuid(),
  missionRole: MissionRole,
  lotId: z.string().uuid().optional(), // si rôle lié à un lot spécifique
  contractAmountHt: z.number().nonnegative().optional(),
  joinedAt: z.string().datetime(),
  leftAt: z.string().datetime().optional(),
});
export type SiteParticipant = z.infer<typeof SiteParticipant>;

/** Membre d'un groupement titulaire d'un lot — le sous-traitant n'est jamais un cotraitant. */
export const LotMemberRole = z.enum(["MANDATAIRE", "COTRAITANT", "TITULAIRE"]);
export type LotMemberRole = z.infer<typeof LotMemberRole>;

export const LOT_MEMBER_ROLE_LABELS: Record<LotMemberRole, string> = {
  MANDATAIRE: "Mandataire",
  COTRAITANT: "Cotraitant",
  TITULAIRE: "Titulaire",
};

export const LotMember = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: LotMemberRole,
  sharePercent: z.number().min(0).max(100).optional(),
});
export type LotMember = z.infer<typeof LotMember>;

/** Macrolot/sous-lot : `parentLotId` doit référencer un lot du même chantier, jamais un cycle. */
export const Lot = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  number: z.string(), // ex: "Lot 03"
  name: z.string(), // ex: "Terrassement - VRD"
  assignedOrganizationId: z.string().uuid().optional(),
  amountHt: z.number().nonnegative().optional(),
  parentLotId: z.string().uuid().optional(),
});
export type Lot = z.infer<typeof Lot>;
