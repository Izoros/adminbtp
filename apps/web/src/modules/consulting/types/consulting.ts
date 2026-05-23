export type ExpertRole =
  | "btp_engineer"
  | "architect_hmonp"
  | "regulatory_consultant"
  | "project_management_consultant"
  | "tce_support"
  | "moa_support"
  | "other";

export type ExpertRequestStatus =
  | "draft"
  | "submitted"
  | "qualified"
  | "assigned"
  | "in_progress"
  | "waiting_for_documents"
  | "waiting_for_client"
  | "completed"
  | "cancelled";

export type ExpertRequestType =
  | "technical_question"
  | "document_analysis"
  | "methodology_review"
  | "doe_review"
  | "exe_review"
  | "ppsps_review"
  | "tender_support"
  | "regulatory_support"
  | "architectural_support"
  | "project_management_support"
  | "tce_support"
  | "moa_support"
  | "other";

export type ConsultingMissionStatus =
  | "draft"
  | "quoted"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "invoiced";

export type ReviewStatus =
  | "draft"
  | "in_progress"
  | "ready_for_validation"
  | "validated"
  | "sent"
  | "archived";

export type ExpertProfile = {
  id: string;
  fullName: string;
  role: ExpertRole;
  headline: string;
};

export type ExpertRequest = {
  id: string;
  requestNumber: string;
  title: string;
  relatedEntityType: string;
  relatedEntityId: string;
  assignedExpertId: string;
  status: ExpertRequestStatus;
};

export type ConsultingMission = {
  id: string;
  missionNumber: string;
  expertRequestId: string;
  title: string;
  status: ConsultingMissionStatus;
  soldHours: number;
  consumedHours: number;
};

export type ConsultingHour = {
  id: string;
  consultingMissionId: string;
  expertProfileId: string;
  workDate: string;
  hoursSpent: number;
  billableHours: number;
};

export type TechnicalReview = {
  id: string;
  expertRequestId: string;
  consultingMissionId: string;
  reviewerExpertId: string;
  title: string;
  findings: string;
  recommendations: string;
  status: ReviewStatus;
};
