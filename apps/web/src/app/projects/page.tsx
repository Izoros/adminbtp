import { createClient } from "@/lib/supabase/server";
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
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
      </div>
    </main>
  );
}
