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

export const AttendeeStatus = z.enum(["PRESENT", "EXCUSE", "ABSENT"]);
export type AttendeeStatus = z.infer<typeof AttendeeStatus>;

export const ATTENDEE_STATUS_LABELS: Record<AttendeeStatus, string> = {
  PRESENT: "Présent",
  EXCUSE: "Excusé",
  ABSENT: "Absent",
};

export const MeetingAttendee = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  status: AttendeeStatus,
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

export const MeetingKind = z.enum(["OPC", "SYNTHESE", "RECEPTION"]);
export type MeetingKind = z.infer<typeof MeetingKind>;

export const MEETING_KIND_LABELS: Record<MeetingKind, string> = {
  OPC: "Réunion de chantier (OPC)",
  SYNTHESE: "Réunion de synthèse",
  RECEPTION: "Réunion de réception",
};

export const MeetingStatus = z.enum(["BROUILLON", "VALIDE"]);
export type MeetingStatus = z.infer<typeof MeetingStatus>;

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  BROUILLON: "Brouillon",
  VALIDE: "Validé",
};

/**
 * Le PDF de CR (catégorie COMPTE_RENDU existante) est généré depuis ces lignes, pas l'inverse.
 * Seuls les participants OPC et MOE créent une réunion et la font passer à VALIDE (vérifié côté
 * Server Action via site_participants, pas par une policy RLS).
 */
export const MeetingNote = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  kind: MeetingKind,
  number: z.number().int().positive().optional(),
  meetingDate: z.string().date(),
  authorOrganizationId: z.string().uuid().optional(),
  status: MeetingStatus,
  createdByUserId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  validatedAt: z.string().datetime().optional(),
  validatedByUserId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
export type MeetingNote = z.infer<typeof MeetingNote>;

/**
 * Point d'ordre du jour — référence une tâche, un document ou une entrée de journal, ou reste un
 * texte libre. Distinct d'une décision (MeetingDecision), qui crée toujours une tâche.
 */
export const MeetingAgendaItem = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  sourceLogEntryId: z.string().uuid().optional(),
  text: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type MeetingAgendaItem = z.infer<typeof MeetingAgendaItem>;

export const MeetingNoteDistributionChannel = z.enum(["EMAIL"]);
export type MeetingNoteDistributionChannel = z.infer<typeof MeetingNoteDistributionChannel>;

/**
 * Trace d'un envoi de compte-rendu validé à une organisation destinataire (présente ou titulaire
 * d'un lot cité dans une décision) — un envoi par organisation, via IEmailProvider (Demo* en
 * l'absence de fournisseur réel branché).
 */
export const MeetingNoteDistribution = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  organizationId: z.string().uuid(),
  channel: MeetingNoteDistributionChannel,
  sentAt: z.string().datetime(),
  sentByUserId: z.string().uuid(),
});
export type MeetingNoteDistribution = z.infer<typeof MeetingNoteDistribution>;

/** Accusé de réception d'un compte-rendu validé — une ligne par organisation, au plus une fois. */
export const MeetingNoteAcknowledgment = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  organizationId: z.string().uuid(),
  acknowledgedAt: z.string().datetime(),
  acknowledgedByUserId: z.string().uuid(),
});
export type MeetingNoteAcknowledgment = z.infer<typeof MeetingNoteAcknowledgment>;

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
