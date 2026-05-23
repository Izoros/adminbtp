import type { SupabaseClient } from "@supabase/supabase-js";

import type { InternalRole } from "@/modules/auth/types/auth";
import type { OrganizationRole } from "@/modules/organizations/types/organization";
import type { ProjectRole } from "@/modules/projects/types/project";
import type { SupabaseDatabase } from "@/types/supabase";

type PermissionTables = SupabaseDatabase["public"]["Tables"];
type OrganizationMemberRow = PermissionTables["organization_members"]["Row"];
type ProjectOrganizationRow = PermissionTables["project_organizations"]["Row"];
type UserProfileRow = PermissionTables["user_profiles"]["Row"];

export type ServerOrganizationMembership = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
};

export type ServerProjectMembership = {
  projectId: string;
  organizationId: string;
  role: ProjectRole;
  isLead: boolean;
};

export type ServerOrganizationScope = {
  userId: string;
  internalRole: InternalRole;
  memberships: ServerOrganizationMembership[];
  accessibleOrganizationIds: string[];
  preferredOrganizationId: string | null;
};

export type ServerProjectScope = {
  memberships: ServerProjectMembership[];
  accessibleProjectIds: string[];
  accessibleOrganizationIds: string[];
};

export function normalizeScopeId(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

export function collectScopeIds(values: Array<string | null | undefined>): string[] {
  const normalizedIds = values
    .map((value) => normalizeScopeId(value))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalizedIds));
}

export function mapOrganizationMembershipRow(
  row: OrganizationMemberRow,
): ServerOrganizationMembership {
  return {
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
  };
}

export function mapProjectMembershipRow(
  row: ProjectOrganizationRow,
): ServerProjectMembership {
  return {
    projectId: row.project_id,
    organizationId: row.organization_id,
    role: row.role,
    isLead: row.is_lead,
  };
}

export function resolvePreferredOrganizationId(
  profile: Pick<UserProfileRow, "default_organization_id"> | null,
  organizationIds: string[],
): string | null {
  const defaultOrganizationId = normalizeScopeId(profile?.default_organization_id);

  if (defaultOrganizationId && organizationIds.includes(defaultOrganizationId)) {
    return defaultOrganizationId;
  }

  return organizationIds[0] ?? null;
}

export function buildServerOrganizationScope(input: {
  userId: string;
  internalRole?: InternalRole | null;
  memberships: OrganizationMemberRow[];
  profile?: Pick<UserProfileRow, "default_organization_id"> | null;
}): ServerOrganizationScope | null {
  const memberships = input.memberships.map(mapOrganizationMembershipRow);
  const accessibleOrganizationIds = collectScopeIds(
    memberships.map((membership) => membership.organizationId),
  );

  if (accessibleOrganizationIds.length === 0) {
    return null;
  }

  return {
    userId: input.userId,
    internalRole: input.internalRole ?? "member",
    memberships,
    accessibleOrganizationIds,
    preferredOrganizationId: resolvePreferredOrganizationId(
      input.profile ?? null,
      accessibleOrganizationIds,
    ),
  };
}

export function buildServerProjectScope(
  memberships: ProjectOrganizationRow[],
): ServerProjectScope {
  const mappedMemberships = memberships.map(mapProjectMembershipRow);

  return {
    memberships: mappedMemberships,
    accessibleProjectIds: collectScopeIds(
      mappedMemberships.map((membership) => membership.projectId),
    ),
    accessibleOrganizationIds: collectScopeIds(
      mappedMemberships.map((membership) => membership.organizationId),
    ),
  };
}

export async function loadServerOrganizationScope(
  supabase: SupabaseClient<SupabaseDatabase>,
): Promise<ServerOrganizationScope | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [{ data: memberships, error: membershipError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("organization_members")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("user_profiles")
        .select("default_organization_id, internal_role")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (membershipError || profileError) {
    return null;
  }

  return buildServerOrganizationScope({
    userId: user.id,
    internalRole: profile?.internal_role ?? "member",
    memberships: memberships ?? [],
    profile,
  });
}

export async function loadServerProjectScope(
  supabase: SupabaseClient<SupabaseDatabase>,
  organizationIds: string[],
): Promise<ServerProjectScope | null> {
  const scopedOrganizationIds = collectScopeIds(organizationIds);

  if (scopedOrganizationIds.length === 0) {
    return {
      memberships: [],
      accessibleProjectIds: [],
      accessibleOrganizationIds: [],
    };
  }

  const { data, error } = await supabase
    .from("project_organizations")
    .select("*")
    .in("organization_id", scopedOrganizationIds);

  if (error) {
    return null;
  }

  return buildServerProjectScope(data ?? []);
}
