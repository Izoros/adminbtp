"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LotMemberRole } from "@adminbtp/types";

export async function addLotMember(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim(); // revalidation uniquement
  const lotId = String(formData.get("lotId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as LotMemberRole;
  const sharePercentRaw = String(formData.get("sharePercent") ?? "").trim();

  if (!lotId || !organizationId || !role) {
    throw new Error("Lot, organisation et rôle sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lot_members").insert({
    lot_id: lotId,
    organization_id: organizationId,
    role,
    share_percent: sharePercentRaw ? Number(sharePercentRaw) : null,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
