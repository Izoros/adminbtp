"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateOrganizationProfile(organizationId: string, formData: FormData) {
  const legalName = String(formData.get("legalName") ?? "").trim();
  const siret = String(formData.get("siret") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      legal_name: legalName,
      siret: siret || null,
      city: city || null,
      postal_code: postalCode || null,
    })
    .eq("id", organizationId);
  if (error) throw error;

  revalidatePath("/parametres");
  revalidatePath("/organisations");
}
