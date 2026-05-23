import type {
  PhaseAlert,
  PhaseChecklistItem,
  ProjectPhase,
} from "@/modules/phases/types/project-phase";

export const demoProjectPhases: ProjectPhase[] = [
  {
    id: "phase_moe_001",
    projectId: "project_001",
    profile: "moe",
    code: "moe-visa-exe",
    title: "Visa EXE",
    description: "Controle des pieces d'execution et gestion des interfaces techniques.",
    sequenceNumber: 1,
    status: "in_progress",
  },
  {
    id: "phase_moa_001",
    projectId: "project_001",
    profile: "moa",
    code: "moa-validation-budget",
    title: "Validation budgetaire",
    description: "Arbitrages budgetaires et validation des engagements du chantier.",
    sequenceNumber: 1,
    status: "ready_for_review",
  },
  {
    id: "phase_tce_001",
    projectId: "project_001",
    profile: "tce",
    code: "tce-preparation-situation",
    title: "Preparation situation",
    description: "Consolidation des avances chantier et pieces de situation.",
    sequenceNumber: 2,
    status: "blocked",
  },
  {
    id: "phase_trade_001",
    projectId: "project_001",
    profile: "trade_contractor",
    code: "lot-remise-documents",
    title: "Remise documents lot",
    description: "Depot des documents d'execution et validation des interfaces de lot.",
    sequenceNumber: 2,
    status: "in_progress",
  },
];

export const demoPhaseChecklistItems: PhaseChecklistItem[] = [
  { id: "check_001", phaseId: "phase_moe_001", label: "Plans EXE recupérés", isRequired: true, isCompleted: true },
  { id: "check_002", phaseId: "phase_moe_001", label: "Interfaces CVC / elec validees", isRequired: true, isCompleted: false },
  { id: "check_003", phaseId: "phase_moa_001", label: "Tableau budget mis a jour", isRequired: true, isCompleted: true },
  { id: "check_004", phaseId: "phase_moa_001", label: "Decision de validation formalisee", isRequired: true, isCompleted: true },
  { id: "check_005", phaseId: "phase_tce_001", label: "Pieces sous-traitants recues", isRequired: true, isCompleted: false },
  { id: "check_006", phaseId: "phase_tce_001", label: "Base situation consolidee", isRequired: true, isCompleted: true },
  { id: "check_007", phaseId: "phase_trade_001", label: "Fiches techniques deposees", isRequired: true, isCompleted: true },
  { id: "check_008", phaseId: "phase_trade_001", label: "Validation interface recue", isRequired: true, isCompleted: false },
];

export const demoPhaseAlerts: PhaseAlert[] = [
  {
    id: "alert_001",
    phaseId: "phase_tce_001",
    severity: "high",
    title: "Document sous-traitant manquant",
    message: "Le dossier administratif du sous-traitant principal reste incomplet.",
    isResolved: false,
  },
  {
    id: "alert_002",
    phaseId: "phase_moe_001",
    severity: "medium",
    title: "Interface technique a arbitrer",
    message: "Un arbitrage reste a rendre entre lots pour la gaine principale.",
    isResolved: false,
  },
];
