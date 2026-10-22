import { z } from "zod";

/**
 * Pièces de marché structurées — préparation à l'extraction OCR (voir `@adminbtp/integrations`,
 * adaptateur `IOcrProvider`, implémentation `DemoOcrProvider` sans I/O réseau). L'extraction
 * écrit des clauses et des lignes de prix en statut `EXTRAIT` ; tant qu'elles ne sont pas
 * `VALIDE` par un humain, aucun calcul de décompte ni de `dueDate` ne s'y fie.
 */
export const ExtractionStatus = z.enum(["EXTRAIT", "VALIDE", "REJETE"]);
export type ExtractionStatus = z.infer<typeof ExtractionStatus>;

export const EXTRACTION_STATUS_LABELS: Record<ExtractionStatus, string> = {
  EXTRAIT: "Extrait (à valider)",
  VALIDE: "Validé",
  REJETE: "Rejeté",
};

export const MarketContractType = z.enum(["PRIVE", "PUBLIC"]);
export type MarketContractType = z.infer<typeof MarketContractType>;

export const MARKET_CONTRACT_TYPE_LABELS: Record<MarketContractType, string> = {
  PRIVE: "Marché privé",
  PUBLIC: "Marché public",
};

/**
 * Jamais de délai/retenue par défaut implicite : `paymentTermDays` reste `undefined` tant qu'il
 * n'a pas été saisi ou extrait et validé depuis les clauses du marché — aucune échéance
 * réglementaire codée en dur.
 */
export const MarketContract = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  contractType: MarketContractType,
  priceReferenceMonth: z.string().optional(), // "YYYY-MM", mois de référence des prix du marché
  retentionGuaranteeRate: z.number().min(0).max(1).optional(), // taux, ex: 0.05
  paymentTermDays: z.number().int().positive().optional(),
  /** Assiette de la retenue de garantie — vide tant que non définie, jamais déduite implicitement. */
  retentionBasisAmountHt: z.number().nonnegative().optional(),
  retentionReleaseDueOn: z.string().date().optional(),
  retentionSubstitutedByCaution: z.boolean().default(false),
  cautionDocumentId: z.string().uuid().optional(),
  /** Montant d'avance forfaitaire versé — la récupération cumulée est portée par les situations. */
  advanceAmountHt: z.number().nonnegative().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MarketContract = z.infer<typeof MarketContract>;

export const MarketClauseKind = z.enum([
  "DELAI_PAIEMENT",
  "RETENUE_GARANTIE",
  "ACTUALISATION",
  "PENALITE",
  "AVANCE",
  "AUTRE",
]);
export type MarketClauseKind = z.infer<typeof MarketClauseKind>;

export const MARKET_CLAUSE_KIND_LABELS: Record<MarketClauseKind, string> = {
  DELAI_PAIEMENT: "Délai de paiement",
  RETENUE_GARANTIE: "Retenue de garantie",
  ACTUALISATION: "Actualisation",
  PENALITE: "Pénalité",
  AVANCE: "Avance",
  AUTRE: "Autre",
};

export const MarketClause = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  kind: MarketClauseKind,
  payload: z.record(z.string(), z.unknown()).default({}),
  status: ExtractionStatus,
  sourceDocumentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MarketClause = z.infer<typeof MarketClause>;

export const PriceLineOrigin = z.enum(["SAISIE", "IMPORT_OCR"]);
export type PriceLineOrigin = z.infer<typeof PriceLineOrigin>;

export const PRICE_LINE_ORIGIN_LABELS: Record<PriceLineOrigin, string> = {
  SAISIE: "Saisie manuelle",
  IMPORT_OCR: "Import OCR",
};

export const PriceLine = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  code: z.string().min(1), // code DPGF/BPU
  label: z.string().min(1),
  unit: z.string().min(1),
  quantityMarket: z.number().nonnegative(),
  unitPriceHt: z.number().nonnegative(),
  origin: PriceLineOrigin,
  status: ExtractionStatus,
  /** Si issue d'un avenant VALIDE — distincte du DPGF d'origine, jamais une quantité ajoutée en silence. */
  amendmentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PriceLine = z.infer<typeof PriceLine>;
