 "use server";

import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  emailClassifications,
  type EmailMutationState,
} from "@/modules/emails/services/email-action-state";
import type { EmailClassification } from "@/modules/emails/types/email";

function normalizeOptionalLinkValue(value: FormDataEntryValue | null) {
  const normalizedValue = value?.toString().trim();

  return normalizedValue ? normalizedValue : null;
}

function isValidEmailClassification(value: string): value is EmailClassification {
  return emailClassifications.includes(value as EmailClassification);
}

export async function updateEmailClassificationAction(
  _state: EmailMutationState,
  formData: FormData,
): Promise<EmailMutationState> {
  const supabaseClient = await createClient();
  const emailId = formData.get("emailId")?.toString();

  if (!supabaseClient) {
    return {
      status: "error",
      mode: "supabase",
      emailId,
      message: "Supabase indisponible. La reclassification email est bloquee en mode production.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      emailId,
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de reclassifier un email.",
    };
  }

  const organizationId = formData.get("organizationId")?.toString();
  const classificationValue = formData.get("classification")?.toString();
  const projectId = normalizeOptionalLinkValue(formData.get("projectId"));
  const relatedTaskId = normalizeOptionalLinkValue(formData.get("relatedTaskId"));

  if (!emailId || !organizationId || !classificationValue) {
    return {
      status: "error",
      mode: "supabase",
      emailId,
      message: "Impossible de reclassifier un email sans identifiants ni classification valide.",
    };
  }

  if (!isValidEmailClassification(classificationValue)) {
    return {
      status: "error",
      mode: "supabase",
      emailId,
      message: "La classification email demandee n'est pas reconnue.",
    };
  }

  try {
    assertOrganizationAccess(organizationScope, organizationId);
  } catch (error) {
    if (error instanceof ScopeGuardError) {
      return {
        status: "error",
        mode: "supabase",
        emailId,
        message: error.message,
      };
    }

    throw error;
  }

  const { data, error } = await supabaseClient
    .from("emails")
    .update({
      classification: classificationValue,
      project_id: projectId,
      related_task_id: relatedTaskId,
    })
    .eq("id", emailId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      emailId,
      message: "Supabase a refuse la mise a jour de la classification email.",
    };
  }

  if (!data) {
    return {
      status: "error",
      mode: "supabase",
      emailId,
      message: "L'email cible est introuvable dans le perimetre courant.",
    };
  }

  revalidatePath("/emails");

  return {
    status: "success",
    mode: "supabase",
    emailId,
    message: "Classification et rattachement email enregistres dans Supabase.",
  };
}
