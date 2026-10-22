"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Toutes les mutations passent par les fonctions SQL SECURITY DEFINER (request_service_access,
 * approve_access_request, grant_entitlement, etc.) — elles seules vérifient explicitement
 * ADMIN_PLATEFORME et écrivent l'historique immuable (entitlement_grants) + audit_log de façon
 * atomique. Ces Server Actions ne font qu'appeler le RPC et relayer son erreur ; aucune logique
 * d'autorisation n'est dupliquée ici. Voir database/migrations/0010_entitlements_phase_a.sql.
 */

function optionalString(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}

export async function requestServiceAccess(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const message = optionalString(formData, "message");

  if (!organizationId || !serviceId) {
    throw new Error("Organisation et service sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_service_access", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_message: message,
  });
  if (error) throw error;

  revalidatePath("/services");
}

export async function cancelAccessRequest(requestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_access_request", { p_request_id: requestId });
  if (error) throw error;

  revalidatePath("/services");
}

export async function approveAccessRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) throw new Error("Demande manquante.");
  const expiresAt = optionalString(formData, "expiresAt");
  const priceId = optionalString(formData, "priceId");
  const adminNote = optionalString(formData, "adminNote");

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_access_request", {
    p_request_id: requestId,
    p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    p_price_id: priceId,
    p_admin_note: adminNote,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}

export async function rejectAccessRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) throw new Error("Demande manquante.");
  const adminNote = optionalString(formData, "adminNote");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_access_request", {
    p_request_id: requestId,
    p_admin_note: adminNote,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}

export async function grantEntitlement(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const expiresAt = optionalString(formData, "expiresAt");
  const note = optionalString(formData, "note");
  const priceId = optionalString(formData, "priceId");
  const accessQuotaRaw = optionalString(formData, "accessQuota");

  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_entitlement", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    p_note: note,
    p_price_id: priceId,
    p_access_quota: accessQuotaRaw ? Number(accessQuotaRaw) : undefined,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}

export async function suspendEntitlement(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("suspend_entitlement", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}

export async function reactivateEntitlement(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const expiresAt = optionalString(formData, "expiresAt");
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reactivate_entitlement", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}

export async function extendEntitlement(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const newExpiresAt = optionalString(formData, "newExpiresAt");
  if (!organizationId || !serviceId || !newExpiresAt) {
    throw new Error("Organisation, service et nouvelle échéance sont obligatoires.");
  }
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("extend_entitlement", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_new_expires_at: new Date(newExpiresAt).toISOString(),
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}

export async function revokeEntitlement(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const reason = optionalString(formData, "reason");

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_entitlement", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_reason: reason,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}
