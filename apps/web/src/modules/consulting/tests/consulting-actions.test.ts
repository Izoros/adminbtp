import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  createConsultingMissionAction,
  createExpertRequestAction,
  initialConsultingMutationState,
  registerConsultingHourAction,
} from "@/modules/consulting/services/consulting-actions";
import type { ConsultingDashboardData } from "@/modules/consulting/services/consulting-data";

const createClientMock = vi.fn();
const loadServerOrganizationScopeMock = vi.fn();
const assertOrganizationAccessMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerOrganizationScope: (...args: unknown[]) =>
      loadServerOrganizationScopeMock(...args),
    assertOrganizationAccess: (...args: unknown[]) => assertOrganizationAccessMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const consultingData: ConsultingDashboardData = {
  source: "supabase",
  currentOrganizationId: "org_adminbtp_001",
  expertProfiles: [
    {
      id: "expert_001",
      fullName: "Alice Martin",
      role: "btp_engineer",
      headline: "Ingenieure BTP",
    },
  ],
  request: {
    id: "expert_request_001",
    requestNumber: "ER-001",
    title: "Analyse DOE lot facade",
    relatedEntityType: "project",
    relatedEntityId: "project_001",
    assignedExpertId: "expert_001",
    status: "submitted",
  },
  mission: null,
  missionHours: [],
  review: null,
};

const consultingDataWithMission: ConsultingDashboardData = {
  ...consultingData,
  mission: {
    id: "mission_001",
    missionNumber: "CM-001",
    expertRequestId: "expert_request_001",
    title: "Mission DOE facade",
    status: "approved",
    soldHours: 4,
    consumedHours: 1,
  },
};

describe("actions consulting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertOrganizationAccessMock.mockImplementation(() => undefined);
  });

  it("refuse la creation de demande si l'organisation sort du scope serveur", async () => {
    const formData = new FormData();
    formData.set("title", "Analyse DOE lot facade");
    formData.set("requestType", "document_analysis");
    formData.set("relatedEntityType", "project");
    formData.set("relatedEntityId", "project_001");
    formData.set("description", "Verifier la coherence des pieces DOE.");

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "expert@adminbtp.fr",
              user_metadata: {
                full_name: "Expert AdminBTP",
              },
            },
          },
          error: null,
        }),
      },
      from: vi.fn(),
    });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_autorisee"],
    });
    assertOrganizationAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "organization_access_denied",
        "Le scope serveur courant ne couvre pas cette organisation.",
      );
    });

    const result = await createExpertRequestAction(consultingData, formData);

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas cette organisation.",
    });
    expect(initialConsultingMutationState.status).toBe("idle");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("cree une mission de conseil a partir de la demande active", async () => {
    const requestMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "expert_request_001",
        organization_id: "org_adminbtp_001",
        related_entity_type: "project",
        related_entity_id: "project_001",
      },
      error: null,
    });
    const missionInsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "expert_requests") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: requestMaybeSingle,
              })),
            })),
          })),
        };
      }

      if (table === "consulting_missions") {
        return {
          insert: missionInsert,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const formData = new FormData();
    formData.set("title", "Mission DOE facade");
    formData.set("soldHours", "4");
    formData.set("leadExpertId", "expert_001");
    formData.set("description", "Mission issue de la demande DOE.");

    const result = await createConsultingMissionAction(consultingData, formData);

    expect(missionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org_adminbtp_001",
        expert_request_id: "expert_request_001",
        lead_expert_id: "expert_001",
        sold_hours: 4,
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Mission de conseil creee dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/consulting");
  });

  it("enregistre une heure de conseil et met a jour le cumul mission", async () => {
    const requestMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "expert_request_001",
        organization_id: "org_adminbtp_001",
      },
      error: null,
    });
    const missionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "mission_001",
        organization_id: "org_adminbtp_001",
        related_entity_type: "project",
        related_entity_id: "project_001",
        consumed_hours: 1,
        status: "approved",
        started_at: null,
      },
      error: null,
    });
    const hoursInsert = vi.fn().mockResolvedValue({ error: null });
    const missionUpdateEqOrganization = vi.fn().mockResolvedValue({ error: null });
    const missionUpdateEqId = vi.fn(() => ({
      eq: missionUpdateEqOrganization,
    }));
    const missionUpdate = vi.fn(() => ({
      eq: missionUpdateEqId,
    }));
    const from = vi.fn((table: string) => {
      if (table === "expert_requests") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: requestMaybeSingle,
              })),
            })),
          })),
        };
      }

      if (table === "consulting_missions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: missionMaybeSingle,
              })),
            })),
          })),
          update: missionUpdate,
        };
      }

      if (table === "consulting_hours") {
        return {
          insert: hoursInsert,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });

    const formData = new FormData();
    formData.set("workDate", "2026-05-23");
    formData.set("hoursSpent", "1.5");
    formData.set("billableHours", "1.25");
    formData.set("expertProfileId", "expert_001");
    formData.set("activityType", "analyse_documentaire");
    formData.set("notes", "Analyse DOE facade");

    const result = await registerConsultingHourAction(
      consultingDataWithMission,
      formData,
    );

    expect(hoursInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        consulting_mission_id: "mission_001",
        expert_profile_id: "expert_001",
        hours_spent: 1.5,
        billable_hours: 1.25,
      }),
    );
    expect(missionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        consumed_hours: 2.5,
        status: "in_progress",
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Heure de conseil enregistree dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/consulting");
  });
});
