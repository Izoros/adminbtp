import type { Situation } from "@adminbtp/types";

export const mockSituations: Situation[] = [
  { id: "sit-1", siteId: "site-1", lotId: "lot-1", number: 8, amountHt: 92000, status: "EN_VERIFICATION", submittedAt: "2026-10-05", dueDate: "2026-10-25" },
  { id: "sit-2", siteId: "site-1", lotId: "lot-2", number: 6, amountHt: 41000, status: "ACCEPTE", submittedAt: "2026-09-28", dueDate: "2026-10-18", paidAt: "2026-10-17" },
  { id: "sit-3", siteId: "site-3", number: 12, amountHt: 65000, status: "CONTESTE", submittedAt: "2026-09-20", dueDate: "2026-10-10", disputeReason: "Écart sur quantités VRD à justifier" },
  { id: "sit-4", siteId: "site-4", number: 1, amountHt: 18000, status: "A_ETABLIR", dueDate: "2026-11-05" },
];

export const USERS = [
  { id: "user-1", fullName: "Amina Chanfi", permissionRole: "GESTIONNAIRE_ADMINISTRATIF", initials: "AC" },
  { id: "user-2", fullName: "Julien Perrot", permissionRole: "CHARGE_AFFAIRES", initials: "JP" },
] as const;
