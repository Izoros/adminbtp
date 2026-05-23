import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ConsultingDashboardData } from "@/modules/consulting/services/consulting-data";
import { sanitizeExpertRequestDraft } from "@/modules/consulting/services/consulting-data";
import type { Tables } from "@/types/supabase";

type WritableSupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;
type ExpertRequestRow = Tables<"expert_requests">;
type ConsultingMissionRow = Tables<"consulting_missions">;

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

function readTrimmedField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readPositiveNumberField(formData: FormData, key: string) {
  const rawValue = readTrimmedField(formData, key);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue.replace(",", "."));
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function readNonNegativeNumberField(formData: FormData, key: string) {
  const rawValue = readTrimmedField(formData, key);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue.replace(",", "."));
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function isIsoDateValue(value: string | null) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function resolveWritableConsultingContext(
  data: ConsultingDashboardData,
  organizationId: string,
): Promise<
  | {
      supabaseClient: WritableSupabaseClient;
      expertRequestRow: ExpertRequestRow | null;
      missionRow: ConsultingMissionRow | null;
    }
  | ConsultingMutationState
> {
  const supabaseClient = await createClient();

  if (!supabaseClient || data.source !== "supabase") {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. L'ecriture consulting reste simulee en mode demonstration.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de modifier le consulting.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
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

  const requestQuery = data.request
    ? await supabaseClient
        .from("expert_requests")
        .select("*")
        .eq("id", data.request.id)
        .eq("organization_id", organizationId)
        .maybeSingle()
    : { data: null, error: null };

  if (requestQuery.error) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de relire la demande d'expertise dans Supabase.",
    };
  }

  const missionQuery = data.mission
    ? await supabaseClient
        .from("consulting_missions")
        .select("*")
        .eq("id", data.mission.id)
        .eq("organization_id", organizationId)
        .maybeSingle()
    : { data: null, error: null };

  if (missionQuery.error) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de relire la mission de conseil dans Supabase.",
    };
  }

  return {
    supabaseClient,
    expertRequestRow: requestQuery.data,
    missionRow: missionQuery.data,
  };
}

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

export async function createConsultingMissionAction(
  data: ConsultingDashboardData,
  formData: FormData,
): Promise<ConsultingMutationState> {
  "use server";

  const organizationId = data.currentOrganizationId;
  const title = readTrimmedField(formData, "title");
  const description = readTrimmedField(formData, "description");
  const soldHours = readPositiveNumberField(formData, "soldHours");
  const leadExpertId = readTrimmedField(formData, "leadExpertId");

  if (!organizationId || !data.request) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de creer une mission sans organisation ni demande d'expertise active.",
    };
  }

  if (!title || soldHours === null) {
    return {
      status: "error",
      mode: "demo",
      message: "Le titre de mission et le volume d'heures vendues sont obligatoires.",
    };
  }

  if (
    leadExpertId &&
    !data.expertProfiles.some((expertProfile) => expertProfile.id === leadExpertId)
  ) {
    return {
      status: "error",
      mode: "demo",
      message: "L'expert selectionne est introuvable sur l'organisation courante.",
    };
  }

  if (data.mission) {
    return {
      status: "error",
      mode: "supabase",
      message: "Une mission est deja ouverte pour cette demande d'expertise.",
    };
  }

  const writableContext = await resolveWritableConsultingContext(data, organizationId);

  if ("status" in writableContext) {
    return writableContext;
  }

  if (!writableContext.expertRequestRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "La demande d'expertise cible est introuvable dans Supabase.",
    };
  }

  const missionPayload = {
    organization_id: organizationId,
    expert_request_id: writableContext.expertRequestRow.id,
    lead_expert_id: leadExpertId,
    title,
    description,
    status: "approved" as const,
    billing_mode: "hourly" as const,
    related_entity_type: writableContext.expertRequestRow.related_entity_type,
    related_entity_id: writableContext.expertRequestRow.related_entity_id,
    sold_hours: soldHours,
    consumed_hours: 0,
  };

  const { error: missionError } = await writableContext.supabaseClient
    .from("consulting_missions")
    .insert(missionPayload);

  if (missionError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse la creation de la mission de conseil.",
    };
  }

  revalidatePath("/consulting");

  return {
    status: "success",
    mode: "supabase",
    message: "Mission de conseil creee dans Supabase.",
  };
}

export async function registerConsultingHourAction(
  data: ConsultingDashboardData,
  formData: FormData,
): Promise<ConsultingMutationState> {
  "use server";

  const organizationId = data.currentOrganizationId;
  const workDate = readTrimmedField(formData, "workDate");
  const hoursSpent = readPositiveNumberField(formData, "hoursSpent");
  const billableHours = readNonNegativeNumberField(formData, "billableHours");
  const expertProfileId = readTrimmedField(formData, "expertProfileId");
  const activityType = readTrimmedField(formData, "activityType");
  const notes = readTrimmedField(formData, "notes");

  if (!organizationId || !data.mission) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible d'enregistrer une heure sans mission de conseil active.",
    };
  }

  if (!isIsoDateValue(workDate) || hoursSpent === null || billableHours === null) {
    return {
      status: "error",
      mode: "demo",
      message: "La date, le temps passe et le temps facturable doivent etre valides.",
    };
  }

  const normalizedWorkDate = workDate as string;

  if (billableHours > hoursSpent) {
    return {
      status: "error",
      mode: "demo",
      message: "Le temps facturable ne peut pas depasser le temps passe.",
    };
  }

  if (
    expertProfileId &&
    !data.expertProfiles.some((expertProfile) => expertProfile.id === expertProfileId)
  ) {
    return {
      status: "error",
      mode: "demo",
      message: "L'expert selectionne pour la saisie d'heures est introuvable.",
    };
  }

  const writableContext = await resolveWritableConsultingContext(data, organizationId);

  if ("status" in writableContext) {
    return writableContext;
  }

  if (!writableContext.missionRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "La mission cible est introuvable dans Supabase.",
    };
  }

  const { error: insertError } = await writableContext.supabaseClient
    .from("consulting_hours")
    .insert({
      consulting_mission_id: writableContext.missionRow.id,
      expert_profile_id: expertProfileId,
      work_date: normalizedWorkDate,
      hours_spent: hoursSpent,
      billable_hours: billableHours,
      activity_type: activityType,
      notes,
      related_entity_type: writableContext.missionRow.related_entity_type,
      related_entity_id: writableContext.missionRow.related_entity_id,
    });

  if (insertError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase a refuse l'enregistrement de l'heure de conseil.",
    };
  }

  const { error: missionUpdateError } = await writableContext.supabaseClient
    .from("consulting_missions")
    .update({
      consumed_hours: writableContext.missionRow.consumed_hours + hoursSpent,
      status:
        writableContext.missionRow.status === "approved"
          ? "in_progress"
          : writableContext.missionRow.status,
      started_at:
        writableContext.missionRow.started_at ??
        new Date(`${normalizedWorkDate}T08:00:00.000Z`).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", writableContext.missionRow.id)
    .eq("organization_id", organizationId);

  if (missionUpdateError) {
    return {
      status: "error",
      mode: "supabase",
      message: "L'heure a ete creee, mais la mise a jour du cumul mission a echoue.",
    };
  }

  revalidatePath("/consulting");

  return {
    status: "success",
    mode: "supabase",
    message: "Heure de conseil enregistree dans Supabase.",
  };
}
