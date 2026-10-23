import { getSite, getLots } from "@/lib/data/sites";
import { getOrganizations } from "@/lib/data/organizations";
import { getMeetingNote, getMeetingAttendees, getMeetingDecisions } from "@/lib/data/execution";
import { renderMeetingReportPdf } from "@/lib/pdf/meeting-report";

// Lecture via le client Supabase de l'utilisateur : RLS (`can_access_site`) fait foi, un
// compte-rendu d'un chantier inaccessible renvoie 404 comme la page du chantier.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const { id, meetingId } = await params;
  const [site, meeting] = await Promise.all([getSite(id), getMeetingNote(meetingId)]);
  if (!site || !meeting || meeting.siteId !== site.id) {
    return new Response("Compte-rendu introuvable", { status: 404 });
  }

  const [attendees, decisions, lots, organizations] = await Promise.all([
    getMeetingAttendees([meeting.id]),
    getMeetingDecisions([meeting.id]),
    getLots(site.id),
    getOrganizations(),
  ]);
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  const lotLabel = new Map(lots.map((l) => [l.id, `Lot ${l.number} — ${l.name}`]));

  const pdf = await renderMeetingReportPdf({
    site,
    meetingDate: meeting.meetingDate,
    attendees: attendees.map((a) => ({ name: a.name, organizationName: orgName.get(a.organizationId) })),
    decisions: decisions.map((d) => ({
      text: d.text,
      lotLabel: d.lotId ? lotLabel.get(d.lotId) : undefined,
      taskCreated: Boolean(d.taskId),
    })),
    generatedAt: new Date(),
  });

  const filename = `CR_${site.reference}_${meeting.meetingDate}.pdf`.replace(/[^\w.-]+/g, "_");
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
