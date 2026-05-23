import { demoOrganizationMemberships, demoOrganizations } from "@/modules/organizations/services/demo-organizations";
import {
  canAccessOrganization,
  getOrganizationsForUser,
  isOrganizationManager,
} from "@/modules/organizations/services/access-control";

describe("controle d'acces organisations", () => {
  it("autorise un utilisateur sur plusieurs organisations rattachees", () => {
    const visibleOrganizations = getOrganizationsForUser(
      "user_demo_adminbtp_001",
      demoOrganizations,
      demoOrganizationMemberships,
    );

    expect(visibleOrganizations).toHaveLength(2);
    expect(visibleOrganizations.map((organization) => organization.slug)).toEqual([
      "adminbtp",
      "atelier-moe",
    ]);
  });

  it("refuse l'acces a une organisation non rattachee", () => {
    expect(
      canAccessOrganization(
        "user_demo_adminbtp_001",
        "org_hidden_003",
        demoOrganizationMemberships,
      ),
    ).toBe(false);
  });

  it("distingue les profils gestionnaires des profils simples", () => {
    expect(
      isOrganizationManager(
        "user_demo_adminbtp_001",
        "org_adminbtp_001",
        demoOrganizationMemberships,
      ),
    ).toBe(true);

    expect(
      isOrganizationManager(
        "user_other_002",
        "org_hidden_003",
        demoOrganizationMemberships,
      ),
    ).toBe(false);
  });
});
