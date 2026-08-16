import type { ProjectRole } from "@/modules/projects/types/project";
import type {
  PhaseChecklistItem,
  PhaseProfile,
  PhaseStatus,
  ProjectPhase,
} from "@/modules/phases/types/project-phase";

const roleToProfile: Record<ProjectRole, PhaseProfile | null> = {
  moa: "moa",
  moe: "moe",
  tce: "tce",
  bet: null,
  opc: "opc",
  amo: null,
  trade_contractor: "trade_contractor",
  subcontractor: "trade_contractor",
};

export function getPhaseProfileFromProjectRole(role: ProjectRole) {
  return roleToProfile[role];
}

export function getChecklistForPhase(
  phaseId: string,
  checklistItems: PhaseChecklistItem[],
) {
  return checklistItems.filter((item) => item.phaseId === phaseId);
}

export function canTransitionPhaseToCompleted(
  phaseId: string,
  checklistItems: PhaseChecklistItem[],
) {
  return getChecklistForPhase(phaseId, checklistItems)
    .filter((item) => item.isRequired)
    .every((item) => item.isCompleted);
}

export function getPhasesForProfile(
  profile: PhaseProfile,
  phases: ProjectPhase[],
) {
  return phases
    .filter((phase) => phase.profile === profile)
    .sort((left, right) => left.sequenceNumber - right.sequenceNumber);
}

export function getRecommendedNextStatus(
  phaseId: string,
  currentStatus: PhaseStatus,
  checklistItems: PhaseChecklistItem[],
) {
  if (currentStatus === "completed") {
    return "completed";
  }

  return canTransitionPhaseToCompleted(phaseId, checklistItems)
    ? "completed"
    : "blocked";
}
