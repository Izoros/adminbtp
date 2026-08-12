"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type WhatsAppCommandReviewState = {
  status: "idle" | "success" | "error";
  message: string;
};

const commandIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readFormField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function reviewWhatsAppCommandAction(
  _previousState: WhatsAppCommandReviewState,
  formData: FormData,
): Promise<WhatsAppCommandReviewState> {
  const commandId = readFormField(formData, "commandId");
  const decision = readFormField(formData, "decision");

  if (!commandIdPattern.test(commandId)) {
    return { status: "error", message: "Identifiant de commande invalide." };
  }

  if (decision !== "approve" && decision !== "reject") {
    return { status: "error", message: "Decision de revue invalide." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { status: "error", message: "Supabase indisponible pour cette revue." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Une session valide est requise." };
  }

  const { data: isPlatformAdmin, error: roleError } = await supabase.rpc(
    "is_platform_admin",
  );

  if (roleError || !isPlatformAdmin) {
    return {
      status: "error",
      message: "La revue est reservee aux administrateurs plateforme.",
    };
  }

  const { data, error } = await supabase.rpc("review_whatsapp_command", {
    target_command_id: commandId,
    target_decision: decision,
  });

  if (error || !data?.[0]) {
    return {
      status: "error",
      message: "La commande n'a pas pu etre revue dans son etat actuel.",
    };
  }

  revalidatePath("/admin/commands");

  return {
    status: "success",
    message:
      decision === "approve"
        ? "Demande approuvee. Aucune action n'a ete executee."
        : "Demande refusee et conservee dans le journal.",
  };
}
