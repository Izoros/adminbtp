import { describe, expect, it } from "vitest";

import {
  ScopeGuardError,
  assertOrganizationAccess,
  assertProjectAccess,
  canAccessOrganization,
  canAccessProject,
  canManageOrganization,
  getManageableOrganizationIds,
} from "@/lib/permissions";

const organizationScope = {
  internalRole: "member" as const,
  accessibleOrganizationIds: ["org_001", "org_002"],
  memberships: [
    {
      organizationId: "org_001",
      userId: "user_001",
      role: "org_owner" as const,
    },
    {
      organizationId: "org_002",
      userId: "user_001",
      role: "org_member" as const,
    },
  ],
};

const platformAdminOrganizationScope = {
  internalRole: "platform_admin" as const,
  accessibleOrganizationIds: ["org_001", "org_002"],
  memberships: [
    {
      organizationId: "org_001",
      userId: "user_001",
      role: "org_member" as const,
    },
    {
      organizationId: "org_002",
      userId: "user_001",
      role: "org_viewer" as const,
    },
  ],
};

const projectScope = {
  accessibleProjectIds: ["project_001", "project_002"],
  memberships: [
    {
      projectId: "project_001",
      organizationId: "org_001",
      role: "opc" as const,
      isLead: true,
    },
    {
      projectId: "project_002",
      organizationId: "org_002",
      role: "moe" as const,
      isLead: false,
    },
  ],
};

describe("server guards", () => {
  it("controle l'acces organisation et la capacite de gestion", () => {
    expect(canAccessOrganization(organizationScope, "org_001")).toBe(true);
    expect(canAccessOrganization(organizationScope, "org_003")).toBe(false);
    expect(getManageableOrganizationIds(organizationScope)).toEqual(["org_001"]);
    expect(canManageOrganization(organizationScope, "org_001")).toBe(true);
    expect(canManageOrganization(organizationScope, "org_002")).toBe(false);
  });

  it("autorise un platform_admin a gerer toutes les organisations accessibles", () => {
    expect(getManageableOrganizationIds(platformAdminOrganizationScope)).toEqual([
      "org_001",
      "org_002",
    ]);
    expect(canManageOrganization(platformAdminOrganizationScope, "org_001")).toBe(true);
    expect(canManageOrganization(platformAdminOrganizationScope, "org_002")).toBe(true);
  });

  it("leve une erreur explicite quand l'organisation sort du scope", () => {
    expect(() => assertOrganizationAccess(organizationScope, "org_003")).toThrow(
      ScopeGuardError,
    );
    expect(() => assertOrganizationAccess(organizationScope, "")).toThrow(
      /identifiant organisation/i,
    );
    expect(assertOrganizationAccess(organizationScope, " org_001 ")).toBe("org_001");
  });

  it("controle l'acces projet avec ou sans contrainte organisationnelle", () => {
    expect(canAccessProject(projectScope, { projectId: "project_001" })).toBe(true);
    expect(
      canAccessProject(projectScope, {
        projectId: "project_001",
        organizationId: "org_001",
      }),
    ).toBe(true);
    expect(
      canAccessProject(projectScope, {
        projectId: "project_001",
        organizationId: "org_002",
      }),
    ).toBe(false);
  });

  it("leve une erreur explicite quand le projet sort du scope", () => {
    expect(() =>
      assertProjectAccess(projectScope, { projectId: "project_003" }),
    ).toThrow(ScopeGuardError);
    expect(() =>
      assertProjectAccess(projectScope, {
        projectId: "project_001",
        organizationId: "org_002",
      }),
    ).toThrow(/scope serveur courant ne couvre pas ce projet/i);
    expect(
      assertProjectAccess(projectScope, {
        projectId: " project_002 ",
        organizationId: " org_002 ",
      }),
    ).toEqual({
      projectId: "project_002",
      organizationId: "org_002",
    });
  });
});
