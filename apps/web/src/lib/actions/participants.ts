"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MissionRole } from "@adminbtp/types";

/**
 * Remplacement d'intervenant : clôturer sans réécrire l'historique. Les OS/décomptes passés
 * référencent le lot/l'organisation, pas cette ligne — aucune donnée n'est modifiée en cascade.
 */
export async function endParticipation(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const participantId = String(formData.get("participantId") ?? "").trim();
  if (!participantId) throw new Error("Participation obligatoire.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("id", participantId)
    .is("left_at", null);
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

export async function addParticipant(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const missionRole = String(formData.get("missionRole") ?? "").trim() as MissionRole;
  const lotId = String(formData.get("lotId") ?? "").trim() || null;
  const contractAmountHtRaw = String(formData.get("contractAmountHt") ?? "").trim();

  if (!siteId || !organizationId || !missionRole) {
    throw new Error("Chantier, organisation et rôle sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_participants").insert({
    site_id: siteId,
    organization_id: organizationId,
    mission_role: missionRole,
    lot_id: lotId,
    contract_amount_ht: contractAmountHtRaw ? Number(contractAmountHtRaw) : null,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
