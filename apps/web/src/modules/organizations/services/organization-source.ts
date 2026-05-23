import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  loadServerOrganizationScope,
} from "@/lib/permissions";
import { demoUser } from "@/modules/auth/services/demo-session";
import type { AppUserProfile } from "@/modules/auth/types/auth";
import {
  demoOrganizationMemberships,
  demoOrganizations,
} from "@/modules/organizations/services/demo-organizations";
import type {
  Organization,
  OrganizationMembership,
} from "@/modules/organizations/types/organization";
import type { SupabaseDatabase } from "@/types/supabase";

export type OrganizationDataSource = "supabase" | "demo";

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

function buildDemoOrganizationAccessData(sourceDetail: string): OrganizationAccessData {
  return {
    user: demoUser,
    organizations: demoOrganizations,
    memberships: demoOrganizationMemberships,
    source: "demo",
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
    return buildDemoOrganizationAccessData(
      "Aucune session Supabase exploitable, bascule sur les donnees de demonstration.",
    );
  }

  if (
    normalizedSnapshot.organizations.length === 0 ||
    normalizedSnapshot.memberships.length === 0
  ) {
    return buildDemoOrganizationAccessData(
      "Base vide ou non exploitable pour les organisations, bascule sur les donnees de demonstration.",
    );
  }

  const availableOrganizationIds = new Set(
    normalizedSnapshot.organizations.map((organization) => organization.id),
  );
  const defaultOrganizationId = availableOrganizationIds.has(
    normalizedSnapshot.user.defaultOrganizationId ?? "",
  )
    ? normalizedSnapshot.user.defaultOrganizationId
    : normalizedSnapshot.memberships[0]?.organizationId;

  return {
    user: {
      ...normalizedSnapshot.user,
      defaultOrganizationId,
    },
    organizations: normalizedSnapshot.organizations,
    memberships: normalizedSnapshot.memberships,
    source: "supabase",
    sourceDetail: `${normalizedSnapshot.organizations.length} organisation(s) chargee(s) depuis Supabase avec application des regles RLS.`,
  };
}

export async function loadOrganizationAccessData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
): Promise<OrganizationAccessData> {
  if (!supabase) {
    return buildDemoOrganizationAccessData(
      "Configuration Supabase absente, utilisation du mode demonstration.",
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return buildDemoOrganizationAccessData(
      "Session Supabase indisponible, utilisation du mode demonstration.",
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
    return buildDemoOrganizationAccessData(
      "Lecture des rattachements organisationnels indisponible, utilisation du mode demonstration.",
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
    return buildDemoOrganizationAccessData(
      "Lecture des organisations indisponible, utilisation du mode demonstration.",
    );
  }

  return resolveOrganizationAccessData({
    user,
    organizations: (organizationsData ?? []).map(mapOrganizationRow),
    memberships,
  });
}
