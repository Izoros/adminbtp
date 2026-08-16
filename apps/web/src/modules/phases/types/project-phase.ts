export type PhaseProfile = "moe" | "moa" | "tce" | "trade_contractor" | "opc";

export type PhaseStatus =
  "not_started" | "in_progress" | "blocked" | "ready_for_review" | "completed";

export type AlertSeverity = "low" | "medium" | "high";

export type ProjectPhase = {
  id: string;
  projectId: string;
  profile: PhaseProfile;
  code: string;
  title: string;
  description: string;
  sequenceNumber: number;
  status: PhaseStatus;
};

export type PhaseChecklistItem = {
  id: string;
  phaseId: string;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
};

export type PhaseAlert = {
  id: string;
  phaseId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  isResolved: boolean;
};
