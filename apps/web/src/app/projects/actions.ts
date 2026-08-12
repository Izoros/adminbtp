"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  canManageOrganization,
  loadServerOrganizationScope,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { parseProjectDraft } from "@/modules/projects/services/project-write";

function buildRedirectUrl(searchKey: string, value: string) {
  return `/projects?${searchKey}=${encodeURIComponent(value)}`;
}

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      buildRedirectUrl(
        "projectError",
        "Supabase indisponible. La creation de chantier est bloquee en mode production.",
      ),
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect(
      buildRedirectUrl(
        "projectError",
        "Session Supabase indisponible. Connectez-vous pour creer un chantier reel.",
      ),
    );
  }

  const payload = (() => {
    try {
      return parseProjectDraft(formData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de lire le formulaire chantier.";

      redirect(buildRedirectUrl("projectError", message));
    }
  })();

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    redirect(
      buildRedirectUrl(
        "projectError",
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de creer un chantier.",
      ),
    );
  }

  // On interdit la creation de chantier pour une organisation hors perimetre de gestion.
  if (!canManageOrganization(organizationScope, payload.ownerOrganizationId)) {
    redirect(
      buildRedirectUrl(
        "projectError",
        "Vous ne pouvez pas creer un chantier pour cette organisation.",
      ),
    );
  }

  const { error } = await supabase.rpc("create_project_with_owner_role", {
    target_owner_organization_id: payload.ownerOrganizationId,
    target_code: payload.code,
    target_slug: payload.slug,
    target_name: payload.name,
    target_description: payload.description || undefined,
    target_status: payload.status,
    target_role: payload.role,
    target_starts_on: payload.startsOn ?? undefined,
    target_ends_on: payload.endsOn ?? undefined,
  });

  if (error) {
    redirect(
      buildRedirectUrl("projectError", `Creation impossible: ${error.message}`),
    );
  }

  revalidatePath("/projects");
  redirect(buildRedirectUrl("projectStatus", "created"));
}
