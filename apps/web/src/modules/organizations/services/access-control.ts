import type {
  Organization,
  OrganizationMembership,
  OrganizationRole,
} from "@/modules/organizations/types/organization";

const managerRoles: OrganizationRole[] = ["org_owner", "org_admin"];

export function canAccessOrganization(
  userId: string,
  organizationId: string,
  memberships: OrganizationMembership[],
) {
  return memberships.some(
    (membership) =>
      membership.userId === userId && membership.organizationId === organizationId,
  );
}

export function isOrganizationManager(
  userId: string,
  organizationId: string,
  memberships: OrganizationMembership[],
) {
  return memberships.some(
    (membership) =>
      membership.userId === userId &&
      membership.organizationId === organizationId &&
      managerRoles.includes(membership.role),
  );
}

export function getOrganizationsForUser(
  userId: string,
  organizations: Organization[],
  memberships: OrganizationMembership[],
) {
  return organizations.filter((organization) =>
    canAccessOrganization(userId, organization.id, memberships),
  );
}
