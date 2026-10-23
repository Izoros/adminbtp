import { createClient } from "@/lib/supabase/server";
import type {
  PlanSubmission,
  ReserveItem,
  SiteLogEntry,
  MeetingNote,
  MeetingAttendee,
  MeetingDecision,
  MeetingAgendaItem,
  LotProgress,
} from "@adminbtp/types";
import type { Database } from "@adminbtp/types";

type PlanSubmissionRow = Database["public"]["Tables"]["plan_submissions"]["Row"];
type ReserveItemRow = Database["public"]["Tables"]["reserve_items"]["Row"];
type SiteLogEntryRow = Database["public"]["Tables"]["site_log_entries"]["Row"];
type MeetingNoteRow = Database["public"]["Tables"]["meeting_notes"]["Row"];
type MeetingAttendeeRow = Database["public"]["Tables"]["meeting_attendees"]["Row"];
type MeetingDecisionRow = Database["public"]["Tables"]["meeting_decisions"]["Row"];
type MeetingAgendaItemRow = Database["public"]["Tables"]["meeting_agenda_items"]["Row"];
type LotProgressRow = Database["public"]["Tables"]["lot_progress"]["Row"];

function mapPlanSubmission(row: PlanSubmissionRow): PlanSubmission {
  return {
    id: row.id,
    siteId: row.site_id,
    lotId: row.lot_id ?? undefined,
    documentId: row.document_id,
    authorUserId: row.author_user_id,
    status: row.status,
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    remarks: row.remarks ?? undefined,
    createdAt: row.created_at,
  };
}

function mapReserveItem(row: ReserveItemRow): ReserveItem {
  return {
    id: row.id,
    siteId: row.site_id,
    lotId: row.lot_id ?? undefined,
    location: row.location ?? undefined,
    description: row.description,
    severity: row.severity,
    dueDate: row.due_date ?? undefined,
    status: row.status,
    documentId: row.document_id ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSiteLogEntry(row: SiteLogEntryRow): SiteLogEntry {
  return {
    id: row.id,
    siteId: row.site_id,
    entryDate: row.entry_date,
    kind: row.kind,
    description: row.description,
    authorUserId: row.author_user_id,
    createdAt: row.created_at,
  };
}

function mapMeetingNote(row: MeetingNoteRow): MeetingNote {
  return {
    id: row.id,
    siteId: row.site_id,
    kind: row.kind,
    number: row.number ?? undefined,
    meetingDate: row.meeting_date,
    authorOrganizationId: row.author_organization_id ?? undefined,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    documentId: row.document_id ?? undefined,
    validatedAt: row.validated_at ?? undefined,
    validatedByUserId: row.validated_by_user_id ?? undefined,
    createdAt: row.created_at,
  };
}

function mapMeetingAttendee(row: MeetingAttendeeRow): MeetingAttendee {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    organizationId: row.organization_id,
    name: row.name,
    status: row.status,
  };
}

function mapMeetingDecision(row: MeetingDecisionRow): MeetingDecision {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    lotId: row.lot_id ?? undefined,
    text: row.text,
    taskId: row.task_id ?? undefined,
  };
}

function mapMeetingAgendaItem(row: MeetingAgendaItemRow): MeetingAgendaItem {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    taskId: row.task_id ?? undefined,
    documentId: row.document_id ?? undefined,
    sourceLogEntryId: row.source_log_entry_id ?? undefined,
    text: row.text ?? undefined,
    createdAt: row.created_at,
  };
}

function mapLotProgress(row: LotProgressRow): LotProgress {
  return {
    id: row.id,
    lotId: row.lot_id,
    recordDate: row.record_date,
    declaredPercent: row.declared_percent,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

export async function getPlanSubmissionsBySite(siteId: string): Promise<PlanSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_submissions")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPlanSubmission);
}

export async function getReserveItemsBySite(siteId: string): Promise<ReserveItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reserve_items")
    .select("*")
    .eq("site_id", siteId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReserveItem);
}

export async function getSiteLogEntries(siteId: string): Promise<SiteLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_log_entries")
    .select("*")
    .eq("site_id", siteId)
    .is("deleted_at", null)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSiteLogEntry);
}

export async function getMeetingNotesBySite(siteId: string): Promise<MeetingNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_notes")
    .select("*")
    .eq("site_id", siteId)
    .is("deleted_at", null)
    .order("meeting_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMeetingNote);
}

export async function getMeetingAttendees(meetingIds: string[]): Promise<MeetingAttendee[]> {
  if (meetingIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("meeting_attendees").select("*").in("meeting_id", meetingIds);
  if (error) throw error;
  return (data ?? []).map(mapMeetingAttendee);
}

export async function getMeetingDecisions(meetingIds: string[]): Promise<MeetingDecision[]> {
  if (meetingIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("meeting_decisions").select("*").in("meeting_id", meetingIds);
  if (error) throw error;
  return (data ?? []).map(mapMeetingDecision);
}

export async function getMeetingAgendaItems(meetingIds: string[]): Promise<MeetingAgendaItem[]> {
  if (meetingIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_agenda_items")
    .select("*")
    .in("meeting_id", meetingIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMeetingAgendaItem);
}

/** Tâches MEETING non closes des réunions précédentes — rechargées dans le formulaire de création. */
export async function getOpenMeetingDecisionTasks(siteId: string): Promise<{ title: string; dueDate?: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("title, due_date")
    .eq("site_id", siteId)
    .eq("source_type", "MEETING")
    .not("status", "in", "(FAIT,ANNULE)");
  if (error) throw error;
  return (data ?? []).map((t) => ({ title: t.title, dueDate: t.due_date ?? undefined }));
}

export async function getLotProgress(lotIds: string[]): Promise<LotProgress[]> {
  if (lotIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lot_progress")
    .select("*")
    .in("lot_id", lotIds)
    .order("record_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapLotProgress);
}
