import { z } from "zod";

/**
 * Moteur de phases commun et configurable — ne pas dupliquer un système par profil métier.
 * Un PhaseTemplate décrit une étape réutilisable (ex: "APD", "EXE", "DOE"). Un même template
 * peut être rattaché à plusieurs "familles" de mission (MOE, TCE, MOA...) via PhaseTemplateSet.
 * Les instances sur un chantier réel (PhaseInstance) peuvent se chevaucher : "conditions de
 * passage" sont déclaratives (dépendances), pas une machine à états strictement séquentielle.
 */
export const PhaseTemplate = z.object({
  id: z.string().uuid(),
  code: z.string().min(1), // ex: "APD", "DCE", "EXE", "DOE", "DGD"
  label: z.string().min(1),
  description: z.string().optional(),
  defaultDurationDays: z.number().int().positive().optional(),
});
export type PhaseTemplate = z.infer<typeof PhaseTemplate>;

/**
 * Regroupement ordonné (mais non strictement imposé) de PhaseTemplate pour une famille
 * de mission donnée. Exemples attendus (à vérifier/ajuster avec l'ingénieur BTP) :
 * - MOE: ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR
 * - TCE: CONSULTATION, ATTRIBUTION, PREPARATION, EXE, TRAVAUX, RECEPTION, DOE, DGD, GPA
 * - MOA: PROGRAMMATION, FINANCEMENT, ETUDES, CONSULTATION, EXECUTION, RECEPTION, EXPLOITATION
 */
export const PhaseTemplateSet = z.object({
  id: z.string().uuid(),
  missionFamily: z.string().min(1), // libre pour rester configurable (ex: "MOE", "TCE", "MOA")
  label: z.string().min(1),
  phaseTemplateIds: z.array(z.string().uuid()),
});
export type PhaseTemplateSet = z.infer<typeof PhaseTemplateSet>;

export const PhaseInstanceStatus = z.enum([
  "A_VENIR",
  "EN_COURS",
  "EN_ATTENTE_VALIDATION",
  "VALIDEE",
  "BLOQUEE",
  "ANNULEE",
]);
export type PhaseInstanceStatus = z.infer<typeof PhaseInstanceStatus>;

export const ChecklistItem = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  done: z.boolean().default(false),
  responsibleUserId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
});
export type ChecklistItem = z.infer<typeof ChecklistItem>;

/** Instance réelle d'une phase sur un chantier. */
export const PhaseInstance = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  phaseTemplateId: z.string().uuid(),
  status: PhaseInstanceStatus,
  startDate: z.string().date().optional(),
  endDateTarget: z.string().date().optional(),
  endDateActual: z.string().date().optional(),
  responsibleUserId: z.string().uuid().optional(),
  checklist: z.array(ChecklistItem).default([]),
  expectedDocumentTypes: z.array(z.string()).default([]), // ex: ["DOE", "PV_RECEPTION"]
  dependsOnPhaseInstanceIds: z.array(z.string().uuid()).default([]), // conditions de passage
});
export type PhaseInstance = z.infer<typeof PhaseInstance>;
