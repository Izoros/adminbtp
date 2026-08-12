"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  canManageOrganization,
  loadServerOrganizationScope,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  parseProjectDraft,
  type ProjectErrorCode,
} from "@/modules/projects/services/project-write";

function buildRedirectUrl(searchKey: string, value: string) {
  return `/projects?${searchKey}=${encodeURIComponent(value)}`;
}

function buildProjectErrorRedirect(code: ProjectErrorCode) {
  return buildRedirectUrl("projectErrorCode", code);
}

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      buildProjectErrorRedirect("supabase_unavailable"),
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect(
      buildProjectErrorRedirect("session_unavailable"),
    );
  }

  const payload = (() => {
    try {
      return parseProjectDraft(formData);
    } catch {
      redirect(buildProjectErrorRedirect("invalid_form"));
    }
  })();

  const organizationScope = await loadServerOrganizationScope(supabase);

  if (!organizationScope) {
    redirect(
      buildProjectErrorRedirect("scope_unavailable"),
    );
  }

  // On interdit la creation de chantier pour une organisation hors perimetre de gestion.
  if (!canManageOrganization(organizationScope, payload.ownerOrganizationId)) {
    redirect(
      buildProjectErrorRedirect("organization_forbidden"),
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
    console.error("[AdminBTP][projects] create_project_failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    redirect(buildProjectErrorRedirect("create_failed"));
  }

  revalidatePath("/projects");
  redirect(buildRedirectUrl("projectStatus", "created"));
}
