"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { SiteStatus } from "@adminbtp/types";

export async function createSite(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const status = String(formData.get("status") ?? "ETUDE") as SiteStatus;
  const budgetHtRaw = String(formData.get("budgetHt") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDateEstimated = String(formData.get("endDateEstimated") ?? "").trim();
  const managerUserId = String(formData.get("managerUserId") ?? "").trim();

  if (!organizationId || !name || !reference || !address || !city) {
    throw new Error("Organisation, nom, référence, adresse et ville sont obligatoires.");
  }

  // Id généré côté serveur et une insertion sans RETURNING : sur Postgres 17, RETURNING
  // applique aussi la policy SELECT (sites_select_shared, via can_access_site()), qui est
  // STABLE et lit sites/site_participants avec l'instantané de la requête — elle ne voit donc
  // pas la ligne que cette même instruction est en train d'insérer. Voir docs/DECISIONS.md.
  const id = randomUUID();

  const supabase = await createClient();
  const { error } = await supabase.from("sites").insert({
    id,
    organization_id: organizationId,
    name,
    reference,
    address,
    city,
    postal_code: postalCode || null,
    status,
    budget_ht: budgetHtRaw ? Number(budgetHtRaw) : null,
    start_date: startDate || null,
    end_date_estimated: endDateEstimated || null,
    manager_user_id: managerUserId || null,
  });

  if (error) throw error;

  revalidatePath("/chantiers");
  revalidatePath("/dashboard");
  redirect(`/chantiers/${id}`);
}
