"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export async function createAmendment(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const lotId = String(formData.get("lotId") ?? "").trim() || null;
  const numberRaw = String(formData.get("number") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const deltaHtRaw = String(formData.get("deltaHt") ?? "").trim();
  const sourceLogEntryId = String(formData.get("sourceLogEntryId") ?? "").trim() || null;

  if (!siteId || !numberRaw || !reason || !deltaHtRaw) {
    throw new Error("Chantier, numéro, motif et delta HT sont obligatoires.");
  }

  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("amendments").insert({
    id,
    site_id: siteId,
    lot_id: lotId,
    number: Number(numberRaw),
    reason,
    delta_ht: Number(deltaHtRaw),
    status: "BROUILLON",
    source_log_entry_id: sourceLogEntryId,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/**
 * Une fois VALIDE, les lignes de prix rattachées (price_lines.amendmentId) entrent dans les
 * décomptes suivants, distinctes du DPGF d'origine — jamais une quantité ajoutée en silence.
 */
export async function decideAmendment(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const amendmentId = String(formData.get("amendmentId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim(); // "VALIDE" | "REFUSE"
  if (!amendmentId || (decision !== "VALIDE" && decision !== "REFUSE")) {
    throw new Error("Avenant et décision sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("amendments")
    .update({
      status: decision,
      validated_at: new Date().toISOString(),
      validated_by_user_id: user.id,
    })
    .eq("id", amendmentId)
    .eq("status", "BROUILLON");
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
