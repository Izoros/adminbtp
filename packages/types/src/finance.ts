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
  /**
   * Coefficient d'actualisation — calculé seulement si une clause ACTUALISATION du marché est
   * `VALIDE` (voir market.ts) ; sinon ce champ reste vide et l'UI le dit, jamais une valeur par
   * défaut implicite.
   */
  actualizationCoefficient: z.number().positive().optional(),
  indexMonth: z.string().optional(), // "YYYY-MM", mois de l'indice utilisé pour l'actualisation
  retentionAmount: z.number().nonnegative().optional(),
  advanceRecovered: z.number().nonnegative().optional(),
  penaltiesAmount: z.number().nonnegative().optional(),
  netAmountHt: z.number().optional(), // montant net après retenue/avance/pénalités/actualisation
  /** Situation de solde (DGD) — le document DGD s'y rattache, pas un second workflow. */
  isFinal: z.boolean().default(false),
});
export type Situation = z.infer<typeof Situation>;

/** Ligne de décompte, rattachée à une ligne de prix du marché (voir market.ts). */
export const SituationLine = z.object({
  id: z.string().uuid(),
  situationId: z.string().uuid(),
  priceLineId: z.string().uuid(),
  quantityPrevious: z.number().nonnegative().default(0),
  quantityMonth: z.number(), // peut être négatif (régularisation)
  unitPriceHt: z.number().nonnegative(),
  amountHt: z.number(), // quantityMonth * unitPriceHt
});
export type SituationLine = z.infer<typeof SituationLine>;

/**
 * Ventilation optionnelle d'un décompte vers une organisation tierce (paiement direct
 * sous-traitant). Jamais créée si l'organisation bénéficiaire n'a pas de DC4/agrément de
 * sous-traitance `VALIDE` pour ce chantier — voir `has_valid_subcontractor_agreement()` côté base.
 */
export const SituationAllocation = z.object({
  id: z.string().uuid(),
  situationId: z.string().uuid(),
  payeeOrganizationId: z.string().uuid(),
  amountHt: z.number().nonnegative(),
  createdAt: z.string().datetime(),
});
export type SituationAllocation = z.infer<typeof SituationAllocation>;

/**
 * Avenant à un marché — une fois VALIDE, ses lignes de prix (price_lines.amendmentId) entrent
 * dans les décomptes suivants, distinctes du DPGF d'origine. Jamais de quantité supplémentaire
 * silencieuse sur une ligne de marché existante.
 */
export const AmendmentStatus = z.enum(["BROUILLON", "VALIDE", "REFUSE"]);
export type AmendmentStatus = z.infer<typeof AmendmentStatus>;

export const AMENDMENT_STATUS_LABELS: Record<AmendmentStatus, string> = {
  BROUILLON: "Brouillon",
  VALIDE: "Validé",
  REFUSE: "Refusé",
};

export const Amendment = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  number: z.number().int().positive(),
  reason: z.string().min(1),
  deltaHt: z.number(),
  status: AmendmentStatus,
  /** Entrée de journal citée comme motif — jamais générée automatiquement. */
  sourceLogEntryId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  validatedAt: z.string().datetime().optional(),
  validatedByUserId: z.string().uuid().optional(),
});
export type Amendment = z.infer<typeof Amendment>;

/** Trace d'une relance envoyée — une relance ne constitue jamais une signature électronique. */
export const ReminderLog = z.object({
  id: z.string().uuid(),
  situationId: z.string().uuid(),
  reminderRuleId: z.string().uuid().optional(),
  channel: z.enum(["EMAIL", "WHATSAPP", "COURRIER"]),
  sentAt: z.string().datetime(),
  createdByUserId: z.string().uuid().optional(),
});
export type ReminderLog = z.infer<typeof ReminderLog>;

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
