"use server";

import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateSuggestionGovernance,
  normalizeSuggestionReviewDecision,
} from "@/modules/ai/services/ai-governance";
import type { AiMutationState } from "@/modules/ai/services/ai-action-state";
import {
  mapAiSuggestionAuditLogRow,
  mapAiSuggestionRow,
} from "@/modules/ai/services/ai-data";
import type { AiSuggestionStatus } from "@/modules/ai/types/ai";
import type { Tables } from "@/types/supabase";

type WritableSupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;
type AiSuggestionRow = Tables<"ai_suggestions">;

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function resolveWritableAiContext(): Promise<
  | {
      supabaseClient: WritableSupabaseClient;
      organizationScope: NonNullable<Awaited<ReturnType<typeof loadServerOrganizationScope>>>;
      userId: string;
    }
  | AiMutationState
> {
  const supabaseClient = await createClient();

  if (!supabaseClient) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. Les validations IA restent simulees.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de traiter une suggestion IA.",
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
      message:
        "La session utilisateur est introuvable. Reconnectez-vous avant de traiter une suggestion IA.",
    };
  }

  return {
    supabaseClient,
    organizationScope,
    userId: user.id,
  };
}

async function resolveSuggestionRow(
  supabaseClient: WritableSupabaseClient,
  suggestionId: string,
): Promise<AiSuggestionRow | null> {
  const { data, error } = await supabaseClient
    .from("ai_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function insertSuggestionAuditLog(input: {
  supabaseClient: WritableSupabaseClient;
  suggestionId: string;
  actorId: string;
  action: string;
  details: Record<string, string>;
}) {
  return input.supabaseClient.from("ai_suggestion_audit_logs").insert({
    ai_suggestion_id: input.suggestionId,
    actor_type: "user",
    actor_id: input.actorId,
    action: input.action,
    details: input.details,
  });
}

export async function reviewAiSuggestionAction(
  _previousState: AiMutationState,
  formData: FormData,
): Promise<AiMutationState> {
  const suggestionId = readRequiredField(formData, "suggestionId");
  const decision = normalizeSuggestionReviewDecision(
    formData.get("decision")?.toString(),
  );

  if (!suggestionId || !decision) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de traiter la suggestion IA sans identifiants complets.",
    };
  }

  const writableContext = await resolveWritableAiContext();

  if ("status" in writableContext) {
    return writableContext;
  }

  const suggestionRow = await resolveSuggestionRow(
    writableContext.supabaseClient,
    suggestionId,
  );

  if (!suggestionRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "La suggestion IA cible est introuvable dans Supabase.",
    };
  }

  try {
    assertOrganizationAccess(
      writableContext.organizationScope,
      suggestionRow.organization_id,
    );
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

  const now = new Date().toISOString();
  const { error: updateError } = await writableContext.supabaseClient
    .from("ai_suggestions")
    .update({
      status: decision,
      validated_by: writableContext.userId,
      validated_at: now,
    })
    .eq("id", suggestionId)
    .eq("organization_id", suggestionRow.organization_id);

  if (updateError) {
    return {
      status: "error",
      mode: "supabase",
      message: "La mise a jour de la suggestion IA a echoue dans Supabase.",
    };
  }

  await insertSuggestionAuditLog({
    supabaseClient: writableContext.supabaseClient,
    suggestionId,
    actorId: writableContext.userId,
    action: decision,
    details: {
      origin: "ai_page",
      message:
        decision === "approved"
          ? "Validation humaine depuis l'interface IA."
          : "Rejet humain depuis l'interface IA.",
    },
  });

  revalidatePath("/ai");

  return {
    status: "success",
    mode: "supabase",
    message:
      decision === "approved"
        ? "Suggestion IA approuvee dans Supabase."
        : "Suggestion IA rejetee dans Supabase.",
  };
}

function isSuggestionApprovableStatus(status: string): status is AiSuggestionStatus {
  return (
    status === "proposed" ||
    status === "pending_human_validation" ||
    status === "approved" ||
    status === "rejected" ||
    status === "applied"
  );
}

export async function applyAiSuggestionAction(
  _previousState: AiMutationState,
  formData: FormData,
): Promise<AiMutationState> {
  const suggestionId = readRequiredField(formData, "suggestionId");

  if (!suggestionId) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible d'appliquer une suggestion IA sans identifiant.",
    };
  }

  const writableContext = await resolveWritableAiContext();

  if ("status" in writableContext) {
    return writableContext;
  }

  const suggestionRow = await resolveSuggestionRow(
    writableContext.supabaseClient,
    suggestionId,
  );

  if (!suggestionRow) {
    return {
      status: "error",
      mode: "supabase",
      message: "La suggestion IA cible est introuvable dans Supabase.",
    };
  }

  try {
    assertOrganizationAccess(
      writableContext.organizationScope,
      suggestionRow.organization_id,
    );
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

  if (!isSuggestionApprovableStatus(suggestionRow.status)) {
    return {
      status: "error",
      mode: "supabase",
      message: "Le statut de la suggestion IA est invalide.",
    };
  }

  if (suggestionRow.status !== "approved") {
    return {
      status: "error",
      mode: "supabase",
      message: "Une suggestion IA doit etre approuvee avant application.",
    };
  }

  const { data: logRows, error: logError } = await writableContext.supabaseClient
    .from("ai_suggestion_audit_logs")
    .select("*")
    .eq("ai_suggestion_id", suggestionId)
    .order("created_at", { ascending: false });

  if (logError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de relire l'audit IA avant application.",
    };
  }

  const mappedSuggestion = mapAiSuggestionRow(suggestionRow);
  const auditLogs = (logRows ?? []).map(mapAiSuggestionAuditLogRow);
  const governanceIssues = evaluateSuggestionGovernance(mappedSuggestion, auditLogs);

  if (governanceIssues.some((issue) => issue.severity === "critical")) {
    return {
      status: "error",
      mode: "supabase",
      message: "La gouvernance bloque cette suggestion IA tant qu'une anomalie critique subsiste.",
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await writableContext.supabaseClient
    .from("ai_suggestions")
    .update({
      status: "applied",
      applied_at: now,
      validated_by: suggestionRow.validated_by ?? writableContext.userId,
      validated_at: suggestionRow.validated_at ?? now,
    })
    .eq("id", suggestionId)
    .eq("organization_id", suggestionRow.organization_id);

  if (updateError) {
    return {
      status: "error",
      mode: "supabase",
      message: "L'application de la suggestion IA a echoue dans Supabase.",
    };
  }

  await insertSuggestionAuditLog({
    supabaseClient: writableContext.supabaseClient,
    suggestionId,
    actorId: writableContext.userId,
    action: "applied",
    details: {
      origin: "ai_page",
      message: "Application humaine apres validation et controle de gouvernance.",
    },
  });

  revalidatePath("/ai");

  return {
    status: "success",
    mode: "supabase",
    message: "Suggestion IA appliquee dans Supabase.",
  };
}
