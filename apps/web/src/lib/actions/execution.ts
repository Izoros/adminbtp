"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { DemoEmailProvider } from "@adminbtp/integrations";
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

/**
 * Suppression douce d'une réserve : masquée des écrans, motif obligatoire, trace audit_log. Le RPC
 * vérifie l'accès au chantier (voir database/migrations/0032_soft_delete_journal_reserves_cr.sql).
 */
export async function deleteReserveItem(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const reserveId = String(formData.get("reserveId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reserveId || !reason) throw new Error("Réserve et motif sont obligatoires.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_reserve_item", { p_reserve_id: reserveId, p_reason: reason });
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

/**
 * Suppression douce d'une entrée de journal. Refusée par le RPC tant que l'entrée est citée par un
 * document, un avenant ou un point d'ordre du jour d'un compte-rendu non supprimé.
 */
export async function deleteSiteLogEntry(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const entryId = String(formData.get("entryId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!entryId || !reason) throw new Error("Entrée et motif sont obligatoires.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_site_log_entry", { p_entry_id: entryId, p_reason: reason });
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
  if (!siteId || !organizationId || !meetingDate) {
    throw new Error("Chantier, organisation et date sont obligatoires.");
  }

  // Décisions saisies ligne par ligne (DecisionRows, client) : chacune porte son propre lot,
  // organisation assignée et échéance — plus un formulaire unique appliqué à tout le lot.
  const decisionRowCount = Number(formData.get("decisionRowCount") ?? "0") || 0;
  const decisionRows: { text: string; lotId: string | null; assignedOrganizationId: string | null; dueDate: string | null }[] = [];
  for (let i = 0; i < decisionRowCount; i++) {
    const text = String(formData.get(`decisionText_${i}`) ?? "").trim();
    if (!text) continue;
    decisionRows.push({
      text,
      lotId: String(formData.get(`decisionLotId_${i}`) ?? "").trim() || null,
      assignedOrganizationId: String(formData.get(`decisionOrganizationId_${i}`) ?? "").trim() || null,
      dueDate: String(formData.get(`decisionDueDate_${i}`) ?? "").trim() || null,
    });
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

  for (const row of decisionRows) {
    const taskId = randomUUID();
    const { error: taskError } = await supabase.from("tasks").insert({
      id: taskId,
      organization_id: row.assignedOrganizationId || site.organization_id,
      site_id: siteId,
      title: row.text,
      status: "A_FAIRE",
      priority: "NORMALE",
      due_date: row.dueDate,
      source_type: "MEETING",
      source_id: meetingId,
    });
    if (taskError) throw taskError;

    const { error: decisionError } = await supabase.from("meeting_decisions").insert({
      meeting_id: meetingId,
      lot_id: row.lotId,
      text: row.text,
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

/** Organisations destinataires d'un CR : présentes à la réunion, union titulaires des lots cités dans ses décisions. */
async function meetingNoteRecipientOrganizationIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meetingId: string
): Promise<string[]> {
  const { data: attendees, error: attendeesError } = await supabase
    .from("meeting_attendees")
    .select("organization_id")
    .eq("meeting_id", meetingId);
  if (attendeesError) throw attendeesError;

  const { data: decisions, error: decisionsError } = await supabase
    .from("meeting_decisions")
    .select("lot_id")
    .eq("meeting_id", meetingId)
    .not("lot_id", "is", null);
  if (decisionsError) throw decisionsError;
  const lotIds = [...new Set((decisions ?? []).map((d) => d.lot_id as string))];

  let titulaireOrganizationIds: string[] = [];
  if (lotIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("lot_members")
      .select("organization_id")
      .in("lot_id", lotIds)
      .eq("role", "TITULAIRE");
    if (membersError) throw membersError;
    titulaireOrganizationIds = (members ?? []).map((m) => m.organization_id);
  }

  return [...new Set([...(attendees ?? []).map((a) => a.organization_id), ...titulaireOrganizationIds])];
}

/**
 * Diffusion réelle d'un compte-rendu validé — réservée OPC/MOE, comme sa création/validation. Un
 * email par organisation destinataire (présente ou titulaire d'un lot cité), via IEmailProvider
 * (Demo* en l'absence de fournisseur réel branché) — une organisation sans boîte mail active
 * (mail_addresses) est simplement ignorée, aucun blocage. Chaque envoi réussi est tracé une fois
 * dans meeting_note_distributions ; relancer l'action renvoie et retrace à chaque fois (pas de
 * déduplication — une diffusion est un événement, pas un état).
 */
export async function distributeMeetingNote(formData: FormData) {
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

  const { data: meeting, error: meetingError } = await supabase
    .from("meeting_notes")
    .select("status, kind, number, meeting_date")
    .eq("id", meetingId)
    .single();
  if (meetingError) throw meetingError;
  if (meeting.status !== "VALIDE") throw new Error("Seul un compte-rendu validé peut être diffusé.");

  const recipientOrganizationIds = await meetingNoteRecipientOrganizationIds(supabase, meetingId);
  if (recipientOrganizationIds.length === 0) {
    throw new Error("Aucun destinataire (présent ou titulaire d'un lot cité) pour ce compte-rendu.");
  }

  const { data: mailAddresses, error: mailError } = await supabase
    .from("mail_addresses")
    .select("organization_id, address, site_id")
    .in("organization_id", recipientOrganizationIds)
    .eq("is_active", true);
  if (mailError) throw mailError;

  // Une boîte dédiée au chantier prime sur la boîte générale de l'organisation.
  const addressByOrganization = new Map<string, string>();
  for (const row of mailAddresses ?? []) {
    const current = addressByOrganization.get(row.organization_id);
    if (!current || row.site_id === siteId) addressByOrganization.set(row.organization_id, row.address);
  }

  const provider = new DemoEmailProvider();
  const distributionRows: { meeting_id: string; organization_id: string; sent_by_user_id: string }[] = [];
  for (const orgId of recipientOrganizationIds) {
    const address = addressByOrganization.get(orgId);
    if (!address) continue;
    await provider.send({
      to: [address],
      from: "chantier@adminbtp.test",
      subject: `Compte-rendu ${meeting.kind}${meeting.number ? ` n°${meeting.number}` : ""} du ${meeting.meeting_date}`,
      htmlBody: "Le compte-rendu de réunion validé est disponible. Merci d'en accuser réception depuis AdminBTP.",
    });
    distributionRows.push({ meeting_id: meetingId, organization_id: orgId, sent_by_user_id: user.id });
  }
  if (distributionRows.length === 0) {
    throw new Error("Aucun destinataire n'a de boîte mail active — rien n'a été diffusé.");
  }

  const { error: insertError } = await supabase.from("meeting_note_distributions").insert(distributionRows);
  if (insertError) throw insertError;

  revalidatePath(`/chantiers/${siteId}`);
}

/**
 * Accusé de réception d'un compte-rendu validé — réservé aux organisations destinataires
 * (présentes ou titulaires d'un lot cité). Idempotent : un deuxième accusé de la même
 * organisation est un succès silencieux (contrainte unique meeting_id/organization_id).
 */
export async function acknowledgeMeetingNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const meetingId = String(formData.get("meetingId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  if (!meetingId || !organizationId) throw new Error("Réunion et organisation sont obligatoires.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: meeting, error: meetingError } = await supabase
    .from("meeting_notes")
    .select("status")
    .eq("id", meetingId)
    .single();
  if (meetingError) throw meetingError;
  if (meeting.status !== "VALIDE") throw new Error("Seul un compte-rendu validé peut être accusé réception.");

  const recipientOrganizationIds = await meetingNoteRecipientOrganizationIds(supabase, meetingId);
  if (!recipientOrganizationIds.includes(organizationId)) {
    throw new Error("Seule une organisation présente à la réunion ou titulaire d'un lot cité peut accuser réception.");
  }

  const { error } = await supabase.from("meeting_note_acknowledgments").insert({
    meeting_id: meetingId,
    organization_id: organizationId,
    acknowledged_by_user_id: user.id,
  });
  if (error && error.code !== "23505") throw error; // 23505 = déjà accusé, succès silencieux

  revalidatePath(`/chantiers/${siteId}`);
}

/**
 * Suppression douce d'un compte-rendu, brouillon ou validé — réservée OPC/MOE, comme la création.
 * Le RPC passe en ANNULE les tâches encore ouvertes nées de ses décisions (les tâches faites ou
 * déjà annulées ne bougent pas) et trace le tout dans audit_log, en une transaction.
 */
export async function deleteMeetingNote(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "").trim();
  const meetingId = String(formData.get("meetingId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!meetingId || !organizationId || !reason) {
    throw new Error("Réunion, organisation et motif sont obligatoires.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_meeting_note", {
    p_meeting_id: meetingId,
    p_organization_id: organizationId,
    p_reason: reason,
  });
  if (error) throw error;

  revalidatePath(`/chantiers/${siteId}`);
  revalidatePath("/taches");
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
