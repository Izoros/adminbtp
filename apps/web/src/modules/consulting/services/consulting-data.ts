import type { SupabaseClient } from "@supabase/supabase-js";

import {
  loadServerOrganizationScope,
  resolvePreferredOrganizationId as resolveScopedPreferredOrganizationId,
} from "@/lib/permissions";
import {
  demoConsultingHours,
  demoConsultingMissions,
  demoExpertProfiles,
  demoExpertRequests,
  demoTechnicalReviews,
} from "@/modules/consulting/services/demo-consulting";
import {
  getConsultingJourneyState,
  getMissionByRequestId,
  getReviewForRequest,
} from "@/modules/consulting/services/consulting-flow";
import type {
  ConsultingHour,
  ConsultingMission,
  ExpertProfile,
  ExpertRequest,
  ExpertRequestType,
  TechnicalReview,
} from "@/modules/consulting/types/consulting";
import type { SupabaseDatabase } from "@/types/supabase";

type ConsultingTables = SupabaseDatabase["public"]["Tables"];
type ExpertProfileRow = ConsultingTables["expert_profiles"]["Row"];
type ExpertRequestRow = ConsultingTables["expert_requests"]["Row"];
type ConsultingMissionRow = ConsultingTables["consulting_missions"]["Row"];
type ConsultingHourRow = ConsultingTables["consulting_hours"]["Row"];
type TechnicalReviewRow = ConsultingTables["technical_reviews"]["Row"];
type UserProfileRow = ConsultingTables["user_profiles"]["Row"];

export type ConsultingDashboardData = {
  source: "demo" | "supabase";
  currentOrganizationId: string | null;
  expertProfiles: ExpertProfile[];
  request: ExpertRequest | null;
  mission: ConsultingMission | null;
  missionHours: ConsultingHour[];
  review: TechnicalReview | null;
};

export type ExpertRequestDraft = {
  title: string;
  requestType: ExpertRequestType;
  relatedEntityType: string;
  relatedEntityId: string | null;
  description: string | null;
};

export const expertRequestTypeOptions: Array<{
  value: ExpertRequestType;
  label: string;
}> = [
  { value: "technical_question", label: "Question technique" },
  { value: "document_analysis", label: "Analyse documentaire" },
  { value: "methodology_review", label: "Avis methodologie" },
  { value: "doe_review", label: "Analyse DOE" },
  { value: "exe_review", label: "Analyse EXE" },
  { value: "ppsps_review", label: "Analyse PPSPS" },
  { value: "tender_support", label: "Appel d'offres" },
  { value: "regulatory_support", label: "Reglementaire" },
  { value: "architectural_support", label: "Architectural" },
  { value: "project_management_support", label: "Maitrise d'oeuvre" },
  { value: "tce_support", label: "Entreprise TCE" },
  { value: "moa_support", label: "Assistance MOA" },
  { value: "other", label: "Autre" },
];

function isExpertRequestType(value: string): value is ExpertRequestType {
  return expertRequestTypeOptions.some((option) => option.value === value);
}

export function resolvePreferredOrganizationId(
  profile: UserProfileRow | null,
  organizationIds: string[],
): string | null {
  return resolveScopedPreferredOrganizationId(profile, organizationIds);
}

export function mapExpertProfileRow(row: ExpertProfileRow): ExpertProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    headline:
      row.headline ??
      (row.specialties.length > 0
        ? row.specialties.join(", ")
        : row.role.replaceAll("_", " ")),
  };
}

export function mapExpertRequestRow(row: ExpertRequestRow): ExpertRequest {
  return {
    id: row.id,
    requestNumber: row.request_number ?? "demande_sans_numero",
    title: row.title ?? "Demande d'expertise",
    relatedEntityType: row.related_entity_type ?? "unknown",
    relatedEntityId: row.related_entity_id ?? "non_renseigne",
    assignedExpertId: row.assigned_expert_id ?? "",
    status: row.status,
  };
}

export function mapConsultingMissionRow(row: ConsultingMissionRow): ConsultingMission {
  return {
    id: row.id,
    missionNumber: row.mission_number ?? "mission_sans_numero",
    expertRequestId: row.expert_request_id ?? "demande_non_renseignee",
    title: row.title ?? "Mission de conseil",
    status: row.status,
    soldHours: row.sold_hours ?? 0,
    consumedHours: row.consumed_hours ?? 0,
  };
}

export function mapConsultingHourRow(row: ConsultingHourRow): ConsultingHour {
  return {
    id: row.id,
    consultingMissionId: row.consulting_mission_id,
    expertProfileId: row.expert_profile_id ?? "expert_non_renseigne",
    workDate: row.work_date,
    hoursSpent: row.hours_spent,
    billableHours: row.billable_hours,
  };
}

export function mapTechnicalReviewRow(row: TechnicalReviewRow): TechnicalReview {
  return {
    id: row.id,
    expertRequestId: row.expert_request_id ?? "demande_non_renseignee",
    consultingMissionId: row.consulting_mission_id ?? "",
    reviewerExpertId: row.reviewer_expert_id ?? "",
    title: row.title ?? "Avis technique",
    findings: row.findings ?? row.summary ?? "",
    recommendations: row.recommendations ?? "",
    status: row.status,
  };
}

