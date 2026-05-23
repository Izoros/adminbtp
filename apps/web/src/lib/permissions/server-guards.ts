import type { OrganizationRole } from "@/modules/organizations/types/organization";

import type {
  ServerOrganizationScope,
  ServerProjectScope,
} from "@/lib/permissions/server-scope";

const defaultManagerRoles: OrganizationRole[] = ["org_owner", "org_admin"];

export class ScopeGuardError extends Error {
  code:
    | "missing_scope_target"
    | "organization_access_denied"
    | "project_access_denied";

  constructor(
    code:
      | "missing_scope_target"
      | "organization_access_denied"
      | "project_access_denied",
    message: string,
  ) {
    super(message);
    this.name = "ScopeGuardError";
    this.code = code;
  }
}

export function canAccessOrganization(
  scope: Pick<ServerOrganizationScope, "accessibleOrganizationIds">,
  organizationId: string | null | undefined,
): boolean {
  const normalizedOrganizationId = organizationId?.trim();

  return Boolean(
    normalizedOrganizationId &&
      scope.accessibleOrganizationIds.includes(normalizedOrganizationId),
  );
}

export function getManageableOrganizationIds(
  scope: Pick<ServerOrganizationScope, "memberships">,
  managerRoles: OrganizationRole[] = defaultManagerRoles,
): string[] {
  const manageableOrganizationIds = scope.memberships
    .filter((membership) => managerRoles.includes(membership.role))
    .map((membership) => membership.organizationId);

  return Array.from(new Set(manageableOrganizationIds));
}

export function canManageOrganization(
  scope: Pick<ServerOrganizationScope, "memberships">,
  organizationId: string | null | undefined,
  managerRoles: OrganizationRole[] = defaultManagerRoles,
): boolean {
  const normalizedOrganizationId = organizationId?.trim();

  if (!normalizedOrganizationId) {
    return false;
  }

  return getManageableOrganizationIds(scope, managerRoles).includes(
    normalizedOrganizationId,
  );
}

export function canAccessProject(
  scope: Pick<ServerProjectScope, "accessibleProjectIds" | "memberships">,
  input: {
    projectId: string | null | undefined;
    organizationId?: string | null | undefined;
  },
): boolean {
  const normalizedProjectId = input.projectId?.trim();
  const normalizedOrganizationId = input.organizationId?.trim();

  if (!normalizedProjectId) {
    return false;
  }

  if (!scope.accessibleProjectIds.includes(normalizedProjectId)) {
    return false;
  }

  if (!normalizedOrganizationId) {
    return true;
  }

  return scope.memberships.some(
    (membership) =>
      membership.projectId === normalizedProjectId &&
      membership.organizationId === normalizedOrganizationId,
  );
}

export function assertOrganizationAccess(
  scope: Pick<ServerOrganizationScope, "accessibleOrganizationIds">,
  organizationId: string | null | undefined,
): string {
  const normalizedOrganizationId = organizationId?.trim();

  if (!normalizedOrganizationId) {
    throw new ScopeGuardError(
      "missing_scope_target",
      "Un identifiant organisation est obligatoire pour appliquer le garde-fou.",
    );
  }

  if (!canAccessOrganization(scope, normalizedOrganizationId)) {
    throw new ScopeGuardError(
      "organization_access_denied",
      "Le scope serveur courant ne couvre pas cette organisation.",
    );
  }

  return normalizedOrganizationId;
}

export function assertProjectAccess(
  scope: Pick<ServerProjectScope, "accessibleProjectIds" | "memberships">,
  input: {
    projectId: string | null | undefined;
    organizationId?: string | null | undefined;
  },
): { projectId: string; organizationId?: string } {
  const normalizedProjectId = input.projectId?.trim();
  const normalizedOrganizationId = input.organizationId?.trim();

  if (!normalizedProjectId) {
    throw new ScopeGuardError(
      "missing_scope_target",
      "Un identifiant projet est obligatoire pour appliquer le garde-fou.",
    );
  }

  if (
    !canAccessProject(scope, {
      projectId: normalizedProjectId,
      organizationId: normalizedOrganizationId,
    })
  ) {
    throw new ScopeGuardError(
      "project_access_denied",
      "Le scope serveur courant ne couvre pas ce projet.",
    );
  }

  return normalizedOrganizationId
    ? {
        projectId: normalizedProjectId,
        organizationId: normalizedOrganizationId,
      }
    : { projectId: normalizedProjectId };
}
