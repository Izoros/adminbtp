"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Flux d'achat d'un modèle premium (Phase C du module Marketplace) — toutes les mutations
 * passent par des fonctions SQL SECURITY DEFINER (voir database/migrations/0042). L'annulation et
 * le refus réutilisent cancel_access_request()/reject_access_request() (Phase A, génériques,
 * aucune duplication) ; seule l'approbation est spécifique (crée template_purchases, jamais
 * organization_entitlements) — voir lib/actions/entitlements.ts pour le flux de service générique.
 */

function optionalString(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}

export async function requestTemplatePurchase(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const templateCatalogId = String(formData.get("templateCatalogId") ?? "").trim();
  const message = optionalString(formData, "message");

  if (!organizationId || !templateCatalogId) {
    throw new Error("Organisation et modèle sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_template_purchase", {
    p_organization_id: organizationId,
    p_template_catalog_id: templateCatalogId,
    p_message: message,
  });
  if (error) throw error;

  revalidatePath("/services");
}

export async function approveTemplatePurchaseRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) throw new Error("Demande manquante.");
  const adminNote = optionalString(formData, "adminNote");

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_template_purchase_request", {
    p_request_id: requestId,
    p_admin_note: adminNote,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/services");
}
