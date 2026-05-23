import type { OrganizationMembership } from "@/modules/organizations/types/organization";
import type { Project, ProjectOrganization, ProjectRoleView } from "@/modules/projects/types/project";
import { projectRoleViews } from "@/modules/projects/services/demo-projects";

export function getProjectOrganizationsForUser(
  userId: string,
  memberships: OrganizationMembership[],
  projectOrganizations: ProjectOrganization[],
) {
  const organizationIds = new Set(
    memberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.organizationId),
  );

  return projectOrganizations.filter((projectOrganization) =>
    organizationIds.has(projectOrganization.organizationId),
  );
}

export function getProjectsForUser(
  userId: string,
  memberships: OrganizationMembership[],
  projects: Project[],
  projectOrganizations: ProjectOrganization[],
) {
  const allowedProjectIds = new Set(
    getProjectOrganizationsForUser(userId, memberships, projectOrganizations).map(
      (projectOrganization) => projectOrganization.projectId,
    ),
  );

  return projects.filter((project) => allowedProjectIds.has(project.id));
}

export function getPrimaryProjectRoleView(
  userId: string,
  projectId: string,
  memberships: OrganizationMembership[],
  projectOrganizations: ProjectOrganization[],
) {
  const accessibleProjectOrganizations = getProjectOrganizationsForUser(
    userId,
    memberships,
    projectOrganizations,
  );

  const matchingProjectOrganization = accessibleProjectOrganizations.find(
    (projectOrganization) => projectOrganization.projectId === projectId,
  );

  if (!matchingProjectOrganization) {
    return null;
  }

  return projectRoleViews[matchingProjectOrganization.role] satisfies ProjectRoleView;
}
