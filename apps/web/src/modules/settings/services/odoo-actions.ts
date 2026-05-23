"use server";

import { revalidatePath } from "next/cache";

import {
  assertOrganizationAccess,
  loadServerOrganizationScope,
  ScopeGuardError,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { OdooMutationState } from "@/modules/settings/services/odoo-action-state";

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function upsertCustomerOdooMappingAction(
  _previousState: OdooMutationState,
  formData: FormData,
): Promise<OdooMutationState> {
  const organizationId = readRequiredField(formData, "organizationId");
  const odooModel = readRequiredField(formData, "odooModel");
  const odooRecordId = readRequiredField(formData, "odooRecordId");
  const syncStatus = readRequiredField(formData, "syncStatus") ?? "linked";

  if (!organizationId || !odooModel || !odooRecordId) {
    return {
      status: "error",
      mode: "demo",
      message: "Impossible d'enregistrer le mapping Odoo sans identifiants complets.",
    };
  }

  const supabaseClient = await createClient();

  if (!supabaseClient) {
    return {
      status: "success",
      mode: "demo",
      message: "Supabase indisponible. Le mapping Odoo reste simule.",
    };
  }

  const organizationScope = await loadServerOrganizationScope(supabaseClient);

  if (!organizationScope) {
    return {
      status: "error",
      mode: "supabase",
      message:
        "Le scope organisation de la session est introuvable. Reconnectez-vous avant de modifier les mappings Odoo.",
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
        "La session utilisateur est introuvable. Reconnectez-vous avant de modifier les mappings Odoo.",
    };
  }

  const adminbtpEntityId = organizationId;

  const { data: existingRow, error: existingError } = await supabaseClient
    .from("odoo_mappings")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("binding_type", "customer")
    .eq("adminbtp_entity_id", adminbtpEntityId)
    .maybeSingle();

  if (existingError) {
    return {
      status: "error",
      mode: "supabase",
      message: "Impossible de relire le mapping Odoo existant dans Supabase.",
    };
  }

  if (existingRow) {
    const { error: updateError } = await supabaseClient
      .from("odoo_mappings")
      .update({
        odoo_model: odooModel,
        odoo_record_id: odooRecordId,
        sync_status: syncStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRow.id)
      .eq("organization_id", organizationId);

    if (updateError) {
      return {
        status: "error",
        mode: "supabase",
        message: "La mise a jour du mapping Odoo a echoue dans Supabase.",
      };
    }

    revalidatePath("/odoo");

    return {
      status: "success",
      mode: "supabase",
      message: "Mapping client Odoo mis a jour dans Supabase.",
    };
  }

  const { error: insertError } = await supabaseClient.from("odoo_mappings").insert({
    organization_id: organizationId,
    binding_type: "customer",
    adminbtp_entity_id: adminbtpEntityId,
    odoo_model: odooModel,
    odoo_record_id: odooRecordId,
    sync_status: syncStatus,
    created_by: user.id,
  });

  if (insertError) {
    return {
      status: "error",
      mode: "supabase",
      message: "La creation du mapping Odoo a echoue dans Supabase.",
    };
  }

  revalidatePath("/odoo");

  return {
    status: "success",
    mode: "supabase",
    message: "Mapping client Odoo cree dans Supabase.",
  };
}
