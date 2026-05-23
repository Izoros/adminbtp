import type {
  ConsultingHour,
  ConsultingMission,
  ExpertProfile,
  ExpertRequest,
  TechnicalReview,
} from "@/modules/consulting/types/consulting";

export const demoExpertProfiles: ExpertProfile[] = [
  {
    id: "expert_001",
    fullName: "Ingenieur BTP AdminBTP",
    role: "btp_engineer",
    headline: "Analyse technique chantier et dossier d'execution",
  },
  {
    id: "expert_002",
    fullName: "Architecte HMONP AdminBTP",
    role: "architect_hmonp",
    headline: "Lecture de plans, interfaces et conformite architecturale",
  },
];

export const demoExpertRequests: ExpertRequest[] = [
  {
    id: "expert_request_001",
    requestNumber: "ER-010",
    title: "Avis expert sur DOE lot CVC",
    relatedEntityType: "project",
    relatedEntityId: "project_001",
    assignedExpertId: "expert_001",
    status: "in_progress",
  },
];

export const demoConsultingMissions: ConsultingMission[] = [
  {
    id: "mission_001",
    missionNumber: "CM-010",
    expertRequestId: "expert_request_001",
    title: "Analyse DOE CVC et synthese de reserves",
    status: "in_progress",
    soldHours: 6,
    consumedHours: 3.5,
  },
];

export const demoConsultingHours: ConsultingHour[] = [
  {
    id: "hour_001",
    consultingMissionId: "mission_001",
    expertProfileId: "expert_001",
    workDate: "2026-05-21",
    hoursSpent: 2,
    billableHours: 2,
  },
  {
    id: "hour_002",
    consultingMissionId: "mission_001",
    expertProfileId: "expert_001",
    workDate: "2026-05-22",
    hoursSpent: 1.5,
    billableHours: 1.5,
  },
];

export const demoTechnicalReviews: TechnicalReview[] = [
  {
    id: "review_001",
    expertRequestId: "expert_request_001",
    consultingMissionId: "mission_001",
    reviewerExpertId: "expert_001",
    title: "Analyse DOE lot CVC",
    findings:
      "Le DOE reste incomplet sur les notices de maintenance et sur les schemas finaux de repérage.",
    recommendations:
      "Completer les notices techniques et valider les repérages definitifs avant cloture.",
    status: "ready_for_validation",
  },
];
