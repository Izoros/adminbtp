import { createClient } from "@/lib/supabase/server";
import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { loadOrganizationAccessData } from "@/modules/organizations/services/organization-source";
import { ProjectPhaseBoard } from "@/modules/phases/components/project-phase-board";
import {
  resolvePhaseAlertAction,
  togglePhaseChecklistItemAction,
  updateProjectPhaseStatusAction,
} from "@/modules/phases/services/phase-actions";
import { loadPhaseDashboardData } from "@/modules/phases/services/phase-source";

export default async function PhasesPage() {
  const supabase = await createClient();
  const organizationAccessData = await loadOrganizationAccessData(supabase);
  const phaseDashboardData = await loadPhaseDashboardData(
    supabase,
    organizationAccessData.memberships.map((membership) => membership.organizationId),
  );

  return (
    <ModulePageFrame>
      <ProjectPhaseBoard
        activeRole={phaseDashboardData.activeRole}
        phases={phaseDashboardData.phases}
        checklistItems={phaseDashboardData.checklistItems}
        alerts={phaseDashboardData.alerts}
        source={phaseDashboardData.source}
        sourceDetail={phaseDashboardData.sourceDetail}
        toggleChecklistAction={togglePhaseChecklistItemAction}
        updatePhaseStatusAction={updateProjectPhaseStatusAction}
        resolveAlertAction={resolvePhaseAlertAction}
      />
    </ModulePageFrame>
  );
}
