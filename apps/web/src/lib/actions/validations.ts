"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Approuver/Refuser ne touchent jamais isLegallyBindingSignature — une décision humaine à une
 * étape de contrôle n'est pas une signature électronique. Voir docs/VALIDATION_CHECKLIST.md.
 */
async function decide(validationId: string, decision: "APPROUVE" | "REFUSE") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("validation_records")
    .update({ decision, decided_by_user_id: user.id, decided_at: new Date().toISOString() })
    .eq("id", validationId);
  if (error) throw error;

  revalidatePath("/validations");
  revalidatePath("/dashboard");
}

export async function approveValidation(validationId: string) {
  await decide(validationId, "APPROUVE");
}

export async function refuseValidation(validationId: string) {
  await decide(validationId, "REFUSE");
}