export function sanitizeExpertRequestDraft(input: {
  title?: string | null;
  requestType?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  description?: string | null;
}): ExpertRequestDraft | null {
  const title = input.title?.trim();
  const requestType = input.requestType?.trim();

  if (!title || !requestType || !isExpertRequestType(requestType)) {
    return null;
  }

  return {
    title,
    requestType,
    relatedEntityType: input.relatedEntityType?.trim() || "project",
    relatedEntityId: input.relatedEntityId?.trim() || null,
    description: input.description?.trim() || null,
  };
}

export function buildDemoConsultingDashboardData(): ConsultingDashboardData {
  const request = demoExpertRequests[0]!;
  const journey = getConsultingJourneyState(
    request,
    demoConsultingMissions,
    demoConsultingHours,
    demoTechnicalReviews,
  );

  return {
    source: "demo",
    currentOrganizationId: "org_adminbtp_001",
    expertProfiles: demoExpertProfiles,
    request,
    mission: journey.mission,
    missionHours: journey.missionHours,
    review: journey.review,
  };
}

export function buildEmptyConsultingDashboardData(
  currentOrganizationId: string | null,
  expertProfiles: ExpertProfile[] = [],
): ConsultingDashboardData {
  return {
    source: "supabase",
    currentOrganizationId,
    expertProfiles,
    request: null,
    mission: null,
    missionHours: [],
    review: null,
  };
}

function resolveCurrentOrganizationId(input: {
  preferredOrganizationId: string | null;
  accessibleOrganizationIds: string[];
}) {
  return input.preferredOrganizationId ?? input.accessibleOrganizationIds[0] ?? null;
}

function buildSupabaseConsultingDashboardData(
  currentOrganizationId: string | null,
  expertProfiles: ExpertProfile[],
  requests: ExpertRequest[],
  missions: ConsultingMission[],
  hours: ConsultingHour[],
  reviews: TechnicalReview[],
): ConsultingDashboardData {
  const request = requests[0];

  if (!request) {
    return buildEmptyConsultingDashboardData(currentOrganizationId, expertProfiles);
  }

  const mission = getMissionByRequestId(missions, request.id);

  return {
    source: "supabase",
    currentOrganizationId,
    expertProfiles,
    request,
    mission,
    missionHours: mission
      ? hours.filter((hour) => hour.consultingMissionId === mission.id)
      : [],
    review: getReviewForRequest(reviews, request.id),
  };
}

export async function loadConsultingDashboardData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
): Promise<ConsultingDashboardData> {
  if (!supabase) {
    return buildDemoConsultingDashboardData();
  }

  try {
    const userScope = await loadServerOrganizationScope(supabase);

    if (!userScope) {
      return buildDemoConsultingDashboardData();
    }

    const [
      { data: expertProfileRows, error: expertProfilesError },
      { data: requestRows, error: requestsError },
      { data: missionRows, error: missionsError },
      { data: hourRows, error: hoursError },
      { data: reviewRows, error: reviewsError },
    ] = await Promise.all([
      supabase.from("expert_profiles").select("*").eq("is_active", true),
      supabase
        .from("expert_requests")
        .select("*")
        .in("organization_id", userScope.accessibleOrganizationIds)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("consulting_missions")
        .select("*")
        .in("organization_id", userScope.accessibleOrganizationIds)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("consulting_hours")
        .select("*, consulting_missions!inner(organization_id)")
        .in("consulting_missions.organization_id", userScope.accessibleOrganizationIds)
        .order("work_date", { ascending: false })
        .limit(80),
      supabase
        .from("technical_reviews")
        .select("*")
        .in("organization_id", userScope.accessibleOrganizationIds)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    if (
      expertProfilesError ||
      requestsError ||
      missionsError ||
      hoursError ||
      reviewsError
    ) {
      return buildDemoConsultingDashboardData();
    }

    const currentOrganizationId = resolveCurrentOrganizationId({
      preferredOrganizationId: userScope.preferredOrganizationId,
      accessibleOrganizationIds: userScope.accessibleOrganizationIds,
    });

    const expertProfiles = (expertProfileRows ?? [])
      .filter(
        (row) =>
          row.organization_id === null ||
          userScope.accessibleOrganizationIds.includes(row.organization_id),
      )
      .map(mapExpertProfileRow);

    const scopedRequestRows = currentOrganizationId
      ? (requestRows ?? []).filter((row) => row.organization_id === currentOrganizationId)
      : requestRows ?? [];
    const scopedMissionRows = currentOrganizationId
      ? (missionRows ?? []).filter((row) => row.organization_id === currentOrganizationId)
      : missionRows ?? [];
    const scopedReviewRows = currentOrganizationId
      ? (reviewRows ?? []).filter((row) => row.organization_id === currentOrganizationId)
      : reviewRows ?? [];
    const scopedMissionIds = new Set(scopedMissionRows.map((row) => row.id));
    const scopedHourRows = (hourRows ?? []).filter((row) =>
      scopedMissionIds.has((row as ConsultingHourRow).consulting_mission_id),
    );

    const requests = scopedRequestRows.map(mapExpertRequestRow);
    const missions = scopedMissionRows.map(mapConsultingMissionRow);
    const hours = scopedHourRows.map((row) => mapConsultingHourRow(row as ConsultingHourRow));
    const reviews = scopedReviewRows.map(mapTechnicalReviewRow);

    return buildSupabaseConsultingDashboardData(
      currentOrganizationId,
      expertProfiles,
      requests,
      missions,
      hours,
      reviews,
    );
  } catch {
    return buildDemoConsultingDashboardData();
  }
}
