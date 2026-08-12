"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  parseOrganizationDraft,
  type OrganizationErrorCode,
} from "@/modules/organizations/services/organization-write";

function buildRedirectUrl(searchKey: string, value: string) {
  return `/organizations?${searchKey}=${encodeURIComponent(value)}`;
}

function buildOrganizationErrorRedirect(code: OrganizationErrorCode) {
  return buildRedirectUrl("organizationErrorCode", code);
}

export async function createOrganizationAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      buildOrganizationErrorRedirect("supabase_unavailable"),
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect(
      buildOrganizationErrorRedirect("session_unavailable"),
    );
  }

  const payload = (() => {
    try {
      return parseOrganizationDraft(formData);
    } catch {
      redirect(buildOrganizationErrorRedirect("invalid_form"));
    }
  })();

  const { error } = await supabase.rpc("create_organization_with_owner", {
    target_name: payload.name,
    target_slug: payload.slug,
    target_legal_name: payload.legalName ?? undefined,
  });

  if (error) {
    console.error("[AdminBTP][organizations] create_organization_failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    redirect(buildOrganizationErrorRedirect("create_failed"));
  }

  revalidatePath("/organizations");
  revalidatePath("/projects");
  redirect(buildRedirectUrl("organizationStatus", "created"));
}
