"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ORGANIZATION_TIMEZONE, matchesPostalCodePatterns } from "@adminbtp/types";

/** "976xx, 97600" (une ligne, séparateurs virgule) → ["976xx", "97600"] — tolère les lignes vides. */
function parsePostalCodePatterns(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length > 0);
}

export async function updateOrganizationProfile(organizationId: string, formData: FormData) {
  const legalName = String(formData.get("legalName") ?? "").trim();
  const siret = String(formData.get("siret") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim() || DEFAULT_ORGANIZATION_TIMEZONE;
  const postalCodePatterns = parsePostalCodePatterns(String(formData.get("postalCodePatterns") ?? ""));

  if (!matchesPostalCodePatterns(postalCode, postalCodePatterns)) {
    throw new Error("Le code postal ne correspond à aucun des formats autorisés pour cette organisation.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      legal_name: legalName,
      siret: siret || null,
      city: city || null,
      postal_code: postalCode || null,
      timezone,
      postal_code_patterns: postalCodePatterns.length > 0 ? postalCodePatterns : null,
    })
    .eq("id", organizationId);
  if (error) throw error;

  revalidatePath("/parametres");
  revalidatePath("/organisations");
}
