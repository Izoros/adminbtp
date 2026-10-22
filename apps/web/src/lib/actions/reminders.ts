"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DemoEmailProvider } from "@adminbtp/integrations";

/**
 * Relance d'une situation en retard — brancherait un fournisseur réel derrière IEmailProvider/
 * IWhatsAppProvider ; ici Demo* sans I/O réseau. Chaque envoi crée une trace (date, canal,
 * situation). Le WhatsApp ne constitue jamais une signature électronique.
 */
export async function sendReminder(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const situationId = String(formData.get("situationId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim() as "EMAIL" | "WHATSAPP" | "COURRIER";
  if (!situationId || !channel) throw new Error("Situation et canal sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  if (channel === "EMAIL") {
    const provider = new DemoEmailProvider();
    await provider.send({
      to: ["demo@adminbtp.test"],
      from: "relances@adminbtp.test",
      subject: "Relance — situation en attente",
      htmlBody: `Relance automatique pour la situation ${situationId}.`,
    });
  } else {
    console.warn(`[DEMO] Relance ${channel} simulée pour la situation ${situationId} — aucun I/O réseau.`);
  }

  const { error } = await supabase.from("reminder_logs").insert({
    situation_id: situationId,
    channel,
    created_by_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/** Scanne les trois conditions de relance interne et crée les tâches manquantes (idempotent). */
export async function runInternalReminderCheck(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  if (!siteId) throw new Error("Chantier obligatoire.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("check_internal_reminders", { p_site_id: siteId });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
  revalidatePath("/taches");
}
