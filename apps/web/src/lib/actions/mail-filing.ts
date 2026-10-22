"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { DocumentCategory } from "@adminbtp/types";

/**
 * Classe un mail déjà lié à un chantier : la catégorie est confirmée par un humain (pré-remplie
 * par une suggestion Demo* calculée côté page, jamais appliquée automatiquement ici), et crée soit
 * une tâche, soit un document BROUILLON. N'ingère jamais de boîte mail réelle.
 */
export async function classifyMailThread(formData: FormData) {
  const threadId = String(formData.get("threadId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as DocumentCategory;
  const lotId = String(formData.get("lotId") ?? "").trim() || null;
  const action = String(formData.get("action") ?? "").trim(); // "TASK" | "DOCUMENT"
  const title = String(formData.get("title") ?? "").trim();

  if (!threadId || !category || !action || !title) {
    throw new Error("Mail, catégorie, action et titre sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: thread, error: threadError } = await supabase
    .from("mail_threads")
    .select("organization_id, site_id")
    .eq("id", threadId)
    .single();
  if (threadError) throw threadError;
  if (!thread.site_id) throw new Error("Ce mail n'est pas rattaché à un chantier.");

  if (action === "DOCUMENT") {
    const id = randomUUID();
    const status = category === "PPSPS" ? "PREEDITION" : "BROUILLON";
    const { error } = await supabase.from("documents").insert({
      id,
      organization_id: thread.organization_id,
      site_id: thread.site_id,
      lot_id: lotId,
      category,
      title,
      status,
      file_url: `demo://documents/${id}.pdf`,
      created_by_user_id: user.id,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("tasks").insert({
      organization_id: thread.organization_id,
      site_id: thread.site_id,
      title,
      status: "A_FAIRE",
      priority: "NORMALE",
      source_type: "MAIL",
      source_id: threadId,
    });
    if (error) throw error;
  }

  const { error: statusError } = await supabase
    .from("mail_threads")
    .update({ status: "AFFECTE" })
    .eq("id", threadId);
  if (statusError) throw statusError;

  revalidatePath("/mails");
  revalidatePath(`/chantiers/${thread.site_id}`);
}
