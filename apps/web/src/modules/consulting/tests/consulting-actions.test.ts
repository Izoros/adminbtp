import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  createExpertRequestAction,
  initialConsultingMutationState,
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
  currentOrganizationId: "org_hors_scope",
  expertProfiles: [],
  request: null,
  mission: null,
  missionHours: [],
  review: null,
};

describe("actions consulting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse la creation si l'organisation sort du scope serveur", async () => {
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
});
