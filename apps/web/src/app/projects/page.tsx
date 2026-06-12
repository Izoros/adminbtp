import { createClient } from "@/lib/supabase/server";
import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { createProjectAction } from "@/app/projects/actions";
import { loadOrganizationAccessData } from "@/modules/organizations/services/organization-source";
import { ProjectDashboard } from "@/modules/projects/components/project-dashboard";
import { loadProjectDashboardData } from "@/modules/projects/services/project-source";
import { getProjectFeedbackFromSearchParams } from "@/modules/projects/services/project-write";

type ProjectsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const supabase = await createClient();
  const organizationAccessData = await loadOrganizationAccessData(supabase);
  const projectDashboardData = await loadProjectDashboardData(
    supabase,
    organizationAccessData.memberships.map((membership) => membership.organizationId),
  );
  const resolvedSearchParams = (await searchParams) ?? {};
  const feedback = getProjectFeedbackFromSearchParams(resolvedSearchParams);

  return (
    <ModulePageFrame>
      <ProjectDashboard
        user={organizationAccessData.user}
        organizations={organizationAccessData.organizations}
        memberships={organizationAccessData.memberships}
        projects={projectDashboardData.projects}
        projectOrganizations={projectDashboardData.projectOrganizations}
        source={projectDashboardData.source}
        sourceDetail={projectDashboardData.sourceDetail}
        feedback={feedback}
        createProjectAction={createProjectAction}
      />
    </ModulePageFrame>
  );
}
