"use server";

import { revalidatePath } from "next/cache";

import {
  assertProjectAccess,
  loadServerOrganizationScope,
  loadServerProjectScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { PhaseStatus } from "@/modules/phases/types/project-phase";
import type { Tables } from "@/types/supabase";

type WritableSupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;
type ProjectPhaseRow = Tables<"project_phases">;
type PhaseChecklistItemRow = Tables<"phase_checklist_items">;
type PhaseAlertRow = Tables<"phase_alerts">;

export type PhaseMutationState = {
  status: "idle" | "success" | "error";
  mode: "supabase";
  message: string;
};

type WritablePhaseContext = {
  supabaseClient: WritableSupabaseClient;
  projectScope: NonNullable<Awaited<ReturnType<typeof loadServerProjectScope>>>;
};

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isPhaseStatusValue(value: string | null): value is PhaseStatus {
  return (
    value === "not_started" ||
    value === "in_progress" ||
    value === "blocked" ||
    value === "ready_for_review" ||
    value === "completed"
  );
}

async function resolveWritablePhaseContext(): Promise<
  WritablePhaseContext | PhaseMutationState
> {
  const supabaseClient = await createClient();

  if (!supabaseClient) {
    return {
      status: "error",
      mode: "supabase",
      message: "Supabase indisponible. Les mises a jour de phase sont bloquees en mode production.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de modifier les phases.",
    };
  }

  const projectScope = await loadServerProjectScope(
    supabaseClient,
    organizationScope.accessibleOrganizationIds,
  );

  if (!projectScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope projet de la session est introuvable. Reconnectez-vous avant de modifier les phases.",
    };
  }

  return {
    supabaseClient,
    projectScope,
  };
}

async function resolvePhaseRow(
  supabaseClient: WritableSupabaseClient,
  phaseId: string,
) {
  const query = await supabaseClient
    .from("project_phases")
    .select("*")
    .eq("id", phaseId)
    .maybeSingle();

  return query.data ?? null;
}

async function resolveChecklistItemContext(
  supabaseClient: WritableSupabaseClient,
  checklistItemId: string,
): Promise<{ checklistItemRow: PhaseChecklistItemRow; phaseRow: ProjectPhaseRow } | null> {
  const checklistQuery = await supabaseClient
    .from("phase_checklist_items")
    .select("*")
    .eq("id", checklistItemId)
    .maybeSingle();

  if (checklistQuery.error || !checklistQuery.data) {
    return null;
  }

  const phaseRow = await resolvePhaseRow(supabaseClient, checklistQuery.data.phase_id);

  if (!phaseRow) {
    return null;
  }

  return {
    checklistItemRow: checklistQuery.data,
    phaseRow,
  };
}

async function resolveAlertContext(
  supabaseClient: WritableSupabaseClient,
  alertId: string,
): Promise<{ alertRow: PhaseAlertRow; phaseRow: ProjectPhaseRow } | null> {
  const alertQuery = await supabaseClient
    .from("phase_alerts")
    .select("*")
    .eq("id", alertId)
    .maybeSingle();

  if (alertQuery.error || !alertQuery.data) {
    return null;
  }

  const phaseRow = await resolvePhaseRow(supabaseClient, alertQuery.data.phase_id);

  if (!phaseRow) {
    return null;
  }

  return {
    alertRow: alertQuery.data,
    phaseRow,
  };
}

function buildPhaseStatusPatch(currentStatus: PhaseStatus, nextStatus: PhaseStatus) {
  const updatedAt = new Date().toISOString();

  return {
    status: nextStatus,
    started_at:
      currentStatus === "not_started" && nextStatus !== "not_started"
        ? updatedAt
        : undefined,
    completed_at: nextStatus === "completed" ? updatedAt : null,
    updated_at: updatedAt,
  };
}

export async function togglePhaseChecklistItemAction(
  _previousState: PhaseMutationState,
  formData: FormData,
): Promise<PhaseMutationState> {
  const checklistItemId = readRequiredField(formData, "checklistItemId");
  const nextCompletedValue = readRequiredField(formData, "nextCompletedValue");

  if (!checklistItemId || !nextCompletedValue) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de mettre a jour la checklist sans identifiants complets.",
    };
  }

  const writableContext = await resolveWritablePhaseContext();

  if ("status" in writableContext) {
    return writableContext;
  }

  const itemContext = await resolveChecklistItemContext(
    writableContext.supabaseClient,
    checklistItemId,
  );

  if (!itemContext) {
    return {
      status: "error",
      mode: "supabase",
      message: "L'item de checklist cible est introuvable dans Supabase.",
    };
  }

  try {
    assertProjectAccess(writableContext.projectScope, {
      projectId: itemContext.phaseRow.project_id,
    });
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

  const nextCompleted = nextCompletedValue === "true";

  const { error } = await writableContext.supabaseClient
    .from("phase_checklist_items")
    .update({
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checklistItemId);

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "La mise a jour de la checklist a echoue dans Supabase.",
    };
  }

  revalidatePath("/phases");

  return {
    status: "success",
    mode: "supabase",
    message: "Checklist chantier mise a jour dans Supabase.",
  };
}

export async function updateProjectPhaseStatusAction(
  _previousState: PhaseMutationState,
  formData: FormData,
): Promise<PhaseMutationState> {
  const phaseId = readRequiredField(formData, "phaseId");
  const nextStatusValue = readRequiredField(formData, "nextStatus");

  if (!phaseId || !isPhaseStatusValue(nextStatusValue)) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de mettre a jour la phase sans statut valide.",
    };
  }

  const writableContext = await resolveWritablePhaseContext();

  if ("status" in writableContext) {
    return writableContext;
  }

  const phaseRow = await resolvePhaseRow(writableContext.supabaseClient, phaseId);

  if (!phaseRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "La phase cible est introuvable dans Supabase.",
    };
  }

  try {
    assertProjectAccess(writableContext.projectScope, {
      projectId: phaseRow.project_id,
    });
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

  const { error } = await writableContext.supabaseClient
    .from("project_phases")
    .update(buildPhaseStatusPatch(phaseRow.status, nextStatusValue))
    .eq("id", phaseId);

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "La mise a jour du statut de phase a echoue dans Supabase.",
    };
  }

  revalidatePath("/phases");

  return {
    status: "success",
    mode: "supabase",
    message: `Statut de phase mis a jour vers ${nextStatusValue}.`,
  };
}

export async function resolvePhaseAlertAction(
  _previousState: PhaseMutationState,
  formData: FormData,
): Promise<PhaseMutationState> {
  const alertId = readRequiredField(formData, "alertId");

  if (!alertId) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de traiter une alerte sans identifiant.",
    };
  }

  const writableContext = await resolveWritablePhaseContext();

  if ("status" in writableContext) {
    return writableContext;
  }

  const alertContext = await resolveAlertContext(writableContext.supabaseClient, alertId);

  if (!alertContext) {
    return {
      status: "error",
      mode: "supabase",
      message: "L'alerte cible est introuvable dans Supabase.",
    };
  }

  try {
    assertProjectAccess(writableContext.projectScope, {
      projectId: alertContext.phaseRow.project_id,
    });
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

  const { error } = await writableContext.supabaseClient
    .from("phase_alerts")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "La resolution de l'alerte a echoue dans Supabase.",
    };
  }

  revalidatePath("/phases");

  return {
    status: "success",
    mode: "supabase",
    message: "Alerte chantier resolue dans Supabase.",
  };
}
