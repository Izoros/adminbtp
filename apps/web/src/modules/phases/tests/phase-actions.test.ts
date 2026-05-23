import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScopeGuardError } from "@/lib/permissions";
import {
  resolvePhaseAlertAction,
  togglePhaseChecklistItemAction,
  updateProjectPhaseStatusAction,
} from "@/modules/phases/services/phase-actions";

const createClientMock = vi.fn();
const loadServerOrganizationScopeMock = vi.fn();
const loadServerProjectScopeMock = vi.fn();
const assertProjectAccessMock = vi.fn();
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
    loadServerProjectScope: (...args: unknown[]) => loadServerProjectScopeMock(...args),
    assertProjectAccess: (...args: unknown[]) => assertProjectAccessMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

describe("actions phases chantier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadServerOrganizationScopeMock.mockResolvedValue({
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });
    loadServerProjectScopeMock.mockResolvedValue({
      memberships: [
        {
          projectId: "project_001",
          organizationId: "org_adminbtp_001",
          role: "moe",
          isLead: true,
        },
      ],
      accessibleProjectIds: ["project_001"],
      accessibleOrganizationIds: ["org_adminbtp_001"],
    });
    assertProjectAccessMock.mockImplementation(() => undefined);
  });

  it("met a jour une checklist de phase dans Supabase", async () => {
    const checklistMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "check_001",
        phase_id: "phase_001",
      },
      error: null,
    });
    const phaseMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "phase_001",
        project_id: "project_001",
        status: "in_progress",
      },
      error: null,
    });
    const checklistUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const checklistUpdate = vi.fn(() => ({
      eq: checklistUpdateEq,
    }));
    const from = vi.fn((table: string) => {
      if (table === "phase_checklist_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: checklistMaybeSingle,
            })),
          })),
          update: checklistUpdate,
        };
      }

      if (table === "project_phases") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: phaseMaybeSingle,
            })),
          })),
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });

    const formData = new FormData();
    formData.set("checklistItemId", "check_001");
    formData.set("nextCompletedValue", "true");

    const result = await togglePhaseChecklistItemAction(
      { status: "idle", mode: "demo", message: "" },
      formData,
    );

    expect(assertProjectAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accessibleProjectIds: ["project_001"],
      }),
      { projectId: "project_001" },
    );
    expect(checklistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_completed: true,
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Checklist chantier mise a jour dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/phases");
  });

  it("refuse la mise a jour de checklist si le projet sort du scope serveur", async () => {
    const checklistMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "check_001",
        phase_id: "phase_001",
      },
      error: null,
    });
    const phaseMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "phase_001",
        project_id: "project_999",
        status: "in_progress",
      },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "phase_checklist_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: checklistMaybeSingle,
            })),
          })),
        };
      }

      if (table === "project_phases") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: phaseMaybeSingle,
            })),
          })),
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });
    assertProjectAccessMock.mockImplementation(() => {
      throw new ScopeGuardError(
        "project_access_denied",
        "Le scope serveur courant ne couvre pas ce projet.",
      );
    });

    const formData = new FormData();
    formData.set("checklistItemId", "check_001");
    formData.set("nextCompletedValue", "true");

    const result = await togglePhaseChecklistItemAction(
      { status: "idle", mode: "demo", message: "" },
      formData,
    );

    expect(result).toEqual({
      status: "error",
      mode: "supabase",
      message: "Le scope serveur courant ne couvre pas ce projet.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("met a jour le statut d'une phase dans Supabase", async () => {
    const phaseMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "phase_001",
        project_id: "project_001",
        status: "in_progress",
      },
      error: null,
    });
    const phaseUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const phaseUpdate = vi.fn(() => ({
      eq: phaseUpdateEq,
    }));
    const from = vi.fn((table: string) => {
      if (table === "project_phases") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: phaseMaybeSingle,
            })),
          })),
          update: phaseUpdate,
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });

    const formData = new FormData();
    formData.set("phaseId", "phase_001");
    formData.set("nextStatus", "completed");

    const result = await updateProjectPhaseStatusAction(
      { status: "idle", mode: "demo", message: "" },
      formData,
    );

    expect(phaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        completed_at: expect.any(String),
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Statut de phase mis a jour vers completed.",
    });
  });

  it("resout une alerte de phase dans Supabase", async () => {
    const alertMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "alert_001",
        phase_id: "phase_001",
      },
      error: null,
    });
    const phaseMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "phase_001",
        project_id: "project_001",
        status: "blocked",
      },
      error: null,
    });
    const alertUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const alertUpdate = vi.fn(() => ({
      eq: alertUpdateEq,
    }));
    const from = vi.fn((table: string) => {
      if (table === "phase_alerts") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: alertMaybeSingle,
            })),
          })),
          update: alertUpdate,
        };
      }

      if (table === "project_phases") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: phaseMaybeSingle,
            })),
          })),
        };
      }

      throw new Error(`Table inattendue: ${table}`);
    });

    createClientMock.mockResolvedValue({ from });

    const formData = new FormData();
    formData.set("alertId", "alert_001");

    const result = await resolvePhaseAlertAction(
      { status: "idle", mode: "demo", message: "" },
      formData,
    );

    expect(alertUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_resolved: true,
        resolved_at: expect.any(String),
      }),
    );
    expect(result).toEqual({
      status: "success",
      mode: "supabase",
      message: "Alerte chantier resolue dans Supabase.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/phases");
  });
});
