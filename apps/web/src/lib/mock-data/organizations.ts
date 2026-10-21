import type { Organization } from "@adminbtp/types";

/**
 * Données fictives — Phase 1 (mode démonstration, aucune donnée réelle de client).
 */
export const mockOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "SARL Madaterrassement",
    legalName: "Madaterrassement SARL",
    siret: "88123456700012",
    city: "Mamoudzou",
    postalCode: "97600",
    country: "FR",
    domain: "madaterrassement.yt",
    domainVerified: false,
    subscriptionPlan: "PRO",
    createdAt: "2025-02-10T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "org-2",
    name: "Bâti Mayotte Construction",
    legalName: "Bâti Mayotte Construction SAS",
    siret: "90234567800015",
    city: "Koungou",
    postalCode: "97600",
    country: "FR",
    domain: undefined,
    domainVerified: false,
    subscriptionPlan: "STARTER",
    createdAt: "2025-06-20T08:00:00.000Z",
    updatedAt: "2026-08-15T08:00:00.000Z",
  },
  {
    id: "org-3",
    name: "Cabinet AMO Lagon",
    legalName: "Cabinet AMO Lagon",
    city: "Dzaoudzi",
    postalCode: "97615",
    country: "FR",
    domainVerified: false,
    subscriptionPlan: "PRO",
    createdAt: "2025-09-05T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
  },
];
