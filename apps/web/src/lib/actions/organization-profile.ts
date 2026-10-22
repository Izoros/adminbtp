"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LegalKind, OrganizationSizeBand, MissionRole } from "@adminbtp/types";

/**
 * Le profil ne crée aucun droit — sert de défaut à l'onboarding et au pré-filtre des modèles et
 * lots proposés. Le rôle effectif sur un chantier reste toujours `site_participants.missionRole`.
 */
export async function saveOrganizationProfile(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const legalKind = String(formData.get("legalKind") ?? "").trim() as LegalKind;
  const sizeBandRaw = String(formData.get("sizeBand") ?? "").trim();
  const defaultMissionRoles = formData.getAll("defaultMissionRoles").map(String) as MissionRole[];

  if (!organizationId || !legalKind) {
    throw new Error("Organisation et forme juridique sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organization_profiles").upsert(
    {
      organization_id: organizationId,
      legal_kind: legalKind,
      default_mission_roles: defaultMissionRoles,
      size_band: (sizeBandRaw || null) as OrganizationSizeBand | null,
    },
    { onConflict: "organization_id" }
  );
  if (error) throw error;

  revalidatePath("/parametres");
}

export async function saveOrganizationTrades(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const tradeCodeIds = formData.getAll("tradeCodeIds").map(String);
  const primaryTradeCodeId = String(formData.get("primaryTradeCodeId") ?? "").trim();

  if (!organizationId) throw new Error("Organisation obligatoire.");

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("organization_trades")
    .delete()
    .eq("organization_id", organizationId);
  if (deleteError) throw deleteError;

  if (tradeCodeIds.length > 0) {
    const { error: insertError } = await supabase.from("organization_trades").insert(
      tradeCodeIds.map((tradeCodeId) => ({
        organization_id: organizationId,
        trade_code_id: tradeCodeId,
        is_primary: tradeCodeId === primaryTradeCodeId,
      }))
    );
    if (insertError) throw insertError;
  }

  revalidatePath("/parametres");
}
