"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CredentialKind, CredentialStatus } from "@adminbtp/types";

/**
 * Le statut est déclaré à la saisie, mais une échéance dépassée fait toujours afficher "Expirée"
 * côté UI quel que soit le statut stocké — aucune échéance codée en dur ni laissée obsolète.
 */
export async function saveOrganizationCredential(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim() as CredentialKind;
  const expiresOn = String(formData.get("expiresOn") ?? "").trim();
  const status = String(formData.get("status") ?? "VALIDE").trim() as CredentialStatus;

  if (!organizationId || !kind) {
    throw new Error("Organisation et type de pièce sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organization_credentials").insert({
    organization_id: organizationId,
    kind,
    expires_on: expiresOn || null,
    status,
  });
  if (error) throw error;

  revalidatePath("/parametres");
}

export async function updateCredentialStatus(formData: FormData) {
  const credentialId = String(formData.get("credentialId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as CredentialStatus;
  if (!credentialId || !status) throw new Error("Pièce et statut sont obligatoires.");

  const supabase = await createClient();
  const { error } = await supabase.from("organization_credentials").update({ status }).eq("id", credentialId);
  if (error) throw error;

  revalidatePath("/parametres");
}
