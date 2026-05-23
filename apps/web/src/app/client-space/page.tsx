import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { ClientSpaceBoard } from "@/modules/client-space/components/client-space-board";
import {
  loadClientSpaceData,
  sanitizeClientCommentDraft,
} from "@/modules/client-space/services/client-space-data";
import { createClient } from "@/lib/supabase/server";

export default async function ClientSpacePage() {
  const supabase = await createClient();
  const data = await loadClientSpaceData(supabase);

  async function addCommentAction(formData: FormData) {
    "use server";

    const supabaseClient = await createClient();

    if (!supabaseClient || data.source !== "supabase") {
      return;
    }

    const organizationScope = await loadServerOrganizationScope(supabaseClient);

    if (!organizationScope) {
      return;
    }

    const workspaceItemId = formData.get("workspaceItemId")?.toString();
    const message = sanitizeClientCommentDraft({
      message: formData.get("message")?.toString(),
    });
    const workspaceItem = data.workspaceItems.find((item) => item.id === workspaceItemId);

    if (!workspaceItemId || !message || !workspaceItem) {
      return;
    }

    try {
      assertOrganizationAccess(organizationScope, workspaceItem.organizationId);
    } catch (error) {
      if (error instanceof ScopeGuardError) {
        return;
      }

      throw error;
    }

    // On ecrit un commentaire minimal rattache a l'item visible sans modifier le core.
    const { error } = await supabaseClient.from("client_feedback_threads").insert({
      organization_id: workspaceItem.organizationId,
      client_organization_id: workspaceItem.clientOrganizationId,
      project_id: workspaceItem.projectId ?? null,
      related_entity_id: workspaceItem.id,
      related_entity_type: workspaceItem.type,
      author_role: data.viewerMode === "internal" ? "adminbtp" : "client",
      message,
    });

    if (!error) {
      revalidatePath("/client-space");
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <ClientSpaceBoard data={data} addCommentAction={addCommentAction} />
      </div>
    </main>
  );
}
