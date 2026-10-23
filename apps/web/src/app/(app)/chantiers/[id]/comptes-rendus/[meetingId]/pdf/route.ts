import { MEETING_KIND_LABELS } from "@adminbtp/types";
import { getSite, getLots } from "@/lib/data/sites";
import { getOrganizations } from "@/lib/data/organizations";
import { getUserFullName } from "@/lib/data/users";
import { getTasksBySite } from "@/lib/data/tasks";
import { getDocumentsBySite } from "@/lib/data/documents";
import {
  getMeetingNote,
  getMeetingAttendees,
  getMeetingAgendaItems,
  getMeetingDecisions,
  getSiteLogEntries,
} from "@/lib/data/execution";
import { agendaItemLabel, renderMeetingReportPdf } from "@/lib/pdf/meeting-report";

// Lecture via le client Supabase de l'utilisateur : RLS (`can_access_site`) fait foi, un
// compte-rendu d'un chantier inaccessible renvoie 404 comme la page du chantier.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const { id, meetingId } = await params;
  const [site, meeting] = await Promise.all([getSite(id), getMeetingNote(meetingId)]);
  if (!site || !meeting || meeting.siteId !== site.id) {
    return new Response("Compte-rendu introuvable", { status: 404 });
  }

  const [attendees, agendaItems, decisions, lots, organizations, validatedByName] = await Promise.all([
    getMeetingAttendees([meeting.id]),
    getMeetingAgendaItems([meeting.id]),
    getMeetingDecisions([meeting.id]),
    getLots(site.id),
    getOrganizations(),
    meeting.validatedByUserId ? getUserFullName(meeting.validatedByUserId) : Promise.resolve(undefined),
  ]);
  const needsTasks = agendaItems.some((a) => a.taskId);
  const needsDocuments = agendaItems.some((a) => a.documentId);
  const needsLog = agendaItems.some((a) => a.sourceLogEntryId);
  const [tasks, documents, logEntries] = await Promise.all([
    needsTasks ? getTasksBySite(site.id) : Promise.resolve([]),
    needsDocuments ? getDocumentsBySite(site.id) : Promise.resolve([]),
    needsLog ? getSiteLogEntries(site.id) : Promise.resolve([]),
  ]);

  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  const lotLabel = new Map(lots.map((l) => [l.id, `Lot ${l.number} — ${l.name}`]));
  const taskTitle = new Map(tasks.map((t) => [t.id, t.title]));
  const documentTitle = new Map(documents.map((d) => [d.id, d.title]));
  const logEntry = new Map(logEntries.map((e) => [e.id, { date: e.entryDate, description: e.description }]));

  const pdf = await renderMeetingReportPdf({
    site,
    meeting: {
      kindLabel: MEETING_KIND_LABELS[meeting.kind],
      number: meeting.number,
      date: meeting.meetingDate,
      status: meeting.status,
      authorOrganizationName: meeting.authorOrganizationId ? orgName.get(meeting.authorOrganizationId) : undefined,
      validatedAt: meeting.validatedAt,
      validatedByName,
    },
    attendees: attendees.map((a) => ({
      name: a.name,
      organizationName: orgName.get(a.organizationId),
      status: a.status,
    })),
    agenda: agendaItems.map((a) =>
      agendaItemLabel({
        text: a.text,
        taskTitle: a.taskId ? (taskTitle.get(a.taskId) ?? null) : undefined,
        documentTitle: a.documentId ? (documentTitle.get(a.documentId) ?? null) : undefined,
        logEntry: a.sourceLogEntryId ? (logEntry.get(a.sourceLogEntryId) ?? null) : undefined,
      }),
    ),
    decisions: decisions.map((d) => ({
      text: d.text,
      lotLabel: d.lotId ? lotLabel.get(d.lotId) : undefined,
      taskCreated: Boolean(d.taskId),
    })),
    generatedAt: new Date(),
  });

  const draftSuffix = meeting.status === "BROUILLON" ? "_BROUILLON" : "";
  const filename = `CR_${site.reference}_${meeting.meetingDate}${draftSuffix}.pdf`.replace(/[^\w.-]+/g, "_");
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

