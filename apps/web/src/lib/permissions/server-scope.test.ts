import { describe, expect, it } from "vitest";

import {
  buildServerOrganizationScope,
  buildServerProjectScope,
  collectScopeIds,
  normalizeScopeId,
  resolvePreferredOrganizationId,
} from "@/lib/permissions";

describe("server scope helpers", () => {
  it("normalise et dedupe les ids de scope", () => {
    expect(
      collectScopeIds([" org_001 ", "org_001", "", "  ", null, "org_002"]),
    ).toEqual(["org_001", "org_002"]);
    expect(normalizeScopeId("  project_001  ")).toBe("project_001");
    expect(normalizeScopeId("   ")).toBeNull();
  });

  it("conserve l'organisation par defaut quand elle reste accessible", () => {
    expect(
      resolvePreferredOrganizationId(
        { default_organization_id: "org_002" },
        ["org_001", "org_002"],
      ),
    ).toBe("org_002");
  });

  it("retombe sur la premiere organisation accessible si le defaut est invalide", () => {
    expect(
      resolvePreferredOrganizationId(
        { default_organization_id: "org_inconnue" },
        ["org_001", "org_002"],
      ),
    ).toBe("org_001");
  });

  it("construit un scope organisation serveur stable", () => {
    const scope = buildServerOrganizationScope({
      userId: "user_001",
      internalRole: "operations_manager",
      profile: { default_organization_id: "org_002" },
      memberships: [
        {
          id: "membership_001",
          organization_id: "org_001",
          user_id: "user_001",
          role: "org_member",
          created_at: "2026-01-01T00:00:00.000Z",
          invited_by: null,
          joined_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "membership_002",
          organization_id: " org_002 ",
          user_id: "user_001",
          role: "org_admin",
          created_at: "2026-01-02T00:00:00.000Z",
          invited_by: null,
          joined_at: "2026-01-02T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
        },
      ],
    });

    expect(scope).toEqual({
      userId: "user_001",
      internalRole: "operations_manager",
      preferredOrganizationId: "org_002",
      accessibleOrganizationIds: ["org_001", "org_002"],
      memberships: [
        {
          organizationId: "org_001",
          userId: "user_001",
          role: "org_member",
        },
        {
          organizationId: " org_002 ",
          userId: "user_001",
          role: "org_admin",
        },
      ],
    });
  });

  it("retourne null si aucun scope organisation n'est accessible", () => {
    const scope = buildServerOrganizationScope({
      userId: "user_001",
      memberships: [],
      profile: null,
    });

    expect(scope).toBeNull();
  });

  it("construit un scope projet avec ids dedupes", () => {
    const scope = buildServerProjectScope([
      {
        id: "project_org_001",
        project_id: "project_001",
        organization_id: "org_001",
        role: "opc",
        is_lead: true,
        created_at: "2026-01-01T00:00:00.000Z",
        created_by: "user_001",
        joined_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "project_org_002",
        project_id: "project_001",
        organization_id: "org_002",
        role: "moe",
        is_lead: false,
        created_at: "2026-01-02T00:00:00.000Z",
        created_by: "user_001",
        joined_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]);

    expect(scope.accessibleProjectIds).toEqual(["project_001"]);
    expect(scope.accessibleOrganizationIds).toEqual(["org_001", "org_002"]);
    expect(scope.memberships).toHaveLength(2);
  });
});
