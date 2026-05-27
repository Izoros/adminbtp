import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  loadServerOrganizationScope,
} from "@/lib/permissions";
import type { AppUserProfile } from "@/modules/auth/types/auth";
import type {
  Organization,
  OrganizationMembership,
} from "@/modules/organizations/types/organization";
import type { SupabaseDatabase } from "@/types/supabase";

export type OrganizationDataSource = "supabase";

export type OrganizationAccessData = {
  user: AppUserProfile;
  organizations: Organization[];
  memberships: OrganizationMembership[];
  source: OrganizationDataSource;
  sourceDetail: string;
};

type OrganizationSnapshot = {
  user: AppUserProfile | null;
  organizations: Organization[];
  memberships: OrganizationMembership[];
};

function buildUnavailableUserProfile(): AppUserProfile {
  return {
    id: "session_indisponible",
    email: "session@adminbtp.local",
    fullName: "Session AdminBTP indisponible",
    internalRole: "member",
  };
}

function mapSupabaseUser(
  user: User,
  profile?: SupabaseDatabase["public"]["Tables"]["user_profiles"]["Row"] | null,
): AppUserProfile {
  const metadata = user.user_metadata;
  const fullName =
    typeof profile?.full_name === "string" && profile.full_name.length > 0
      ? profile.full_name
      : typeof metadata?.full_name === "string"
        ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : user.email?.split("@")[0] ?? "Utilisateur AdminBTP";

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "utilisateur@adminbtp.yt",
    fullName,
    internalRole: profile?.internal_role ?? "member",
    defaultOrganizationId: profile?.default_organization_id ?? undefined,
  };
}

function mapOrganizationRow(
  row: SupabaseDatabase["public"]["Tables"]["organizations"]["Row"],
): Organization {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    legalName: row.legal_name ?? undefined,
    isActive: row.is_active,
  };
}

function buildEmptyOrganizationAccessData(
  sourceDetail: string,
  user: AppUserProfile | null = null,
): OrganizationAccessData {
  return {
    user: user ?? buildUnavailableUserProfile(),
    organizations: [],
    memberships: [],
    source: "supabase",
    sourceDetail,
  };
}

function buildSupabaseOrganizationAccessData(
  snapshot: OrganizationSnapshot,
  sourceDetail: string,
): OrganizationAccessData {
  const availableOrganizationIds = new Set(
    snapshot.organizations.map((organization) => organization.id),
  );
  const defaultOrganizationId =
    snapshot.memberships.length > 0 &&
    availableOrganizationIds.has(snapshot.user?.defaultOrganizationId ?? "")
      ? snapshot.user?.defaultOrganizationId
      : snapshot.memberships[0]?.organizationId;

  return {
    user: {
      ...snapshot.user!,
      defaultOrganizationId,
    },
    organizations: snapshot.organizations,
    memberships: snapshot.memberships,
    source: "supabase",
    sourceDetail,
  };
}

function normalizeOrganizationSnapshot(
  snapshot: OrganizationSnapshot,
): OrganizationSnapshot {
  const availableOrganizationIds = new Set(
    snapshot.organizations.map((organization) => organization.id),
  );

  return {
    user: snapshot.user,
    organizations: snapshot.organizations,
    memberships: snapshot.memberships.filter((membership) =>
      availableOrganizationIds.has(membership.organizationId),
    ),
  };
}

export function resolveOrganizationAccessData(
  snapshot: OrganizationSnapshot,
): OrganizationAccessData {
  const normalizedSnapshot = normalizeOrganizationSnapshot(snapshot);

  if (!normalizedSnapshot.user) {
    return buildEmptyOrganizationAccessData(
      "Aucune session Supabase exploitable n'a ete trouvee pour charger les organisations.",
    );
  }

  if (
    normalizedSnapshot.organizations.length === 0 ||
    normalizedSnapshot.memberships.length === 0
  ) {
    return buildSupabaseOrganizationAccessData(
      normalizedSnapshot,
      "Supabase est accessible, mais aucune organisation exploitable n'est encore disponible pour cette session.",
    );
  }

  return buildSupabaseOrganizationAccessData(
    normalizedSnapshot,
    `${normalizedSnapshot.organizations.length} organisation(s) chargee(s) depuis Supabase avec application des regles RLS.`,
  );
}

export async function loadOrganizationAccessData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
): Promise<OrganizationAccessData> {
  if (!supabase) {
    return buildEmptyOrganizationAccessData(
      "Configuration Supabase absente. Le module organisations ne peut pas charger de donnees.",
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return buildEmptyOrganizationAccessData(
      "Session Supabase indisponible. Reconnectez-vous pour charger les organisations.",
    );
  }

  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  const user = mapSupabaseUser(authData.user, profileData);
  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    return buildEmptyOrganizationAccessData(
      "Lecture des rattachements organisationnels indisponible pour cette session.",
      user,
    );
  }

  const memberships = organizationScope.memberships.map((membership) => ({
    organizationId: membership.organizationId,
    userId: membership.userId,
    role: membership.role,
  }));
  const organizationIds = organizationScope.accessibleOrganizationIds;

  if (organizationIds.length === 0) {
    return resolveOrganizationAccessData({
      user,
      organizations: [],
      memberships: [],
    });
  }

  const { data: organizationsData, error: organizationsError } = await supabase
    .from("organizations")
    .select("*")
    .in("id", organizationIds)
    .order("name", { ascending: true });

  if (organizationsError) {
    return buildEmptyOrganizationAccessData(
      "Lecture des organisations indisponible dans Supabase pour le perimetre courant.",
      user,
    );
  }

  return resolveOrganizationAccessData({
    user,
    organizations: (organizationsData ?? []).map(mapOrganizationRow),
    memberships,
  });
}
