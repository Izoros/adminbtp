import { ProjectPhaseBoard } from "@/modules/phases/components/project-phase-board";
import {
  demoPhaseAlerts,
  demoPhaseChecklistItems,
  demoProjectPhases,
} from "@/modules/phases/services/demo-phases";

export default function PhasesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <ProjectPhaseBoard
          activeRole="moe"
          phases={demoProjectPhases}
          checklistItems={demoPhaseChecklistItems}
          alerts={demoPhaseAlerts}
        />
      </div>
    </main>
  );
}
