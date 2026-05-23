import { demoOrganizationMemberships } from "@/modules/organizations/services/demo-organizations";
import {
  demoProjectOrganizations,
  demoProjects,
} from "@/modules/projects/services/demo-projects";
import {
  getPrimaryProjectRoleView,
  getProjectsForUser,
} from "@/modules/projects/services/project-access";

describe("acces projets et vues par role", () => {
  it("retourne les chantiers visibles pour un utilisateur rattache", () => {
    const visibleProjects = getProjectsForUser(
      "user_demo_adminbtp_001",
      demoOrganizationMemberships,
      demoProjects,
      demoProjectOrganizations,
    );

    expect(visibleProjects).toHaveLength(1);
    expect(visibleProjects[0]?.slug).toBe("renovation-college-kaweni");
  });

  it("renvoie la vue de role adaptee a l'organisation de l'utilisateur", () => {
    const roleView = getPrimaryProjectRoleView(
      "user_demo_adminbtp_001",
      "project_001",
      demoOrganizationMemberships,
      demoProjectOrganizations,
    );

    expect(roleView?.role).toBe("opc");
    expect(roleView?.title).toMatch(/OPC/i);
  });

  it("refuse la vue chantier quand l'utilisateur n'est pas rattache", () => {
    const roleView = getPrimaryProjectRoleView(
      "user_other_002",
      "project_001",
      demoOrganizationMemberships,
      demoProjectOrganizations,
    );

    expect(roleView).toBeNull();
  });
});
