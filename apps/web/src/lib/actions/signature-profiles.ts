"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Création basique du profil en base uniquement — aucune logique de signature réelle (génération,
 * horodatage, preuve) n'est traitée ici, voir Phase 5 du roadmap. `whatsappEnabled` n'autorise
 * qu'une preuve d'échange WhatsApp, jamais une signature électronique à elle seule.
 */
export async function createSignatureProfile(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const signerName = String(formData.get("signerName") ?? "").trim();
  const signerRole = String(formData.get("signerRole") ?? "").trim();
  const signatureStyle = String(formData.get("signatureStyle") ?? "").trim();
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";

  if (!organizationId || !label || !signerName || !signerRole || !signatureStyle) {
    throw new Error("Tous les champs du profil de signature sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("signature_profiles").insert({
    organization_id: organizationId,
    label,
    signer_name: signerName,
    signer_role: signerRole,
    signature_style: signatureStyle,
    whatsapp_enabled: whatsappEnabled,
    created_by_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath("/parametres");
}
