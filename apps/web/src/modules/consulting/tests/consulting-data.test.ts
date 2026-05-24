import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildEmptyConsultingDashboardData,
  buildDemoConsultingDashboardData,
  loadConsultingDashboardData,
  mapConsultingHourRow,
  mapConsultingMissionRow,
  mapExpertProfileRow,
  mapExpertRequestRow,
  mapTechnicalReviewRow,
  resolvePreferredOrganizationId,
  sanitizeExpertRequestDraft,
} from "@/modules/consulting/services/consulting-data";
import type { SupabaseDatabase } from "@/types/supabase";

type ConsultingTables = SupabaseDatabase["public"]["Tables"];
const loadServerOrganizationScopeMock = vi.fn();

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: (...args: unknown[]) =>
      loadServerOrganizationScopeMock(...args),
  };
});

describe("consulting-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replie proprement sur le jeu de demonstration", () => {
    const data = buildDemoConsultingDashboardData();

    expect(data.source).toBe("demo");
    expect(data.request?.requestNumber).toBe("ER-010");
    expect(data.missionHours).toHaveLength(2);
  });

  it("retourne un etat vide Supabase quand aucune demande n est visible", () => {
    const data = buildEmptyConsultingDashboardData("org_001");

    expect(data.source).toBe("supabase");
    expect(data.currentOrganizationId).toBe("org_001");
    expect(data.request).toBeNull();
  });

  it("mappe un profil expert Supabase vers le type metier", () => {
    const row: ConsultingTables["expert_profiles"]["Row"] = {
      id: "expert_123",
      bio: null,
      created_at: "2026-05-22T08:00:00.000Z",
      credentials: ["HMONP"],
      currency_code: "EUR",
      full_name: "Architecte Test",
      headline: null,
      hourly_rate_cents: 18000,
      internal_expert: true,
      is_active: true,
      organization_id: "org_001",
      role: "architect_hmonp",
      seniority_years: 12,
      slug: "architecte-test",
      specialties: ["interfaces", "plans"],
      updated_at: "2026-05-22T08:00:00.000Z",
    };

    expect(mapExpertProfileRow(row)).toEqual({
      id: "expert_123",
      fullName: "Architecte Test",
      role: "architect_hmonp",
      headline: "interfaces, plans",
    });
  });

  it("mappe la chaine complete consulting depuis les lignes Supabase", () => {
    const requestRow: ConsultingTables["expert_requests"]["Row"] = {
      assigned_expert_id: "expert_123",
      closed_at: null,
      company_name: "Client Test",
      created_at: "2026-05-22T08:00:00.000Z",
      delivery_mode: "hybrid",
      description: null,
      id: "request_123",
      intake_channel: "client_portal",
      organization_id: "org_001",
      priority: 2,
      qualified_at: null,
      related_entity_id: "project_321",
      related_entity_type: "project",
      request_number: "ER-321",
      request_type: "document_analysis",
      requested_by_email: "client@example.com",
      requested_by_name: "Client",
      requested_due_at: null,
      status: "assigned",
      title: "Analyse PPSPS",
      updated_at: "2026-05-22T08:00:00.000Z",
    };
    const missionRow: ConsultingTables["consulting_missions"]["Row"] = {
      billing_mode: "hourly",
      completed_at: null,
      consumed_hours: 2.5,
      created_at: "2026-05-22T08:00:00.000Z",
      currency_code: "EUR",
      description: null,
      due_at: null,
      expert_request_id: "request_123",
      fixed_fee_cents: null,
      hourly_rate_cents: 18000,
      id: "mission_123",
      lead_expert_id: "expert_123",
      mission_number: "CM-321",
      organization_id: "org_001",
      related_entity_id: "project_321",
      related_entity_type: "project",
      sold_hours: 5,
      started_at: null,
      status: "in_progress",
      title: "Mission PPSPS",
      updated_at: "2026-05-22T08:00:00.000Z",
    };
    const hourRow: ConsultingTables["consulting_hours"]["Row"] = {
      activity_type: "analyse_documentaire",
      billable_hours: 1.5,
      consulting_mission_id: "mission_123",
      created_at: "2026-05-22T08:00:00.000Z",
      expert_profile_id: "expert_123",
      hours_spent: 1.5,
      id: "hour_123",
      notes: null,
      related_entity_id: "document_001",
      related_entity_type: "document",
      updated_at: "2026-05-22T08:00:00.000Z",
      work_date: "2026-05-22",
    };
    const reviewRow: ConsultingTables["technical_reviews"]["Row"] = {
      consulting_mission_id: "mission_123",
      created_at: "2026-05-22T08:00:00.000Z",
      delivered_at: null,
      delivery_mode: "human",
      expert_request_id: "request_123",
      findings: "Quelques reserves persistent.",
      id: "review_123",
      organization_id: "org_001",
      recommendations: "Verifier les interfaces CVC.",
      related_entity_id: "document_001",
      related_entity_type: "document",
      review_number: "TR-321",
      review_type: "technical_review",
      reviewed_at: null,
      reviewer_expert_id: "expert_123",
      source_document_id: "document_001",
      source_document_type: "ppsps",
      status: "ready_for_validation",
      summary: "Analyse en attente de validation.",
      title: "Avis PPSPS",
      updated_at: "2026-05-22T08:00:00.000Z",
    };

    expect(mapExpertRequestRow(requestRow).requestNumber).toBe("ER-321");
    expect(mapConsultingMissionRow(missionRow).missionNumber).toBe("CM-321");
    expect(mapConsultingHourRow(hourRow).billableHours).toBe(1.5);
    expect(mapTechnicalReviewRow(reviewRow).status).toBe("ready_for_validation");
  });

  it("retient l organisation par defaut si elle est accessible", () => {
    expect(
      resolvePreferredOrganizationId(
        {
          created_at: "2026-05-22T08:00:00.000Z",
          default_organization_id: "org_scope_2",
          email: "expert@example.com",
          full_name: "Expert",
          id: "user_001",
          internal_role: "expert_consultant",
          updated_at: "2026-05-22T08:00:00.000Z",
        },
        ["org_scope_1", "org_scope_2"],
      ),
    ).toBe("org_scope_2");
  });

  it("normalise un brouillon de demande expert valable", () => {
    expect(
      sanitizeExpertRequestDraft({
        title: "  Analyse DOE  ",
        requestType: "doe_review",
        relatedEntityType: "project",
        relatedEntityId: " project_001 ",
        description: "  Controle des notices techniques ",
      }),
    ).toEqual({
      title: "Analyse DOE",
      requestType: "doe_review",
      relatedEntityType: "project",
      relatedEntityId: "project_001",
      description: "Controle des notices techniques",
    });
  });

  it("rejette un brouillon de demande sans titre ou type valide", () => {
    expect(
      sanitizeExpertRequestDraft({
        title: " ",
        requestType: "other",
      }),
    ).toBeNull();
    expect(
      sanitizeExpertRequestDraft({
        title: "Analyse",
        requestType: "invalide",
      }),
    ).toBeNull();
  });

  it("garde un etat Supabase vide quand l organisation courante ne contient encore aucune demande", async () => {
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_001", "org_002"],
      preferredOrganizationId: "org_001",
    });

    const supabase = {
      from(table: string) {
        if (table === "expert_profiles") {
          return {
            select: () => ({
              eq: async () => ({
                data: [],
                error: null,
              }),
            }),
          };
        }

        if (table === "expert_requests") {
          return {
            select: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        assigned_expert_id: "expert_123",
                        closed_at: null,
                        company_name: null,
                        created_at: "2026-05-23T08:00:00.000Z",
                        delivery_mode: "human",
                        description: null,
                        id: "request_org_002",
                        intake_channel: "platform",
                        organization_id: "org_002",
                        priority: 3,
                        qualified_at: null,
                        related_entity_id: "project_002",
                        related_entity_type: "project",
                        request_number: "ER-002",
                        request_type: "technical_question",
                        requested_by_email: null,
                        requested_by_name: null,
                        requested_due_at: null,
                        status: "submitted",
                        title: "Question sur autre organisation",
                        updated_at: "2026-05-23T08:00:00.000Z",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "consulting_missions") {
          return {
            select: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        billing_mode: "hourly",
                        completed_at: null,
                        consumed_hours: 2,
                        created_at: "2026-05-23T08:00:00.000Z",
                        currency_code: "EUR",
                        description: null,
                        due_at: null,
                        expert_request_id: "request_org_002",
                        fixed_fee_cents: null,
                        hourly_rate_cents: null,
                        id: "mission_org_002",
                        lead_expert_id: null,
                        mission_number: "CM-002",
                        organization_id: "org_002",
                        related_entity_id: "project_002",
                        related_entity_type: "project",
                        sold_hours: 4,
                        started_at: null,
                        status: "approved",
                        title: "Mission autre organisation",
                        updated_at: "2026-05-23T08:00:00.000Z",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "consulting_hours") {
          return {
            select: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        consulting_mission_id: "mission_org_002",
                        expert_profile_id: null,
                        work_date: "2026-05-23",
                        hours_spent: 2,
                        billable_hours: 2,
                        activity_type: null,
                        notes: null,
                        related_entity_type: null,
                        related_entity_id: null,
                        created_at: "2026-05-23T08:00:00.000Z",
                        updated_at: "2026-05-23T08:00:00.000Z",
                        consulting_missions: {
                          organization_id: "org_002",
                        },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "technical_reviews") {
          return {
            select: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        consulting_mission_id: "mission_org_002",
                        created_at: "2026-05-23T08:00:00.000Z",
                        delivered_at: null,
                        delivery_mode: "human",
                        expert_request_id: "request_org_002",
                        findings: "RAS",
                        id: "review_org_002",
                        organization_id: "org_002",
                        recommendations: "RAS",
                        related_entity_id: "project_002",
                        related_entity_type: "project",
                        review_number: "TR-002",
                        review_type: "technical_review",
                        reviewed_at: null,
                        reviewer_expert_id: null,
                        source_document_id: null,
                        source_document_type: null,
                        status: "draft",
                        summary: null,
                        title: "Avis autre organisation",
                        updated_at: "2026-05-23T08:00:00.000Z",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        throw new Error(`Table inattendue: ${table}`);
      },
    } as never;

    const data = await loadConsultingDashboardData(supabase);

    expect(data.source).toBe("supabase");
    expect(data.currentOrganizationId).toBe("org_001");
    expect(data.request).toBeNull();
    expect(data.mission).toBeNull();
    expect(data.missionHours).toEqual([]);
    expect(data.review).toBeNull();
  });

  it("retient la premiere organisation accessible quand aucune organisation preferee n est definie", async () => {
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_010", "org_020"],
      preferredOrganizationId: null,
    });

    const emptyResponse = async () => ({ data: [], error: null });
    const supabase = {
      from() {
        return {
          select: () => ({
            eq: emptyResponse,
            in: () => ({
              order: () => ({
                limit: emptyResponse,
              }),
            }),
          }),
        };
      },
    } as never;

    const data = await loadConsultingDashboardData(supabase);

    expect(data.source).toBe("supabase");
    expect(data.currentOrganizationId).toBe("org_010");
    expect(data.request).toBeNull();
  });
});
