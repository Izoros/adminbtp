import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ClientSpaceData } from "@/modules/client-space/services/client-space-data";
import { sanitizeClientCommentDraft } from "@/modules/client-space/services/client-space-data";

export type ClientSpaceMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export const initialClientSpaceMutationState: ClientSpaceMutationState = {
  status: "idle",
  mode: "demo",
  message: "",
};

export async function addCommentAction(
  data: ClientSpaceData,
  formData: FormData,
): Promise<ClientSpaceMutationState> {
  "use server";

  const supabaseClient = await createClient();

  if (!supabaseClient || data.source !== "supabase") {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. L'ajout de commentaire reste simule en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant d'ajouter un commentaire client.",
    };
  }

  const workspaceItemId = formData.get("workspaceItemId")?.toString();
  const message = sanitizeClientCommentDraft({
    message: formData.get("message")?.toString(),
  });
  const workspaceItem = data.workspaceItems.find((item) => item.id === workspaceItemId);

  if (!workspaceItemId || !message || !workspaceItem) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible d'ajouter un commentaire sans element visible ni message valide.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, workspaceItem.organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        message: error.message,
      };
    }

    throw error;
  }

  const { error } = await supabaseClient.from("client_feedback_threads").insert({
    organization_id: workspaceItem.organizationId,
    client_organization_id: workspaceItem.clientOrganizationId,
    project_id: workspaceItem.projectId ?? null,
    related_entity_id: workspaceItem.id,
    related_entity_type: workspaceItem.type,
    author_role: data.viewerMode === "internal" ? "adminbtp" : "client",
    message,
  });

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse la creation du commentaire client.",
    };
  }

  revalidatePath("/client-space");

  return {
    status: "success",
    mode: "supabase",
    message: "Commentaire client ajoute dans Supabase.",
  };
}
