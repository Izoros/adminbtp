"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Toutes les mutations passent par les fonctions SQL SECURITY DEFINER (activate_subscription,
 * suspend_subscription, add_credits, etc.) — elles seules vérifient explicitement
 * ADMIN_PLATEFORME et écrivent audit_log de façon atomique avec la mutation d'état commercial.
 * Ces Server Actions ne font qu'appeler le RPC et relayer son erreur ; aucune logique
 * d'autorisation n'est dupliquée ici. Voir
 * database/migrations/0048_phase_d_subscription_lifecycle_functions.sql et
 * 0049_phase_d_credit_engine_functions.sql.
 *
 * Pas d'UI de paiement réel ici (hors scope Phase D, voir docs/ROADMAP.md Phase E/7) : ajouter
 * des crédits ou activer un abonnement n'enregistre qu'une contrepartie commerciale décidée par
 * un Super Administrateur, jamais un encaissement.
 */

function optionalString(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}

export async function activateSubscription(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const expiresAt = optionalString(formData, "expiresAt");
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_subscription", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
}

export async function suspendSubscription(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("suspend_subscription", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
}

export async function reactivateSubscription(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const expiresAt = optionalString(formData, "expiresAt");
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reactivate_subscription", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
}

export async function extendSubscription(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const newExpiresAt = optionalString(formData, "newExpiresAt");
  if (!organizationId || !serviceId || !newExpiresAt) {
    throw new Error("Organisation, service et nouvelle échéance sont obligatoires.");
  }
  const note = optionalString(formData, "note");

  const supabase = await createClient();
  const { error } = await supabase.rpc("extend_subscription", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_new_expires_at: new Date(newExpiresAt).toISOString(),
    p_note: note,
  });
  if (error) throw error;

  revalidatePath("/admin");
}

export async function cancelSubscription(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  if (!organizationId || !serviceId) throw new Error("Organisation et service sont obligatoires.");
  const reason = optionalString(formData, "reason");

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_subscription", {
    p_organization_id: organizationId,
    p_service_id: serviceId,
    p_reason: reason,
  });
  if (error) throw error;

  revalidatePath("/admin");
}

export async function addCredits(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const reason = optionalString(formData, "reason");
  if (!organizationId || !amountRaw || !reason) {
    throw new Error("Organisation, montant et raison sont obligatoires.");
  }
  const amount = Number(amountRaw);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Le montant à créditer doit être un entier strictement positif.");
  }
  const walletExpiresAt = optionalString(formData, "walletExpiresAt");

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_credits", {
    p_organization_id: organizationId,
    p_amount: amount,
    p_reason: reason,
    p_wallet_expires_at: walletExpiresAt ? new Date(walletExpiresAt).toISOString() : undefined,
  });
  if (error) throw error;

  revalidatePath("/admin");
}
