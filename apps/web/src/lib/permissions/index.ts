export {
  ScopeGuardError,
  assertOrganizationAccess,
  assertProjectAccess,
  canAccessOrganization,
  canAccessProject,
  canManageOrganization,
  getManageableOrganizationIds,
} from "@/lib/permissions/server-guards";
export {
  buildServerOrganizationScope,
  buildServerProjectScope,
  collectScopeIds,
  loadServerOrganizationScope,
  loadServerProjectScope,
  mapOrganizationMembershipRow,
  mapProjectMembershipRow,
  normalizeScopeId,
  resolvePreferredOrganizationId,
} from "@/lib/permissions/server-scope";
export type {
  ServerOrganizationMembership,
  ServerOrganizationScope,
  ServerProjectMembership,
  ServerProjectScope,
} from "@/lib/permissions/server-scope";
