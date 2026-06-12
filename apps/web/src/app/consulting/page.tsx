import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { ConsultingDashboard } from "@/modules/consulting/components/consulting-dashboard";
import {
  createConsultingMissionAction,
  createExpertRequestAction,
  registerConsultingHourAction,
} from "@/modules/consulting/services/consulting-actions";
import {
  loadConsultingDashboardData,
} from "@/modules/consulting/services/consulting-data";
import { createClient } from "@/lib/supabase/server";

export default async function ConsultingPage() {
  const supabase = await createClient();
  const data = await loadConsultingDashboardData(supabase);

  async function createExpertRequestPageAction(formData: FormData) {
    "use server";

    await createExpertRequestAction(data, formData);
  }

  async function createConsultingMissionPageAction(formData: FormData) {
    "use server";

    await createConsultingMissionAction(data, formData);
  }

  async function registerConsultingHourPageAction(formData: FormData) {
    "use server";

    await registerConsultingHourAction(data, formData);
  }

  return (
    <ModulePageFrame>
      <ConsultingDashboard
        data={data}
        createExpertRequestAction={createExpertRequestPageAction}
        createConsultingMissionAction={createConsultingMissionPageAction}
        registerConsultingHourAction={registerConsultingHourPageAction}
      />
    </ModulePageFrame>
  );
}
