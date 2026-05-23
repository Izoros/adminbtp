import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { generateFollowupSchedule } from "@/modules/followups/services/followup-schedule";
import type {
  FollowupFeedback,
  FollowupStatus,
  Situation,
} from "@/modules/followups/types/followup";
import type { Tables } from "@/types/supabase";

type SituationRow = Tables<"situations">;

const allowedFollowupStatuses: FollowupStatus[] = [
  "scheduled",
  "sent",
  "done",
  "cancelled",
];

function mapSituationRow(situation: SituationRow): Situation {
  return {
    id: situation.id,
    organizationId: situation.organization_id,
    projectId: situation.project_id ?? undefined,
    reference: situation.reference,
    customerName: situation.customer_name,
    amountCents: situation.amount_cents,
    currencyCode: situation.currency_code,
    issuedOn: situation.issued_on,
    dueOn: situation.due_on,
    status: situation.status,
  };
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeReturnTo(rawValue: string | null) {
  if (!rawValue || !rawValue.startsWith("/followups")) {
    return "/followups";
  }

  return rawValue;
}

function buildRedirectPath(
  returnTo: string | null,
  feedback: FollowupFeedback,
) {
  const target = new URL(normalizeReturnTo(returnTo), "https://adminbtp.local");
  const parameterName =
    feedback.tone === "success"
      ? "followupStatus"
      : feedback.tone === "error"
        ? "followupError"
        : "followupInfo";

  target.searchParams.set(parameterName, feedback.message);
  return `${target.pathname}${target.search}`;
}

function redirectWithFeedback(returnTo: string | null, feedback: FollowupFeedback): never {
  redirect(buildRedirectPath(returnTo, feedback));
}

export async function syncFollowupScheduleAction(formData: FormData) {
  "use server";

  const situationId = readRequiredField(formData, "situationId");
  const organizationId = readRequiredField(formData, "organizationId");
  const returnTo = readRequiredField(formData, "returnTo");

  if (!situationId || !organizationId) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "Impossible de synchroniser les relances sans situation ni organisation.",
    });
  }

  const supabase = await createClient();

  if (!supabase) {
    redirectWithFeedback(returnTo, {
      tone: "info",
      message: "Supabase indisponible. La synchronisation des relances reste simulee.",
    });
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de synchroniser les relances.",
    });
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      redirectWithFeedback(returnTo, {
        tone: "error",
        message: error.message,
      });
    }

    throw error;
  }

  const { data: situationRow, error: situationError } = await supabase
    .from("situations")
    .select("*")
    .eq("id", situationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (situationError || !situationRow) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "La situation cible est introuvable dans Supabase.",
    });
  }

  const followups = generateFollowupSchedule(mapSituationRow(situationRow));

  // On remplace completement le planning pour garder une projection deterministe.
  const { error: deleteError } = await supabase
    .from("payment_followups")
    .delete()
    .eq("situation_id", situationId)
    .eq("organization_id", organizationId);

  if (deleteError) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "Impossible de nettoyer les anciennes relances dans Supabase.",
    });
  }

  const { error: insertError } = await supabase.from("payment_followups").insert(
    followups.map((followup) => ({
      situation_id: followup.situationId,
      organization_id: followup.organizationId,
      step_label: followup.stepLabel,
      days_after_due: followup.daysAfterDue,
      scheduled_for: followup.scheduledFor,
      status: followup.status,
    })),
  );

  if (insertError) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "La creation du planning de relance a echoue dans Supabase.",
    });
  }

  revalidatePath("/followups");

  redirectWithFeedback(returnTo, {
    tone: "success",
    message: "Le planning de relance a ete persiste dans Supabase.",
  });
}

export async function updateFollowupStatusAction(formData: FormData) {
  "use server";

  const followupId = readRequiredField(formData, "followupId");
  const organizationId = readRequiredField(formData, "organizationId");
  const nextStatus = readRequiredField(formData, "nextStatus");
  const returnTo = readRequiredField(formData, "returnTo");

  if (!followupId || !organizationId || !nextStatus) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "Impossible de mettre a jour une relance sans identifiants complets.",
    });
  }

  if (!allowedFollowupStatuses.includes(nextStatus as FollowupStatus)) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "Le statut demande pour la relance est invalide.",
    });
  }

  const supabase = await createClient();

  if (!supabase) {
    redirectWithFeedback(returnTo, {
      tone: "info",
      message: "Supabase indisponible. La mise a jour de relance reste simulee.",
    });
  }

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de piloter les relances.",
    });
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      redirectWithFeedback(returnTo, {
        tone: "error",
        message: error.message,
      });
    }

    throw error;
  }

  const { error: updateError } = await supabase
    .from("payment_followups")
    .update({
      status: nextStatus as FollowupStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", followupId)
    .eq("organization_id", organizationId);

  if (updateError) {
    redirectWithFeedback(returnTo, {
      tone: "error",
      message: "La mise a jour du statut de relance a echoue dans Supabase.",
    });
  }

  revalidatePath("/followups");

  redirectWithFeedback(returnTo, {
    tone: "success",
    message: `Le statut de la relance est maintenant ${nextStatus}.`,
  });
}

export function getFollowupFeedbackFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): FollowupFeedback | undefined {
  const status = searchParams.followupStatus;
  const error = searchParams.followupError;
  const info = searchParams.followupInfo;

  if (typeof error === "string" && error.length > 0) {
    return { tone: "error", message: error };
  }

  if (typeof status === "string" && status.length > 0) {
    return { tone: "success", message: status };
  }

  if (typeof info === "string" && info.length > 0) {
    return { tone: "info", message: info };
  }

  return undefined;
}
