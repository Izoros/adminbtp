import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ConsultingDashboardData } from "@/modules/consulting/services/consulting-data";
import { sanitizeExpertRequestDraft } from "@/modules/consulting/services/consulting-data";

export type ConsultingMutationState = {
  status: "idle" | "success" | "error";
  mode: "demo" | "supabase";
  message: string;
};

export const initialConsultingMutationState: ConsultingMutationState = {
  status: "idle",
  mode: "demo",
  message: "",
};

export async function createExpertRequestAction(
  data: ConsultingDashboardData,
  formData: FormData,
): Promise<ConsultingMutationState> {
  "use server";

  const supabaseClient = await createClient();

  if (!supabaseClient || data.source !== "supabase" || !data.currentOrganizationId) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. La creation reste simulee en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de creer une demande d'expertise.",
    };
  }

  const draft = sanitizeExpertRequestDraft({
    title: formData.get("title")?.toString(),
    requestType: formData.get("requestType")?.toString(),
    relatedEntityType: formData.get("relatedEntityType")?.toString(),
    relatedEntityId: formData.get("relatedEntityId")?.toString(),
    description: formData.get("description")?.toString(),
  });

  if (!draft) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de creer la demande sans titre ni type d'assistance valides.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      mode: "supabase",
      message: "La session utilisateur est introuvable. Reconnectez-vous avant de creer une demande.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, data.currentOrganizationId);
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

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse la creation de la demande d'expertise.",
    };
  }

  revalidatePath("/consulting");

  return {
    status: "success",
    mode: "supabase",
    message: "Demande d'expertise creee dans Supabase.",
  };
}
