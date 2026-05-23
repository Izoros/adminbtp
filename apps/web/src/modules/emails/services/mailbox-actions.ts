"use server";

import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { MailboxMutationState } from "@/modules/emails/services/mailbox-action-state";

type MailboxProvider = "internal" | "gmail" | "outlook";

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isMailboxProvider(value: string | null): value is MailboxProvider {
  return value === "internal" || value === "gmail" || value === "outlook";
}

export async function createMailboxAction(
  _state: MailboxMutationState,
  formData: FormData,
): Promise<MailboxMutationState> {
  const organizationId = readRequiredField(formData, "organizationId");
  const address = readRequiredField(formData, "address");
  const displayName = readRequiredField(formData, "displayName");
  const providerValue = readRequiredField(formData, "provider");

  if (!organizationId || !address || !displayName || !isMailboxProvider(providerValue)) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible de creer une boite sans organisation, adresse, libelle et provider valides.",
    };
  }

  const supabaseClient = await createClient();

  if (!supabaseClient) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. La creation de boite reste simulee.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de creer une boite.",
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

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "La session utilisateur est introuvable. Reconnectez-vous avant de creer une boite.",
    };
  }

  const { error } = await supabaseClient.from("mailboxes").insert({
    organization_id: organizationId,
    address,
    display_name: displayName,
    provider: providerValue,
    created_by: user.id,
  });

  if (error) {
    return {
      status: "error",
      mode: "supabase",
      message: "La creation de la boite a echoue dans Supabase.",
    };
  }

  revalidatePath("/emails");
  revalidatePath("/n8n");

  return {
    status: "success",
    mode: "supabase",
    message: "Boite generique creee dans Supabase.",
  };
}
