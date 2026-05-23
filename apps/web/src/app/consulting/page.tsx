import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { ConsultingDashboard } from "@/modules/consulting/components/consulting-dashboard";
import {
  loadConsultingDashboardData,
  sanitizeExpertRequestDraft,
} from "@/modules/consulting/services/consulting-data";
import { createClient } from "@/lib/supabase/server";

export default async function ConsultingPage() {
  const supabase = await createClient();
  const data = await loadConsultingDashboardData(supabase);

  async function createExpertRequestAction(formData: FormData) {
    "use server";

    const supabaseClient = await createClient();

    if (!supabaseClient || data.source !== "supabase" || !data.currentOrganizationId) {
      return;
    }

    const organizationScope = await loadServerOrganizationScope(supabaseClient);

    if (!organizationScope) {
      return;
    }

    const draft = sanitizeExpertRequestDraft({
      title: formData.get("title")?.toString(),
      requestType: formData.get("requestType")?.toString(),
      relatedEntityType: formData.get("relatedEntityType")?.toString(),
      relatedEntityId: formData.get("relatedEntityId")?.toString(),
      description: formData.get("description")?.toString(),
    });

    if (!draft) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return;
    }

    try {
      assertOrganizationAccess(organizationScope, data.currentOrganizationId);
    } catch (error) {
      if (error instanceof ScopeGuardError) {
        return;
      }

      throw error;
    }

    // On cree une demande minimale rattachee a l'organisation courante sans dependre du core.
    const { error } = await supabaseClient.from("expert_requests").insert({
      organization_id: data.currentOrganizationId,
      title: draft.title,
      description: draft.description,
      request_type: draft.requestType,
      related_entity_type: draft.relatedEntityType,
      related_entity_id: draft.relatedEntityId,
      delivery_mode: "human",
      intake_channel: "platform",
      requested_by_email: user.email ?? null,
      requested_by_name: user.user_metadata.full_name ?? user.email ?? null,
      status: "submitted",
    });

    if (!error) {
      revalidatePath("/consulting");
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <ConsultingDashboard
          data={data}
          createExpertRequestAction={createExpertRequestAction}
        />
      </div>
    </main>
  );
}
