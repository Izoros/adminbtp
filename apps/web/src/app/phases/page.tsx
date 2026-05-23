import { createClient } from "@/lib/supabase/server";
import { loadOrganizationAccessData } from "@/modules/organizations/services/organization-source";
import { ProjectPhaseBoard } from "@/modules/phases/components/project-phase-board";
import { loadPhaseDashboardData } from "@/modules/phases/services/phase-source";

export default async function PhasesPage() {
  const supabase = await createClient();
  const organizationAccessData = await loadOrganizationAccessData(supabase);
  const phaseDashboardData = await loadPhaseDashboardData(
    supabase,
    organizationAccessData.memberships.map((membership) => membership.organizationId),
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <ProjectPhaseBoard
          activeRole={phaseDashboardData.activeRole}
          phases={phaseDashboardData.phases}
          checklistItems={phaseDashboardData.checklistItems}
          alerts={phaseDashboardData.alerts}
          source={phaseDashboardData.source}
          sourceDetail={phaseDashboardData.sourceDetail}
        />
      </div>
    </main>
  );
}
