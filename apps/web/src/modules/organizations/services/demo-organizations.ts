import type {
  Organization,
  OrganizationMembership,
} from "@/modules/organizations/types/organization";

export const demoOrganizations: Organization[] = [
  {
    id: "org_adminbtp_001",
    slug: "adminbtp",
    name: "AdminBTP",
    legalName: "AdminBTP SAS",
    isActive: true,
  },
  {
    id: "org_moe_002",
    slug: "atelier-moe",
    name: "Atelier MOE",
    legalName: "Atelier MOE SARL",
    isActive: true,
  },
  {
    id: "org_hidden_003",
    slug: "entreprise-cachee",
    name: "Entreprise Cachee",
    legalName: "Entreprise Cachee SAS",
    isActive: true,
  },
  {
    id: "org_client_004",
    slug: "client-college",
    name: "Client College",
    legalName: "Collectivite Client College",
    isActive: true,
  },
  {
    id: "org_tce_005",
    slug: "groupement-tce",
    name: "Groupement TCE",
    legalName: "Groupement TCE SAS",
    isActive: true,
  },
];

export const demoOrganizationMemberships: OrganizationMembership[] = [
  {
    organizationId: "org_adminbtp_001",
    userId: "user_demo_adminbtp_001",
    role: "org_owner",
  },
  {
    organizationId: "org_moe_002",
    userId: "user_demo_adminbtp_001",
    role: "org_admin",
  },
  {
    organizationId: "org_hidden_003",
    userId: "user_other_002",
    role: "org_member",
  },
];
