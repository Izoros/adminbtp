import { beforeEach, vi } from "vitest";

import {
  loadPhaseDashboardData,
  resolvePhaseDashboardData,
} from "@/modules/phases/services/phase-source";
import { loadServerProjectScope } from "@/lib/permissions";

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>("@/lib/permissions");

  return {
    ...actual,
    loadServerProjectScope: vi.fn(),
  };
});

function createSelectQueryResult<T>(data: T) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => ({ data, error: null })),
  };

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolution des donnees phases chantier", () => {
  it("bascule en demonstration si aucun role actif n'est exploitable", () => {
    const result = resolvePhaseDashboardData({
      activeRole: null,
      phases: [],
      checklistItems: [],
      alerts: [],
    });

    expect(result.source).toBe("demo");
    expect(result.activeRole).toBe("moe");
    expect(result.sourceDetail).toMatch(/mode demonstration/i);
  });

  it("retourne la source Supabase quand les phases sont exploitables", () => {
    const result = resolvePhaseDashboardData({
      activeRole: "moe",
      phases: [
        {
          id: "phase_002",
          projectId: "project_001",
          profile: "moe",
          code: "visa",
          title: "Visa EXE",
          description: "Controle EXE",
          sequenceNumber: 2,
          status: "in_progress",
        },
        {
          id: "phase_001",
          projectId: "project_001",
          profile: "moe",
          code: "prep",
          title: "Preparation",
          description: "Preparation du visa",
          sequenceNumber: 1,
          status: "not_started",
        },
      ],
      checklistItems: [
        {
          id: "check_001",
          phaseId: "phase_001",
          label: "Point valide",
          isRequired: true,
          isCompleted: true,
        },
        {
          id: "check_orphan",
          phaseId: "phase_absente",
          label: "Orpheline",
          isRequired: true,
          isCompleted: false,
        },
      ],
      alerts: [
        {
          id: "alert_001",
          phaseId: "phase_002",
          severity: "medium",
          title: "Arbitrage",
          message: "Point a arbitrer",
          isResolved: false,
        },
      ],
    });

    expect(result.source).toBe("supabase");
    expect(result.phases.map((phase) => phase.id)).toEqual([
      "phase_001",
      "phase_002",
    ]);
    expect(result.checklistItems).toHaveLength(1);
    expect(result.alerts).toHaveLength(1);
  });
});

describe("chargement Supabase des phases chantier", () => {
  it("charge les phases du projet scope et reconstruit les checklists et alertes", async () => {
    const phaseQuery = createSelectQueryResult([
      {
        id: "phase_001",
        project_id: "project_001",
        template_id: "template_001",
        profile: "moe",
        status: "in_progress",
        started_at: null,
        completed_at: null,
        due_at: null,
        created_at: "2026-05-01T00:00:00.000Z",
        updated_at: "2026-05-01T00:00:00.000Z",
      },
    ]);
    const templateQuery = createSelectQueryResult([
      {
        id: "template_001",
        profile: "moe",
        code: "moe-visa-exe",
        title: "Visa EXE",
        description: "Controle des pieces d'execution",
        sequence_number: 1,
        created_at: "2026-05-01T00:00:00.000Z",
        updated_at: "2026-05-01T00:00:00.000Z",
      },
    ]);
    const checklistQuery = createSelectQueryResult([
      {
        id: "check_001",
        phase_id: "phase_001",
        label: "Plans EXE recuperes",
        is_required: true,
        is_completed: true,
        completed_at: null,
        sequence_number: 1,
        created_at: "2026-05-01T00:00:00.000Z",
        updated_at: "2026-05-01T00:00:00.000Z",
      },
    ]);
    const alertQuery = createSelectQueryResult([
      {
        id: "alert_001",
        phase_id: "phase_001",
        severity: "medium",
        title: "Arbitrage interface",
        message: "Un arbitrage reste attendu.",
        is_resolved: false,
        resolved_at: null,
        created_at: "2026-05-02T00:00:00.000Z",
        updated_at: "2026-05-02T00:00:00.000Z",
      },
    ]);

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "project_phases") {
          return phaseQuery;
        }

        if (table === "project_phase_templates") {
          return templateQuery;
        }

        if (table === "phase_checklist_items") {
          return checklistQuery;
        }

        if (table === "phase_alerts") {
          return alertQuery;
        }

        throw new Error(`Table inattendue: ${table}`);
      }),
    } as never;

    vi.mocked(loadServerProjectScope).mockResolvedValue({
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

    const result = await loadPhaseDashboardData(supabase, ["org_adminbtp_001"]);

    expect(result.source).toBe("supabase");
    expect(result.activeRole).toBe("moe");
    expect(result.phases[0]?.code).toBe("moe-visa-exe");
    expect(result.checklistItems[0]?.label).toBe("Plans EXE recuperes");
    expect(result.alerts[0]?.title).toBe("Arbitrage interface");
    expect(phaseQuery.eq).toHaveBeenCalledWith("project_id", "project_001");
    expect(templateQuery.in).toHaveBeenCalledWith("id", ["template_001"]);
    expect(checklistQuery.in).toHaveBeenCalledWith("phase_id", ["phase_001"]);
    expect(alertQuery.in).toHaveBeenCalledWith("phase_id", ["phase_001"]);
  });

  it("bascule en demonstration si Supabase est absent", async () => {
    const result = await loadPhaseDashboardData(null, ["org_adminbtp_001"]);

    expect(result.source).toBe("demo");
    expect(result.phases.length).toBeGreaterThan(0);
  });
});
