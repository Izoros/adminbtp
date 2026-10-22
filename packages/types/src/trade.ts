import { z } from "zod";

/**
 * Référentiel plateforme des corps d'état du BTP — partagé entre toutes les organisations,
 * pas de données client ici. `family` est un regroupement de présentation au-dessus des 16 codes
 * (utile pour filtrer dans l'UI), distinct du code lui-même.
 */
export const TradeFamily = z.enum([
  "STRUCTURE_VRD",
  "TECHNIQUE",
  "ETANCHEITE_FACADE",
  "FINITIONS",
]);
export type TradeFamily = z.infer<typeof TradeFamily>;

export const TRADE_FAMILY_LABELS: Record<TradeFamily, string> = {
  STRUCTURE_VRD: "Structure et VRD",
  TECHNIQUE: "Lots techniques",
  ETANCHEITE_FACADE: "Étanchéité et façade",
  FINITIONS: "Finitions",
};

export const TradeCode = z.object({
  id: z.string().uuid(),
  code: z.string().min(1), // ex: "GO", "CVC", "ELEC"
  label: z.string().min(1),
  family: TradeFamily,
});
export type TradeCode = z.infer<typeof TradeCode>;

/** Métiers pratiqués par une organisation — pré-filtre de modèles/lots, ne crée aucun droit. */
export const OrganizationTrade = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  tradeCodeId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});
export type OrganizationTrade = z.infer<typeof OrganizationTrade>;
