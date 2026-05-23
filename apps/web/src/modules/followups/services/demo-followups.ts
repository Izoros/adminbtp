import type { Situation } from "@/modules/followups/types/followup";

export const demoSituations: Situation[] = [
  {
    id: "situation_001",
    organizationId: "org_adminbtp_001",
    projectId: "project_001",
    reference: "SIT-2026-05-001",
    customerName: "Collectivite Client College",
    amountCents: 245000,
    currencyCode: "EUR",
    issuedOn: "2026-05-10",
    dueOn: "2026-05-20",
    status: "sent",
  },
];

export function getDemoSituation() {
  return demoSituations[0]!;
}
