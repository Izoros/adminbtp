import { z } from "zod";

/**
 * Exécution de chantier — visa de plans, réserves, journal, comptes-rendus, avancement.
 * Un seul moteur : ces entités s'appuient sur les chantiers/lots/documents/tâches existants,
 * jamais un second système parallèle. Voir docs/ROADMAP.md (Tranche C).
 */

export const PlanSubmissionStatus = z.enum(["DEPOSE", "VISE_BPE", "VISE_AVEC_REMARQUES", "REFUSE"]);
export type PlanSubmissionStatus = z.infer<typeof PlanSubmissionStatus>;

export const PLAN_SUBMISSION_STATUS_LABELS: Record<PlanSubmissionStatus, string> = {
  DEPOSE: "Déposé",
  VISE_BPE: "Visé bon pour exécution",
  VISE_AVEC_REMARQUES: "Visé avec remarques",
  REFUSE: "Refusé",
};

/** File « en attente de visa » pour la MOE du chantier — la diffusion après visa vise le lot. */
export const PlanSubmission = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  documentId: z.string().uuid(),
  authorUserId: z.string().uuid(),
  status: PlanSubmissionStatus,
  reviewedByUserId: z.string().uuid().optional(),
  reviewedAt: z.string().datetime().optional(),
  remarks: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type PlanSubmission = z.infer<typeof PlanSubmission>;

export const ReserveSeverity = z.enum(["MINEURE", "MAJEURE", "BLOQUANTE"]);
export type ReserveSeverity = z.infer<typeof ReserveSeverity>;

export const RESERVE_SEVERITY_LABELS: Record<ReserveSeverity, string> = {
  MINEURE: "Mineure",
  MAJEURE: "Majeure",
  BLOQUANTE: "Bloquante",
};

export const ReserveStatus = z.enum(["OUVERTE", "LEVEE", "CONTESTEE"]);
export type ReserveStatus = z.infer<typeof ReserveStatus>;

export const RESERVE_STATUS_LABELS: Record<ReserveStatus, string> = {
  OUVERTE: "Ouverte",
  LEVEE: "Levée",
  CONTESTEE: "Contestée",
};

/** Réserve individuelle — la réception/GPA liste les réserves ouvertes, pas un PDF unique. */
export const ReserveItem = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  location: z.string().optional(), // local
  description: z.string().min(1),
  severity: ReserveSeverity,
  dueDate: z.string().date().optional(),
  status: ReserveStatus,
  documentId: z.string().uuid().optional(),
  photoUrl: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ReserveItem = z.infer<typeof ReserveItem>;

export const SiteLogEntryKind = z.enum(["INTEMPERIE", "ARRET", "LIVRAISON", "INCIDENT", "AUTRE"]);
export type SiteLogEntryKind = z.infer<typeof SiteLogEntryKind>;

export const SITE_LOG_ENTRY_KIND_LABELS: Record<SiteLogEntryKind, string> = {
  INTEMPERIE: "Intempérie",
  ARRET: "Arrêt de chantier",
  LIVRAISON: "Livraison",
  INCIDENT: "Incident",
  AUTRE: "Autre",
};

/** Journal de chantier — peut être cité comme motif d'un OS ou d'un avenant, jamais généré automatiquement. */
export const SiteLogEntry = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  entryDate: z.string().date(),
  kind: SiteLogEntryKind,
  description: z.string().min(1),
  authorUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type SiteLogEntry = z.infer<typeof SiteLogEntry>;

export const MeetingAttendee = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
});
export type MeetingAttendee = z.infer<typeof MeetingAttendee>;

/** Chaque décision peut créer une tâche existante (taskId renseigné une fois créée). */
export const MeetingDecision = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  text: z.string().min(1),
  taskId: z.string().uuid().optional(),
});
export type MeetingDecision = z.infer<typeof MeetingDecision>;

/** Le PDF de CR (catégorie COMPTE_RENDU existante) est généré depuis ces lignes, pas l'inverse. */
export const MeetingNote = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  meetingDate: z.string().date(),
  createdByUserId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
export type MeetingNote = z.infer<typeof MeetingNote>;

/** Avancement déclaré sur un lot — comparé au cumul HT facturé côté UI, pas un moteur de planning. */
export const LotProgress = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  recordDate: z.string().date(),
  declaredPercent: z.number().min(0).max(100),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type LotProgress = z.infer<typeof LotProgress>;
