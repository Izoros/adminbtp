import { resolveProjectDashboardData } from "@/modules/projects/services/project-source";

describe("source des projets", () => {
  it("bascule sur la demonstration quand aucun chantier n'est exploitable", () => {
    const result = resolveProjectDashboardData({
      projects: [],
      projectOrganizations: [],
    });

    expect(result.source).toBe("demo");
    expect(result.projects.length).toBeGreaterThan(0);
  });

  it("bascule sur la demonstration quand les roles chantier sont absents", () => {
    const result = resolveProjectDashboardData({
      projects: [
        {
          id: "project_real_001",
          code: "REAL-001",
          slug: "chantier-reel",
          name: "Chantier reel",
          description: "Description",
          status: "active",
          ownerOrganizationId: "org_real_001",
          startsOn: "2026-05-01",
        },
      ],
      projectOrganizations: [],
    });

    expect(result.source).toBe("demo");
  });

  it("conserve les donnees Supabase quand les chantiers sont complets", () => {
    const result = resolveProjectDashboardData({
      projects: [
        {
          id: "project_real_001",
          code: "REAL-001",
          slug: "chantier-reel",
          name: "Chantier reel",
          description: "Description",
          status: "active",
          ownerOrganizationId: "org_real_001",
          startsOn: "2026-05-01",
        },
      ],
      projectOrganizations: [
        {
          projectId: "project_real_001",
          organizationId: "org_real_001",
          role: "moe",
          isLead: true,
        },
      ],
    });

    expect(result.source).toBe("supabase");
    expect(result.projectOrganizations[0]?.role).toBe("moe");
  });

  it("filtre les affectations orphelines et conserve les donnees reelles restantes", () => {
    const result = resolveProjectDashboardData({
      projects: [
        {
          id: "project_real_001",
          code: "REAL-001",
          slug: "chantier-reel",
          name: "Chantier reel",
          description: "Description",
          status: "active",
          ownerOrganizationId: "org_real_001",
          startsOn: "2026-05-01",
        },
      ],
      projectOrganizations: [
        {
          projectId: "project_real_001",
          organizationId: "org_real_001",
          role: "moe",
          isLead: true,
        },
        {
          projectId: "project_missing_002",
          organizationId: "org_real_001",
          role: "opc",
          isLead: false,
        },
      ],
    });

    expect(result.source).toBe("supabase");
    expect(result.projectOrganizations).toHaveLength(1);
    expect(result.projectOrganizations[0]?.projectId).toBe("project_real_001");
  });

  it("repasse en demonstration quand les affectations restantes ne pointent sur aucun chantier reel", () => {
    const result = resolveProjectDashboardData({
      projects: [
        {
          id: "project_real_001",
          code: "REAL-001",
          slug: "chantier-reel",
          name: "Chantier reel",
          description: "Description",
          status: "active",
          ownerOrganizationId: "org_real_001",
          startsOn: "2026-05-01",
        },
      ],
      projectOrganizations: [
        {
          projectId: "project_missing_002",
          organizationId: "org_real_001",
          role: "opc",
          isLead: false,
        },
      ],
    });

    expect(result.source).toBe("demo");
  });
});
