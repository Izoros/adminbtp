import { z } from "zod";

/**
 * Bureaux de mission (OPC, CT, SPS, BET) — voir docs/ROADMAP.md (Tranche E). Même moteur que le
 * reste du chantier : pas d'application séparée, pas de domaine, pas de déploiement distinct.
 */

/**
 * Note de coordination OPC par lot — une consigne courte par semaine, jamais un moteur de
 * planning (pas de Gantt, pas de CPM).
 */
export const LotScheduleNote = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  week: z.string().date(),
  note: z.string().min(1),
  needsLotId: z.string().uuid().optional(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type LotScheduleNote = z.infer<typeof LotScheduleNote>;

export const TechnicalOpinionIssuerRole = z.enum(["CT", "SPS", "BET", "CSSI"]);
export type TechnicalOpinionIssuerRole = z.infer<typeof TechnicalOpinionIssuerRole>;

export const TECHNICAL_OPINION_ISSUER_ROLE_LABELS: Record<TechnicalOpinionIssuerRole, string> = {
  CT: "Contrôleur technique",
  SPS: "Coordonnateur SPS",
  BET: "Bureau d'études techniques",
  CSSI: "Coordonnateur SSI",
};

export const TechnicalOpinionKind = z.enum(["AVIS", "VISITE", "OBSERVATION"]);
export type TechnicalOpinionKind = z.infer<typeof TechnicalOpinionKind>;

export const TECHNICAL_OPINION_KIND_LABELS: Record<TechnicalOpinionKind, string> = {
  AVIS: "Avis",
  VISITE: "Visite",
  OBSERVATION: "Observation",
};

export const TechnicalOpinionVerdict = z.enum([
  "FAVORABLE",
  "FAVORABLE_AVEC_OBSERVATIONS",
  "SUSPENDU",
  "DEFAVORABLE",
]);
export type TechnicalOpinionVerdict = z.infer<typeof TechnicalOpinionVerdict>;

export const TECHNICAL_OPINION_VERDICT_LABELS: Record<TechnicalOpinionVerdict, string> = {
  FAVORABLE: "Favorable",
  FAVORABLE_AVEC_OBSERVATIONS: "Favorable avec observations",
  SUSPENDU: "Suspendu",
  DEFAVORABLE: "Défavorable",
};

export const TechnicalOpinionStatus = z.enum(["BROUILLON", "EMIS"]);
export type TechnicalOpinionStatus = z.infer<typeof TechnicalOpinionStatus>;

export const TECHNICAL_OPINION_STATUS_LABELS: Record<TechnicalOpinionStatus, string> = {
  BROUILLON: "Brouillon",
  EMIS: "Émis",
};

/**
 * Avis technique CT/SPS/BET/CSSI. Un avis CT SUSPENDU ou DEFAVORABLE s'affiche sur l'écran de
 * visa MOE sans jamais bloquer le visa : la MOE tranche, la mention reste visible. Les
 * observations SPS ne créent jamais de ReserveItem ; le SPS peut lier une observation au PPSPS du
 * lot, jamais en changer le statut. Le rôle de l'émetteur (issuerRole) est vérifié côté Server
 * Action via site_participants, pas par une policy RLS.
 */
export const TechnicalOpinion = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  issuerOrganizationId: z.string().uuid(),
  issuerRole: TechnicalOpinionIssuerRole,
  kind: TechnicalOpinionKind,
  verdict: TechnicalOpinionVerdict.optional(),
  text: z.string().min(1),
  status: TechnicalOpinionStatus,
  createdByUserId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type TechnicalOpinion = z.infer<typeof TechnicalOpinion>;
