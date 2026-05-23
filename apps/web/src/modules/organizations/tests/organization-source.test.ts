import { resolveOrganizationAccessData } from "@/modules/organizations/services/organization-source";

describe("source des organisations", () => {
  it("bascule sur la demonstration sans utilisateur Supabase", () => {
    const result = resolveOrganizationAccessData({
      user: null,
      organizations: [],
      memberships: [],
    });

    expect(result.source).toBe("demo");
    expect(result.organizations.length).toBeGreaterThan(0);
  });

  it("bascule sur la demonstration quand les rattachements sont vides", () => {
    const result = resolveOrganizationAccessData({
      user: {
        id: "user_real_001",
        email: "chef@adminbtp.yt",
        fullName: "Chef de projet",
        internalRole: "member",
      },
      organizations: [],
      memberships: [],
    });

    expect(result.source).toBe("demo");
    expect(result.sourceDetail).toMatch(/Base vide/i);
  });

  it("conserve les donnees Supabase quand elles sont exploitables", () => {
    const result = resolveOrganizationAccessData({
      user: {
        id: "user_real_001",
        email: "chef@adminbtp.yt",
        fullName: "Chef de projet",
        internalRole: "member",
      },
      organizations: [
        {
          id: "org_real_001",
          slug: "client-real",
          name: "Client Reel",
          isActive: true,
        },
      ],
      memberships: [
        {
          organizationId: "org_real_001",
          userId: "user_real_001",
          role: "org_admin",
        },
      ],
    });

    expect(result.source).toBe("supabase");
    expect(result.user.defaultOrganizationId).toBe("org_real_001");
  });

  it("filtre les rattachements orphelins et garde Supabase si un socle reel reste exploitable", () => {
    const result = resolveOrganizationAccessData({
      user: {
        id: "user_real_001",
        email: "chef@adminbtp.yt",
        fullName: "Chef de projet",
        internalRole: "member",
      },
      organizations: [
        {
          id: "org_real_001",
          slug: "client-real",
          name: "Client Reel",
          isActive: true,
        },
      ],
      memberships: [
        {
          organizationId: "org_real_001",
          userId: "user_real_001",
          role: "org_admin",
        },
        {
          organizationId: "org_missing_002",
          userId: "user_real_001",
          role: "org_member",
        },
      ],
    });

    expect(result.source).toBe("supabase");
    expect(result.memberships).toHaveLength(1);
    expect(result.memberships[0]?.organizationId).toBe("org_real_001");
  });

  it("repositionne l'organisation par defaut si celle du profil n'est pas accessible", () => {
    const result = resolveOrganizationAccessData({
      user: {
        id: "user_real_001",
        email: "chef@adminbtp.yt",
        fullName: "Chef de projet",
        internalRole: "member",
        defaultOrganizationId: "org_missing_002",
      },
      organizations: [
        {
          id: "org_real_001",
          slug: "client-real",
          name: "Client Reel",
          isActive: true,
        },
      ],
      memberships: [
        {
          organizationId: "org_real_001",
          userId: "user_real_001",
          role: "org_admin",
        },
      ],
    });

    expect(result.source).toBe("supabase");
    expect(result.user.defaultOrganizationId).toBe("org_real_001");
  });
});
