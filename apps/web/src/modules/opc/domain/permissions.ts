export type OpcMemberRole =
  "administrator" | "collaborator" | "company_contributor" | "viewer";

export type OpcPermission =
  | "planning.read"
  | "planning.write"
  | "baseline.create"
  | "meeting.write"
  | "action.write"
  | "progress.write_own_company"
  | "reservation.write"
  | "report.export"
  | "member.manage";

const permissionsByRole: Record<OpcMemberRole, OpcPermission[]> = {
  administrator: [
    "planning.read",
    "planning.write",
    "baseline.create",
    "meeting.write",
    "action.write",
    "progress.write_own_company",
    "reservation.write",
    "report.export",
    "member.manage",
  ],
  collaborator: [
    "planning.read",
    "planning.write",
    "baseline.create",
    "meeting.write",
    "action.write",
    "progress.write_own_company",
    "reservation.write",
    "report.export",
  ],
  company_contributor: [
    "planning.read",
    "action.write",
    "progress.write_own_company",
    "report.export",
  ],
  viewer: ["planning.read", "report.export"],
};

export function canOpc(
  role: OpcMemberRole,
  permission: OpcPermission,
): boolean {
  return permissionsByRole[role].includes(permission);
}
