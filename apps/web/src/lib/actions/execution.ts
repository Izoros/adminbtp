"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type {
  ReserveSeverity,
  ReserveStatus,
  SiteLogEntryKind,
  PlanSubmissionStatus,
  MeetingKind,
  AttendeeStatus,
} from "@adminbtp/types";

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

/** Correction a posteriori d'une réserve déjà créée — distincte du changement de statut ci-dessus. */
export async function updateReserveItem(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const reserveId = String(formData.get("reserveId") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "").trim() as ReserveSeverity;
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!reserveId || !description || !severity) {
    throw new Error("Réserve, description et gravité sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reserve_items")
    .update({
      location: location || null,
      description,
      severity,
      due_date: dueDate || null,
    })
    .eq("id", reserveId);
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

/** Correction a posteriori d'une entrée de journal déjà créée. */
export async function updateSiteLogEntry(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const entryId = String(formData.get("entryId") ?? "").trim();
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim() as SiteLogEntryKind;
  const description = String(formData.get("description") ?? "").trim();

  if (!entryId || !entryDate || !kind || !description) {
    throw new Error("Entrée, date, nature et description sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_log_entries")
    .update({ entry_date: entryDate, kind, description })
    .eq("id", entryId);
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

// --- Comptes-rendus ----------------------------------------------------------

/**
 * Seuls les participants OPC et MOE créent une réunion ou la font passer à VALIDE — vérifié ici
 * via site_participants, pas par une policy RLS (le rôle chantier n'est pas un axe d'isolation
 * multi-tenant, même choix que pour les actes, voir acts.ts).
 */
async function assertOpcOrMoe(supabase: Awaited<ReturnType<typeof createClient>>, siteId: string, organizationId: string) {
  const { data: participation } = await supabase
    .from("site_participants")
    .select("id")
    .eq("site_id", siteId)
    .eq("organization_id", organizationId)
    .in("mission_role", ["OPC", "MOE"])
    .is("left_at", null)
    .maybeSingle();
  if (!participation) {
    throw new Error("Seule une organisation avec le rôle OPC ou MOE actif sur ce chantier peut créer ou valider une réunion.");
  }
}

/**
 * Crée le compte-rendu, ses présences (une ligne par organisation participante active, statut
 * par défaut Présent) et ses décisions en une fois. Chaque décision crée immédiatement une tâche
 * existante (source_type MEETING), assignée à l'organisation choisie — le PDF COMPTE_RENDU reste
 * un export distinct, jamais généré automatiquement ici.
 */
export async function createMeetingNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OPC").trim() as MeetingKind;
  const numberRaw = String(formData.get("number") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  const decisionsText = String(formData.get("decisions") ?? "").trim();
  const assignedOrganizationId = String(formData.get("assignedOrganizationId") ?? "").trim();
  const decisionsDueDate = String(formData.get("decisionsDueDate") ?? "").trim();
  if (!siteId || !organizationId || !meetingDate) {
    throw new Error("Chantier, organisation et date sont obligatoires.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  await assertOpcOrMoe(supabase, siteId, organizationId);

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("organization_id")
    .eq("id", siteId)
    .single();
  if (siteError) throw siteError;

  const { data: participants, error: participantsError } = await supabase
    .from("site_participants")
    .select("organization_id")
    .eq("site_id", siteId)
    .is("left_at", null);
  if (participantsError) throw participantsError;
  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, legal_name")
    .in("id", (participants ?? []).map((p) => p.organization_id));
  if (organizationsError) throw organizationsError;

  const meetingId = randomUUID();
  const { error: meetingError } = await supabase.from("meeting_notes").insert({
    id: meetingId,
    site_id: siteId,
    kind,
    number: numberRaw ? Number(numberRaw) : null,
    meeting_date: meetingDate,
    author_organization_id: organizationId,
    status: "BROUILLON",
    created_by_user_id: user.id,
  });
  if (meetingError) throw meetingError;

  for (const org of organizations ?? []) {
    const status = String(formData.get(`attendeeStatus:${org.id}`) ?? "PRESENT").trim() as AttendeeStatus;
    const { error: attendeeError } = await supabase.from("meeting_attendees").insert({
      meeting_id: meetingId,
      organization_id: org.id,
      name: org.legal_name,
      status,
    });
    if (attendeeError) throw attendeeError;
  }

  const decisionLines = decisionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const text of decisionLines) {
    const taskId = randomUUID();
    const { error: taskError } = await supabase.from("tasks").insert({
      id: taskId,
      organization_id: assignedOrganizationId || site.organization_id,
      site_id: siteId,
      title: text,
      status: "A_FAIRE",
      priority: "NORMALE",
      due_date: decisionsDueDate || null,
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

/**
 * Un compte-rendu VALIDE est figé — la policy RLS le garantit aussi (migration 0031), ce contrôle
 * sert à renvoyer un message clair plutôt qu'une mise à jour silencieuse de zéro ligne.
 */
async function assertMeetingDraft(supabase: Awaited<ReturnType<typeof createClient>>, meetingId: string) {
  const { data: meeting, error } = await supabase
    .from("meeting_notes")
    .select("status")
    .eq("id", meetingId)
    .single();
  if (error) throw error;
  if (meeting.status !== "BROUILLON") {
    throw new Error("Ce compte-rendu est validé : il ne peut plus être modifié.");
  }
}

/**
 * Correction a posteriori de la date d'un compte-rendu encore en brouillon. Les décisions et les
 * tâches qu'elles ont engendrées ne sont pas modifiées ici — seule la date de la réunion l'est.
 */
export async function updateMeetingNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const meetingId = String(formData.get("meetingId") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  if (!meetingId || !meetingDate) throw new Error("Compte-rendu et date sont obligatoires.");

  const supabase = await createClient();
  await assertMeetingDraft(supabase, meetingId);
  const { error } = await supabase
    .from("meeting_notes")
    .update({ meeting_date: meetingDate })
    .eq("id", meetingId)
    .eq("status", "BROUILLON");
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/** Point d'ordre du jour — référence une tâche, un document ou une entrée de journal, ou un texte libre. */
export async function addMeetingAgendaItem(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const meetingId = String(formData.get("meetingId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim() || null;
  const documentId = String(formData.get("documentId") ?? "").trim() || null;
  const sourceLogEntryId = String(formData.get("sourceLogEntryId") ?? "").trim() || null;
  const text = String(formData.get("text") ?? "").trim() || null;
  if (!meetingId || (!taskId && !documentId && !sourceLogEntryId && !text)) {
    throw new Error("Réunion et au moins une référence ou un texte sont obligatoires.");
  }

  const supabase = await createClient();
  await assertMeetingDraft(supabase, meetingId);
  const { error } = await supabase.from("meeting_agenda_items").insert({
    meeting_id: meetingId,
    task_id: taskId,
    document_id: documentId,
    source_log_entry_id: sourceLogEntryId,
    text,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
}

/** Fait passer un compte-rendu de BROUILLON à VALIDE — réservé OPC/MOE, comme la création. */
export async function validateMeetingNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const meetingId = String(formData.get("meetingId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  if (!meetingId || !organizationId) throw new Error("Réunion et organisation sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  await assertOpcOrMoe(supabase, siteId, organizationId);

  const { data: validated, error } = await supabase
    .from("meeting_notes")
    .update({ status: "VALIDE", validated_at: new Date().toISOString(), validated_by_user_id: user.id })
    .eq("id", meetingId)
    .eq("status", "BROUILLON")
    .select("id");
  if (error) throw error;
  if (!validated || validated.length === 0) throw new Error("Ce compte-rendu est déjà validé.");

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
