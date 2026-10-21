import { z } from "zod";

/**
 * Suivi financier d'un chantier (situations/décomptes). Les règles de relance sont
 * configurables par contrat/marché — ne jamais coder en dur des échéances réglementaires.
 */
export const PaymentStatus = z.enum([
  "A_ETABLIR",
  "TRANSMIS",
  "EN_VERIFICATION",
  "ACCEPTE",
  "CONTESTE",
  "PAYE",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  A_ETABLIR: "À établir",
  TRANSMIS: "Transmis",
  EN_VERIFICATION: "En vérification",
  ACCEPTE: "Accepté",
  CONTESTE: "Contesté",
  PAYE: "Payé",
};

export const Situation = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  number: z.number().int().positive(),
  amountHt: z.number().nonnegative(),
  status: PaymentStatus,
  submittedAt: z.string().date().optional(),
  dueDate: z.string().date().optional(), // calculée selon les clauses du marché, pas codée en dur
  paidAt: z.string().date().optional(),
  disputeReason: z.string().optional(),
});
export type Situation = z.infer<typeof Situation>;

/** Règle de relance configurable, rattachée à un contrat/marché plutôt qu'à la loi générale. */
export const ReminderRule = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  appliesToContractType: z.string(), // ex: "marché privé", "marché public"
  daysAfterDue: z.number().int(),
  channel: z.enum(["EMAIL", "WHATSAPP", "COURRIER"]),
  templateId: z.string().uuid().optional(),
});
export type ReminderRule = z.infer<typeof ReminderRule>;
