"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { ReserveSeverity, ReserveStatus, SiteLogEntryKind, PlanSubmissionStatus } from "@adminbtp/types";

// --- Visa ----------------------------------------------------------------

export async function createPlanSubmission(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const lotId = String(formData.get("lotId") ?? "").trim() || null;
  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!siteId || !documentId) throw new Error("Chantier et document sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const id = randomUUID();
  const { error } = await supabase.from("plan_submissions").insert({
    id,
    site_id: siteId,
    lot_id: lotId,
    document_id: documentId,
    author_user_id: user.id,
    status: "DEPOSE",
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/** La diffusion après visa vise le titulaire du lot déposant, pas tout le chantier (lotId porté par le dépôt). */
export async function reviewPlanSubmission(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as PlanSubmissionStatus;
  const remarks = String(formData.get("remarks") ?? "").trim();
  if (!submissionId || !status) throw new Error("Dépôt et décision sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("plan_submissions")
    .update({
      status,
      reviewed_by_user_id: user.id,
      reviewed_at: new Date().toISOString(),
      remarks: remarks || null,
    })
    .eq("id", submissionId)
    .eq("status", "DEPOSE");
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

// --- Réserves --------------------------------------------------------------

export async function createReserveItem(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const lotId = String(formData.get("lotId") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "").trim() as ReserveSeverity;
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!siteId || !description || !severity) {
    throw new Error("Chantier, description et gravité sont obligatoires.");
  }

  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("reserve_items").insert({
    id,
    site_id: siteId,
    lot_id: lotId,
    location: location || null,
    description,
    severity,
    due_date: dueDate || null,
    status: "OUVERTE",
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

export async function updateReserveStatus(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const reserveId = String(formData.get("reserveId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ReserveStatus;
  if (!reserveId || !status) throw new Error("Réserve et statut sont obligatoires.");

  const supabase = await createClient();
  const { error } = await supabase.from("reserve_items").update({ status }).eq("id", reserveId);
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

// --- Journal de chantier -----------------------------------------------------

export async function createSiteLogEntry(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim() as SiteLogEntryKind;
  const description = String(formData.get("description") ?? "").trim();

  if (!siteId || !entryDate || !kind || !description) {
    throw new Error("Chantier, date, nature et description sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("site_log_entries").insert({
    site_id: siteId,
    entry_date: entryDate,
    kind,
    description,
    author_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

// --- Comptes-rendus ----------------------------------------------------------

/**
 * Crée le compte-rendu, ses présences et ses décisions en une fois. Chaque décision crée
 * immédiatement une tâche existante (source_type MEETING) — le PDF COMPTE_RENDU reste un export
 * distinct, jamais généré automatiquement ici.
 */
export async function createMeetingNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  const decisionsText = String(formData.get("decisions") ?? "").trim();
  if (!siteId || !meetingDate) throw new Error("Chantier et date sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("organization_id")
    .eq("id", siteId)
    .single();
  if (siteError) throw siteError;

  const meetingId = randomUUID();
  const { error: meetingError } = await supabase.from("meeting_notes").insert({
    id: meetingId,
    site_id: siteId,
    meeting_date: meetingDate,
    created_by_user_id: user.id,
  });
  if (meetingError) throw meetingError;

  const decisionLines = decisionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const text of decisionLines) {
    const taskId = randomUUID();
    const { error: taskError } = await supabase.from("tasks").insert({
      id: taskId,
      organization_id: site.organization_id,
      site_id: siteId,
      title: text,
      status: "A_FAIRE",
      priority: "NORMALE",
      source_type: "MEETING",
      source_id: meetingId,
    });
    if (taskError) throw taskError;

    const { error: decisionError } = await supabase.from("meeting_decisions").insert({
      meeting_id: meetingId,
      text,
      task_id: taskId,
    });
    if (decisionError) throw decisionError;
  }

  revalidatePath(`/chantiers/${siteId}`);
}

// --- Avancement ----------------------------------------------------------------

export async function recordLotProgress(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim(); // revalidation uniquement
  const lotId = String(formData.get("lotId") ?? "").trim();
  const recordDate = String(formData.get("recordDate") ?? "").trim();
  const declaredPercentRaw = String(formData.get("declaredPercent") ?? "").trim();

  if (!lotId || !recordDate || !declaredPercentRaw) {
    throw new Error("Lot, date et pourcentage déclaré sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("lot_progress").insert({
    lot_id: lotId,
    record_date: recordDate,
    declared_percent: Number(declaredPercentRaw),
    created_by_user_id: user.id,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}
