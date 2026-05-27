import type { SupabaseClient } from "@supabase/supabase-js";

import { loadServerProjectScope } from "@/lib/permissions";
import type {
  Project,
  ProjectOrganization,
} from "@/modules/projects/types/project";
import type { SupabaseDatabase } from "@/types/supabase";

export type ProjectDataSource = "supabase";

export type ProjectDashboardData = {
  projects: Project[];
  projectOrganizations: ProjectOrganization[];
  source: ProjectDataSource;
  sourceDetail: string;
};

type ProjectSnapshot = {
  projects: Project[];
  projectOrganizations: ProjectOrganization[];
};

function mapProjectRow(
  row: SupabaseDatabase["public"]["Tables"]["projects"]["Row"],
): Project {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    ownerOrganizationId: row.owner_organization_id,
    startsOn: row.starts_on ?? "",
    endsOn: row.ends_on ?? undefined,
  };
}

function buildEmptySupabaseProjectDashboardData(
  sourceDetail: string,
): ProjectDashboardData {
  return {
    projects: [],
    projectOrganizations: [],
    source: "supabase",
    sourceDetail,
  };
}

function normalizeProjectSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  const availableProjectIds = new Set(snapshot.projects.map((project) => project.id));

  return {
    projects: snapshot.projects,
    projectOrganizations: snapshot.projectOrganizations.filter((projectOrganization) =>
      availableProjectIds.has(projectOrganization.projectId),
    ),
  };
}

export function resolveProjectDashboardData(
  snapshot: ProjectSnapshot,
): ProjectDashboardData {
  const normalizedSnapshot = normalizeProjectSnapshot(snapshot);

  if (normalizedSnapshot.projects.length === 0) {
    return buildEmptySupabaseProjectDashboardData(
      "Aucun chantier n'a encore ete cree ou rattache sur le perimetre Supabase courant.",
    );
  }

  if (normalizedSnapshot.projectOrganizations.length === 0) {
    return buildEmptySupabaseProjectDashboardData(
      "Aucun role chantier exploitable n'a encore ete rattache sur le perimetre Supabase courant.",
    );
  }

  return {
    projects: normalizedSnapshot.projects,
    projectOrganizations: normalizedSnapshot.projectOrganizations,
    source: "supabase",
    sourceDetail: `${normalizedSnapshot.projects.length} chantier(s) charge(s) depuis Supabase avec filtrage RLS.`,
  };
}

export async function loadProjectDashboardData(
  supabase: SupabaseClient<SupabaseDatabase> | null,
  organizationIds: string[],
): Promise<ProjectDashboardData> {
  if (!supabase) {
    return buildEmptySupabaseProjectDashboardData(
      "Configuration Supabase absente. Le module chantiers ne peut pas charger de donnees.",
    );
  }

  const uniqueOrganizationIds = Array.from(new Set(organizationIds));

  if (uniqueOrganizationIds.length === 0) {
    return resolveProjectDashboardData({
      projects: [],
      projectOrganizations: [],
    });
  }

  const projectScope = await loadServerProjectScope(supabase, uniqueOrganizationIds);

  if (!projectScope) {
    return buildEmptySupabaseProjectDashboardData(
      "Lecture des roles chantier indisponible pour le perimetre courant.",
    );
  }

  const projectOrganizations = projectScope.memberships.map((membership) => ({
    projectId: membership.projectId,
    organizationId: membership.organizationId,
    role: membership.role,
    isLead: membership.isLead,
  }));
  const projectIds = projectScope.accessibleProjectIds;

  if (projectIds.length === 0) {
    return resolveProjectDashboardData({
      projects: [],
      projectOrganizations,
    });
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .order("starts_on", { ascending: false, nullsFirst: false });

  if (projectsError) {
    return buildEmptySupabaseProjectDashboardData(
      "Lecture des chantiers indisponible dans Supabase pour le perimetre courant.",
    );
  }

  return resolveProjectDashboardData({
    projects: (projectsData ?? []).map(mapProjectRow),
    projectOrganizations,
  });
}
