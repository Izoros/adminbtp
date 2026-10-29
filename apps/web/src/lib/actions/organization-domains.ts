"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * `domain` est unique globalement (pas seulement par organisation, voir
 * database/migrations/0005_multitenant_saas_requirements.sql) — un conflit (domaine déjà
 * rattaché à une autre organisation) remonte l'erreur Postgres telle quelle, sans message
 * dupliqué côté UI.
 */
export async function addOrganizationDomain(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim().toLowerCase();
  if (!organizationId || !domain) {
    throw new Error("Organisation et domaine sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organization_domains").insert({
    organization_id: organizationId,
    domain,
  });
  if (error) throw error;

  revalidatePath("/parametres");
}

export async function removeOrganizationDomain(formData: FormData) {
  const domainId = String(formData.get("domainId") ?? "").trim();
  if (!domainId) throw new Error("Domaine manquant.");

  const supabase = await createClient();
  const { error } = await supabase.from("organization_domains").delete().eq("id", domainId);
  if (error) throw error;

  revalidatePath("/parametres");
}
