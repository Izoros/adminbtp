import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ClientSpaceData } from "@/modules/client-space/services/client-space-data";
import {
  formatClientDecisionMessage,
  sanitizeClientCommentDraft,
} from "@/modules/client-space/services/client-space-data";
import type { ClientDecision } from "@/modules/client-space/types/client-space";

type WritableSupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

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

function resolveWorkspaceItemFromFormData(
  data: ClientSpaceData,
  formData: FormData,
) {
  const workspaceItemId = formData.get("workspaceItemId")?.toString();
  const workspaceItem = data.workspaceItems.find((item) => item.id === workspaceItemId);

  return {
    workspaceItemId,
    workspaceItem,
  };
}

async function resolveWritableClientSpaceContext(
  data: ClientSpaceData,
  workspaceItemOrganizationId: string,
): Promise<
  | {
      supabaseClient: WritableSupabaseClient;
    }
  | ClientSpaceMutationState
> {
  const supabaseClient = await createClient();

  if (!supabaseClient || data.source !== "supabase") {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. L'ecriture client reste simulee en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant d'ecrire depuis l'espace client.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, workspaceItemOrganizationId);
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

  return {
    supabaseClient,
  };
}

export async function addCommentAction(
  data: ClientSpaceData,
  formData: FormData,
): Promise<ClientSpaceMutationState> {
  "use server";

  const { workspaceItemId, workspaceItem } = resolveWorkspaceItemFromFormData(data, formData);
  const message = sanitizeClientCommentDraft({
    message: formData.get("message")?.toString(),
  });

  if (!workspaceItemId || !message || !workspaceItem) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible d'ajouter un commentaire sans element visible ni message valide.",
    };
  }

  const writableContext = await resolveWritableClientSpaceContext(
    data,
    workspaceItem.organizationId,
  );

  if ("status" in writableContext) {
    return writableContext;
  }

  const { error } = await writableContext.supabaseClient.from("client_feedback_threads").insert({
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

export async function submitWorkspaceDecisionAction(
  data: ClientSpaceData,
  formData: FormData,
): Promise<ClientSpaceMutationState> {
  "use server";

  const { workspaceItemId, workspaceItem } = resolveWorkspaceItemFromFormData(data, formData);
  const decision = formData.get("decision")?.toString() as ClientDecision | undefined;
  const message = sanitizeClientCommentDraft({
    message: formData.get("message")?.toString(),
  });

  if (
    !workspaceItemId ||
    !workspaceItem ||
    !decision ||
    !["approved", "rejected", "commented"].includes(decision)
  ) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible d'enregistrer cette decision client sur l'element courant.",
    };
  }

  const writableContext = await resolveWritableClientSpaceContext(
    data,
    workspaceItem.organizationId,
  );

  if ("status" in writableContext) {
    return writableContext;
  }

  const decisionMessage = formatClientDecisionMessage({
    decision,
    message,
  });

  const { error } = await writableContext.supabaseClient.from("client_feedback_threads").insert({
    organization_id: workspaceItem.organizationId,
    client_organization_id: workspaceItem.clientOrganizationId,
    project_id: workspaceItem.projectId ?? null,
    related_entity_id: workspaceItem.id,
    related_entity_type: workspaceItem.type,
    author_role: data.viewerMode === "internal" ? "adminbtp" : "client",
    message: decisionMessage,
  });

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse l'enregistrement de la decision client.",
    };
  }

  revalidatePath("/client-space");

  return {
    status: "success",
    mode: "supabase",
    message:
      decision === "approved"
        ? "Decision client enregistree : validation."
        : decision === "rejected"
          ? "Decision client enregistree : refus."
          : "Decision client enregistree : demande d'ajustements.",
  };
}
