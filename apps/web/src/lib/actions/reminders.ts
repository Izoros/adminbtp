"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@adminbtp/integrations";

/**
 * Relance d'une situation en retard — fournisseur email réel derrière IEmailProvider
 * (getEmailProvider() : Resend si RESEND_API_KEY est définie, DemoEmailProvider sinon). WhatsApp
 * reste reporté (IWhatsAppProvider non branché, voir docs/ROADMAP.md Phase 4). Chaque envoi crée
 * une trace (date, canal, situation). Le WhatsApp ne constitue jamais une signature électronique.
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
    // Destinataire : titulaire du lot de la situation s'il en a un, sinon organisation du
    // chantier — même logique de résolution que distributeMeetingNote (execution.ts).
    const { data: situation } = await supabase
      .from("situations")
      .select("lot_id, number, site_id")
      .eq("id", situationId)
      .single();
    let recipientOrgId: string | null = null;
    if (situation?.lot_id) {
      const { data: member } = await supabase
        .from("lot_members")
        .select("organization_id")
        .eq("lot_id", situation.lot_id)
        .eq("role", "TITULAIRE")
        .maybeSingle();
      recipientOrgId = member?.organization_id ?? null;
    }
    if (!recipientOrgId) {
      const { data: site } = await supabase.from("sites").select("organization_id").eq("id", siteId).single();
      recipientOrgId = site?.organization_id ?? null;
    }
    const { data: mailAddress } = recipientOrgId
      ? await supabase
          .from("mail_addresses")
          .select("address")
          .eq("organization_id", recipientOrgId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle()
      : { data: null };

    if (mailAddress?.address) {
      const provider = getEmailProvider();
      await provider.send({
        to: [mailAddress.address],
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        subject: `Relance — situation n°${situation?.number ?? ""} en attente`,
        htmlBody: `Relance automatique pour la situation ${situationId}.`,
      });
    } else {
      console.warn(`[RELANCE] Aucune boîte mail active pour la situation ${situationId} — relance tracée sans envoi.`);
    }
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
