"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  parseOrganizationDraft,
} from "@/modules/organizations/services/organization-write";

function buildRedirectUrl(searchKey: string, value: string) {
  return `/organizations?${searchKey}=${encodeURIComponent(value)}`;
}

export async function createOrganizationAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      buildRedirectUrl(
        "organizationError",
        "Supabase indisponible. La creation d'organisation est bloquee en mode production.",
      ),
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect(
      buildRedirectUrl(
        "organizationError",
        "Session Supabase indisponible. Connectez-vous pour creer une organisation reelle.",
      ),
    );
  }

  const payload = (() => {
    try {
      return parseOrganizationDraft(formData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de lire le formulaire organisation.";

      redirect(buildRedirectUrl("organizationError", message));
    }
  })();

  const { error } = await supabase.rpc("create_organization_with_owner", {
    target_name: payload.name,
    target_slug: payload.slug,
    target_legal_name: payload.legalName ?? undefined,
  });

  if (error) {
    redirect(
      buildRedirectUrl(
        "organizationError",
        `Creation impossible: ${error.message}`,
      ),
    );
  }

  revalidatePath("/organizations");
  revalidatePath("/projects");
  redirect(buildRedirectUrl("organizationStatus", "created"));
}
