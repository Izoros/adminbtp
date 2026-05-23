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
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <ConsultingDashboard
          data={data}
          createExpertRequestAction={createExpertRequestPageAction}
          createConsultingMissionAction={createConsultingMissionPageAction}
          registerConsultingHourAction={registerConsultingHourPageAction}
        />
      </div>
    </main>
  );
}
