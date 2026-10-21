import { z } from "zod";

/** Boîte mail générique rattachée à une société cliente (ex: madaterrassement@adminbtp.yt). */
export const MailAddress = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  address: z.string().email(),
  label: z.string().min(1),
  siteId: z.string().uuid().optional(), // alias dédié à un chantier
  isActive: z.boolean().default(true),
});
export type MailAddress = z.infer<typeof MailAddress>;

export const MailUrgency = z.enum(["NORMALE", "URGENTE", "CRITIQUE"]);
export type MailUrgency = z.infer<typeof MailUrgency>;

export const MailStatus = z.enum([
  "NON_TRAITE",
  "AFFECTE",
  "BROUILLON_PRET",
  "EN_VALIDATION",
  "REPONDU",
  "CLOTURE",
]);
export type MailStatus = z.infer<typeof MailStatus>;

export const MAIL_STATUS_LABELS: Record<MailStatus, string> = {
  NON_TRAITE: "Non traité",
  AFFECTE: "Affecté",
  BROUILLON_PRET: "Brouillon prêt",
  EN_VALIDATION: "En validation",
  REPONDU: "Répondu",
  CLOTURE: "Clôturé",
};

export const MAIL_URGENCY_LABELS: Record<MailUrgency, string> = {
  NORMALE: "Normale",
  URGENTE: "Urgente",
  CRITIQUE: "Critique",
};

export const MailThread = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  mailAddressId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  subject: z.string(),
  fromAddress: z.string().email(),
  status: MailStatus,
  urgency: MailUrgency,
  assignedUserId: z.string().uuid().optional(),
  lastMessageAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type MailThread = z.infer<typeof MailThread>;
