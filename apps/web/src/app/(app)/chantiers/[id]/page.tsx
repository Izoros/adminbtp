import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, FileDown, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { getSite, getSiteParticipants, getLots } from "@/lib/data/sites";
import { getOrganizations } from "@/lib/data/organizations";
import { getPhaseInstances, getPhaseTemplates } from "@/lib/data/phases";
import { getDocumentsBySite } from "@/lib/data/documents";
import { getMailThreadsBySite } from "@/lib/data/mails";
import { getTasksBySite } from "@/lib/data/tasks";
import { getActiveOrganizationIdCookie, resolveActiveOrganization } from "@/lib/data/organization-context";
import { getActTemplates } from "@/lib/data/acts";
import { getMarketContractsBySite, getMarketClauses, getPriceLines } from "@/lib/data/market";
import {
  getSituationsBySite,
  getSituationLines,
  getSituationAllocations,
  getReminderLogs,
} from "@/lib/data/finance";
import { getLotMembers } from "@/lib/data/lot-members";
import { getOrganizationCredentialsFor } from "@/lib/data/credentials";
import { getAmendmentsBySite } from "@/lib/data/amendments";
import {
  getPlanSubmissionsBySite,
  getReserveItemsBySite,
  getSiteLogEntries,
  getMeetingNotesBySite,
  getMeetingAttendees,
  getMeetingDecisions,
  getMeetingAgendaItems,
  getOpenMeetingDecisionTasks,
  getLotProgress,
} from "@/lib/data/execution";
import { getLotScheduleNotes, getTechnicalOpinionsBySite } from "@/lib/data/opc";
import { emitAct } from "@/lib/actions/acts";
import { createMarketContract, createPriceLine } from "@/lib/actions/market";
import { createSituation, addSituationLine, addSituationAllocation } from "@/lib/actions/finance";
import { runAiReview } from "@/lib/actions/document-reviews";
import { addLotMember } from "@/lib/actions/lot-members";
import { endParticipation, addParticipant } from "@/lib/actions/participants";
import { createAmendment, decideAmendment } from "@/lib/actions/amendments";
import {
  createPlanSubmission,
  reviewPlanSubmission,
  createReserveItem,
  updateReserveStatus,
  updateReserveItem,
  deleteReserveItem,
  createSiteLogEntry,
  updateSiteLogEntry,
  deleteSiteLogEntry,
  createMeetingNote,
  updateMeetingNote,
  addMeetingAgendaItem,
  validateMeetingNote,
  deleteMeetingNote,
  recordLotProgress,
} from "@/lib/actions/execution";
import { createLotScheduleNote, createTechnicalOpinion } from "@/lib/actions/opc";
import { sendReminder, runInternalReminderCheck } from "@/lib/actions/reminders";
import { updateInternalReminderDays } from "@/lib/actions/sites";
import {
  SITE_STATUS_LABELS,
  MISSION_ROLE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  MAIL_STATUS_LABELS,
  TASK_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  MARKET_CONTRACT_TYPE_LABELS,
  MarketContractType,
  MARKET_CLAUSE_KIND_LABELS,
  EXTRACTION_STATUS_LABELS,
  MissionRole,
  LotMemberRole,
  LOT_MEMBER_ROLE_LABELS,
  AMENDMENT_STATUS_LABELS,
  ReserveSeverity,
  RESERVE_SEVERITY_LABELS,
  SiteLogEntryKind,
  SITE_LOG_ENTRY_KIND_LABELS,
  MeetingKind,
  MEETING_KIND_LABELS,
  MEETING_STATUS_LABELS,
  AttendeeStatus,
  ATTENDEE_STATUS_LABELS,
  TechnicalOpinionIssuerRole,
  TECHNICAL_OPINION_ISSUER_ROLE_LABELS,
  TechnicalOpinionKind,
  TECHNICAL_OPINION_KIND_LABELS,
  TechnicalOpinionVerdict,
  TECHNICAL_OPINION_VERDICT_LABELS,
  TECHNICAL_OPINION_STATUS_LABELS,
} from "@adminbtp/types";
import { FileText, Mail as MailIcon, CheckSquare, ClipboardList } from "lucide-react";

const PHASE_STATUS_TONE = {
  A_VENIR: "neutral",
  EN_COURS: "info",
  EN_ATTENTE_VALIDATION: "warning",
  VALIDEE: "success",
  BLOQUEE: "danger",
  ANNULEE: "neutral",
} as const;

function formatEuro(amount?: number) {
  if (amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await getSite(id);
  if (!site) notFound();

  const [
    organizations,
    participants,
    lots,
    phases,
    phaseTemplates,
    documents,
    mails,
    tasks,
    actTemplates,
    marketContracts,
    situations,
    activeOrgCookie,
  ] = await Promise.all([
    getOrganizations(),
    getSiteParticipants(site.id),
    getLots(site.id),
    getPhaseInstances(site.id),
    getPhaseTemplates(),
    getDocumentsBySite(site.id),
    getMailThreadsBySite(site.id),
    getTasksBySite(site.id),
    getActTemplates("MOE"),
    getMarketContractsBySite(site.id),
    getSituationsBySite(site.id),
    getActiveOrganizationIdCookie(),
  ]);
  const org = organizations.find((o) => o.id === site.organizationId);
  const activeOrg = resolveActiveOrganization(organizations, activeOrgCookie);

  const [
    marketClauses,
    priceLines,
    situationLines,
    situationAllocations,
    reminderLogs,
    lotMembers,
    credentials,
    amendments,
    planSubmissions,
    reserveItems,
    logEntries,
    meetingNotes,
  ] = await Promise.all([
    getMarketClauses(marketContracts.map((c) => c.id)),
    getPriceLines(lots.map((l) => l.id)),
    getSituationLines(situations.map((s) => s.id)),
    getSituationAllocations(situations.map((s) => s.id)),
    getReminderLogs(situations.map((s) => s.id)),
    getLotMembers(lots.map((l) => l.id)),
    getOrganizationCredentialsFor(participants.map((p) => p.organizationId)),
    getAmendmentsBySite(site.id),
    getPlanSubmissionsBySite(site.id),
    getReserveItemsBySite(site.id),
    getSiteLogEntries(site.id),
    getMeetingNotesBySite(site.id),
  ]);

  const [
    meetingAttendees,
    meetingDecisions,
    meetingAgendaItems,
    openMeetingTasks,
    lotProgress,
    lotScheduleNotes,
    technicalOpinions,
  ] = await Promise.all([
    getMeetingAttendees(meetingNotes.map((m) => m.id)),
    getMeetingDecisions(meetingNotes.map((m) => m.id)),
    getMeetingAgendaItems(meetingNotes.map((m) => m.id)),
    getOpenMeetingDecisionTasks(site.id),
    getLotProgress(lots.map((l) => l.id)),
    getLotScheduleNotes(lots.map((l) => l.id)),
    getTechnicalOpinionsBySite(site.id),
  ]);

  // Statut courant d'un acte = dernier document émis pour ce code (ENVOYE prioritaire sur les
  // autres statuts, sinon le plus récent). Les participations de l'organisation active sur ce
  // chantier déterminent si le bouton d'émission est proposé.
  const actDocumentsByCode = new Map(
    documents
      .filter((d) => d.actCode)
      .sort((a, b) => {
        if (a.status === "ENVOYE" && b.status !== "ENVOYE") return -1;
        if (b.status === "ENVOYE" && a.status !== "ENVOYE") return 1;
        return b.createdAt.localeCompare(a.createdAt);
      })
      .map((d) => [d.actCode!, d])
  );
  const activeOrgMissionRoles = new Set(
    participants.filter((p) => p.organizationId === activeOrg?.id && !p.leftAt).map((p) => p.missionRole)
  );

  const lotsById = new Map(lots.map((l) => [l.id, l]));
  const rootLots = lots.filter((l) => !l.parentLotId);
  const childLotsByParent = new Map<string, typeof lots>();
  for (const lot of lots) {
    if (!lot.parentLotId) continue;
    const siblings = childLotsByParent.get(lot.parentLotId) ?? [];
    siblings.push(lot);
    childLotsByParent.set(lot.parentLotId, siblings);
  }

  const hasExpiredCredentialByOrg = new Map<string, boolean>();
  for (const c of credentials) {
    if (c.status === "EXPIRE") hasExpiredCredentialByOrg.set(c.organizationId, true);
  }
  const lotMembersByLot = new Map<string, typeof lotMembers>();
  for (const lm of lotMembers) {
    const siblings = lotMembersByLot.get(lm.lotId) ?? [];
    siblings.push(lm);
    lotMembersByLot.set(lm.lotId, siblings);
  }
  const meetingAttendeesByMeeting = new Map<string, typeof meetingAttendees>();
  for (const a of meetingAttendees) {
    const siblings = meetingAttendeesByMeeting.get(a.meetingId) ?? [];
    siblings.push(a);
    meetingAttendeesByMeeting.set(a.meetingId, siblings);
  }
  const meetingDecisionsByMeeting = new Map<string, typeof meetingDecisions>();
  for (const d of meetingDecisions) {
    const siblings = meetingDecisionsByMeeting.get(d.meetingId) ?? [];
    siblings.push(d);
    meetingDecisionsByMeeting.set(d.meetingId, siblings);
  }
  const meetingAgendaItemsByMeeting = new Map<string, typeof meetingAgendaItems>();
  for (const a of meetingAgendaItems) {
    const siblings = meetingAgendaItemsByMeeting.get(a.meetingId) ?? [];
    siblings.push(a);
    meetingAgendaItemsByMeeting.set(a.meetingId, siblings);
  }
  const lotScheduleNotesByLot = new Map<string, typeof lotScheduleNotes>();
  for (const n of lotScheduleNotes) {
    const siblings = lotScheduleNotesByLot.get(n.lotId) ?? [];
    siblings.push(n);
    lotScheduleNotesByLot.set(n.lotId, siblings);
  }
  // Rôle OPC/MOE : bureau de coordination (réunions, notes de planning). CT/BET et SPS : avis
  // techniques. Masqué si l'organisation active ne porte pas (plus) ce rôle sur ce chantier.
  const showOpcBureau = activeOrgMissionRoles.has("OPC") || activeOrgMissionRoles.has("MOE");
  const showCtBetBureau = activeOrgMissionRoles.has("CT") || activeOrgMissionRoles.has("BET");
  const showSpsBureau = activeOrgMissionRoles.has("SPS");
  const ppspsDocuments = documents.filter((d) => d.category === "PPSPS");
  const activeParticipantOrgIds = Array.from(
    new Set(participants.filter((p) => !p.leftAt).map((p) => p.organizationId))
  );
  const siteOrganizations = activeParticipantOrgIds
    .map((orgId) => organizations.find((o) => o.id === orgId))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));
  const ctBetOpinions = technicalOpinions.filter((o) => o.issuerRole === "CT" || o.issuerRole === "BET");
  const spsOpinions = technicalOpinions.filter((o) => o.issuerRole === "SPS");
  // L'actualisation d'une situation n'est affichée que si une clause ACTUALISATION VALIDE existe
  // pour le contrat du chantier/lot correspondant — jamais une formule par défaut.
  const hasValidatedActualizationClause = marketContracts.some((contract) =>
    marketClauses.some((cl) => cl.contractId === contract.id && cl.kind === "ACTUALISATION" && cl.status === "VALIDE")
  );
  const pendingPlanSubmissions = planSubmissions.filter((p) => p.status === "DEPOSE");
  const openReserves = reserveItems.filter((r) => r.status === "OUVERTE");

  /**
   * Rapprochement avancement déclaré / HT facturé : compare le dernier pourcentage déclaré sur
   * le lot à son équivalent en HT facturé (situations ACCEPTE/PAYE de ce lot) rapporté au montant
   * du lot. Simple signal d'écart affiché — aucun rapprochement périodique automatique, aucune
   * écriture déclenchée (voir docs/ROADMAP.md).
   */
  const latestProgressByLot = new Map<string, (typeof lotProgress)[number]>();
  for (const lp of lotProgress) {
    const current = latestProgressByLot.get(lp.lotId);
    if (!current || lp.recordDate > current.recordDate) latestProgressByLot.set(lp.lotId, lp);
  }
  const billedHtByLot = new Map<string, number>();
  for (const s of situations) {
    if (!s.lotId || (s.status !== "ACCEPTE" && s.status !== "PAYE")) continue;
    billedHtByLot.set(s.lotId, (billedHtByLot.get(s.lotId) ?? 0) + s.amountHt);
  }

  return (
    <div className="space-y-6">
      <Link href="/chantiers" className="inline-flex items-center gap-1.5 text-sm text-graphite-500 hover:text-graphite-900">
        <ArrowLeft className="h-4 w-4" />
        Chantiers
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-graphite-500">{site.reference}</p>
          <h1 className="text-xl font-semibold text-graphite-900">{site.name}</h1>
          <p className="text-sm text-graphite-500">{org?.name} — {site.address}, {site.city}</p>
        </div>
        <Badge>{SITE_STATUS_LABELS[site.status]}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-graphite-500">Budget HT</p><p className="text-lg font-semibold">{formatEuro(site.budgetHt)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-graphite-500">Début</p><p className="text-lg font-semibold">{site.startDate ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-graphite-500">Fin prévue</p><p className="text-lg font-semibold">{site.endDateEstimated ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-graphite-500">Intervenants</p><p className="text-lg font-semibold">{participants.length}</p></CardContent></Card>
      </div>

      <Tabs
        defaultKey="phases"
        tabs={[
          {
            key: "intervenants",
            label: "Intervenants & lots",
            content: (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Organisations participantes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {participants.map((p) => {
                      const pOrg = organizations.find((o) => o.id === p.organizationId);
                      const ended = Boolean(p.leftAt);
                      const expired = p.missionRole === "SOUS_TRAITANT" && hasExpiredCredentialByOrg.get(p.organizationId);
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                          <div>
                            <span className="text-graphite-900">{pOrg?.name}</span>
                            {expired && <Badge tone="danger" className="ml-2">Pièce expirée</Badge>}
                            {ended && <Badge tone="neutral" className="ml-2">Clôturée</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone="info">{MISSION_ROLE_LABELS[p.missionRole]}</Badge>
                            {!ended && (
                              <form action={endParticipation}>
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="participantId" value={p.id} />
                                <Button type="submit" size="sm" variant="secondary">Clôturer</Button>
                              </form>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <form action={addParticipant} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                      <input type="hidden" name="siteId" value={site.id} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Organisation</label>
                        <Select name="organizationId" className="h-8 w-40 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {organizations.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Rôle</label>
                        <Select name="missionRole" className="h-8 w-40 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {MissionRole.options.map((r) => (
                            <option key={r} value={r}>{MISSION_ROLE_LABELS[r]}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot (si sous-traitant)</label>
                        <Select name="lotId" className="h-8 w-32 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                    </form>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Lots et groupement</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {lots.length === 0 ? (
                      <p className="text-sm text-graphite-500">Aucun lot défini.</p>
                    ) : (
                      rootLots.map((lot) => (
                        <div key={lot.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-graphite-900">{lot.number} — {lot.name}</span>
                            <span className="text-graphite-500">{formatEuro(lot.amountHt)}</span>
                          </div>
                          {(lotMembersByLot.get(lot.id) ?? []).map((lm) => {
                            const lmOrg = organizations.find((o) => o.id === lm.organizationId);
                            return (
                              <p key={lm.id} className="ml-3 text-xs text-graphite-500">
                                {LOT_MEMBER_ROLE_LABELS[lm.role]} — {lmOrg?.name}
                                {lm.sharePercent ? ` (${lm.sharePercent}%)` : ""}
                              </p>
                            );
                          })}
                          {(childLotsByParent.get(lot.id) ?? []).map((child) => (
                            <div key={child.id} className="ml-5 border-l border-surface-border pl-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-graphite-700">{child.number} — {child.name}</span>
                                <span className="text-graphite-500">{formatEuro(child.amountHt)}</span>
                              </div>
                              {(lotMembersByLot.get(child.id) ?? []).map((lm) => {
                                const lmOrg = organizations.find((o) => o.id === lm.organizationId);
                                return (
                                  <p key={lm.id} className="ml-3 text-xs text-graphite-500">
                                    {LOT_MEMBER_ROLE_LABELS[lm.role]} — {lmOrg?.name}
                                  </p>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                    {lots.length > 0 && (
                      <form action={addLotMember} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                        <input type="hidden" name="siteId" value={site.id} />
                        <div>
                          <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                          <Select name="lotId" className="h-8 w-28 text-xs" required defaultValue="">
                            <option value="" disabled>Choisir…</option>
                            {lots.map((lot) => (
                              <option key={lot.id} value={lot.id}>{lot.number}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-graphite-500">Organisation</label>
                          <Select name="organizationId" className="h-8 w-36 text-xs" required defaultValue="">
                            <option value="" disabled>Choisir…</option>
                            {organizations.map((o) => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-graphite-500">Rôle</label>
                          <Select name="role" className="h-8 w-32 text-xs" required defaultValue="">
                            <option value="" disabled>Choisir…</option>
                            {LotMemberRole.options.map((r) => (
                              <option key={r} value={r}>{LOT_MEMBER_ROLE_LABELS[r]}</option>
                            ))}
                          </Select>
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            key: "phases",
            label: `Phases (${phases.length})`,
            content: (
              <div className="space-y-3">
                {phases.length === 0 ? (
                  <EmptyState icon={CheckSquare} title="Aucune phase configurée" description="Rattachez un modèle de phases à ce chantier." />
                ) : (
                  phases.map((phase) => {
                    const template = phaseTemplates.find((t) => t.id === phase.phaseTemplateId);
                    return (
                      <Card key={phase.id}>
                        <CardHeader>
                          <CardTitle>{template?.label ?? phase.phaseTemplateId}</CardTitle>
                          <Badge tone={PHASE_STATUS_TONE[phase.status]}>{phase.status.replaceAll("_", " ")}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-xs text-graphite-500">
                            {phase.startDate ?? "—"} → {phase.endDateActual ?? phase.endDateTarget ?? "—"}
                          </p>
                          {phase.checklist.length > 0 && (
                            <ul className="space-y-1">
                              {phase.checklist.map((item) => (
                                <li key={item.id} className="flex items-center gap-2 text-sm">
                                  {item.done ? (
                                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-graphite-300" />
                                  )}
                                  <span className={item.done ? "text-graphite-500" : "text-graphite-900"}>{item.label}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            ),
          },
          {
            key: "documents",
            label: `Documents (${documents.length})`,
            content: documents.length === 0 ? (
              <EmptyState icon={FileText} title="Aucun document" description="Générez le premier document pour ce chantier." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-surface-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-surface-subtle">
                        <td className="px-4 py-3">
                          <p className="font-medium text-graphite-900">{doc.title}</p>
                          <p className="text-xs text-graphite-500">{DOCUMENT_CATEGORY_LABELS[doc.category]}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge>{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(doc.status === "BROUILLON" || doc.status === "PREEDITION") && (
                            <form action={runAiReview.bind(null, doc.id)}>
                              <Button type="submit" size="sm" variant="secondary">
                                Contrôle IA
                              </Button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ),
          },
          {
            key: "mails",
            label: `Mails (${mails.length})`,
            content: mails.length === 0 ? (
              <EmptyState icon={MailIcon} title="Aucun mail rattaché" />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-surface-border">
                    {mails.map((mail) => (
                      <tr key={mail.id} className="hover:bg-surface-subtle">
                        <td className="px-4 py-3">
                          <p className="font-medium text-graphite-900">{mail.subject}</p>
                          <p className="text-xs text-graphite-500">{mail.fromAddress}</p>
                        </td>
                        <td className="px-4 py-3 text-right"><Badge>{MAIL_STATUS_LABELS[mail.status]}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ),
          },
          {
            key: "taches",
            label: `Tâches (${tasks.length})`,
            content: tasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Aucune tâche" />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-surface-border">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-surface-subtle">
                        <td className="px-4 py-3 text-graphite-900">{task.title}</td>
                        <td className="px-4 py-3 text-right"><Badge>{TASK_STATUS_LABELS[task.status]}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ),
          },
          {
            key: "actes",
            label: `Actes (${actTemplates.length})`,
            content: (
              <div className="space-y-2">
                {actTemplates.map((template) => {
                  const current = actDocumentsByCode.get(template.code);
                  const dependencyDoc = template.dependsOnActCode
                    ? actDocumentsByCode.get(template.dependsOnActCode)
                    : null;
                  const dependencySatisfied = !template.dependsOnActCode || dependencyDoc?.status === "ENVOYE";
                  const canEmit = activeOrgMissionRoles.has(template.requiredMissionRole);
                  return (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {dependencySatisfied ? (
                              <Unlock className="h-4 w-4 text-status-success" />
                            ) : (
                              <Lock className="h-4 w-4 text-status-warning" />
                            )}
                            <p className="font-medium text-graphite-900">{template.label}</p>
                          </div>
                          <p className="text-xs text-graphite-500">
                            Rôle requis : {MISSION_ROLE_LABELS[template.requiredMissionRole]}
                            {template.dependsOnActCode && !dependencySatisfied && (
                              <> — bloqué tant que « {template.dependsOnActCode} » n&apos;est pas envoyé</>
                            )}
                          </p>
                        </div>
                        {current ? (
                          <Badge tone={current.status === "ENVOYE" ? "success" : "info"}>
                            {DOCUMENT_STATUS_LABELS[current.status]}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Non émis</Badge>
                        )}
                      </div>
                      {!current && canEmit && activeOrg && (
                        <form action={emitAct} className="mt-3 flex flex-wrap items-end gap-2">
                          <input type="hidden" name="organizationId" value={activeOrg.id} />
                          <input type="hidden" name="siteId" value={site.id} />
                          <input type="hidden" name="actTemplateId" value={template.id} />
                          {lots.length > 0 && (
                            <div>
                              <label className="mb-1 block text-xs text-graphite-500">
                                Lot visé (diffusion ciblée)
                              </label>
                              <Select name="lotId" className="h-8 w-36 text-xs" defaultValue="">
                                <option value="">Chantier entier</option>
                                {lots.map((lot) => (
                                  <option key={lot.id} value={lot.id}>{lot.number}</option>
                                ))}
                              </Select>
                            </div>
                          )}
                          {!dependencySatisfied && (
                            <div>
                              <label className="mb-1 block text-xs text-graphite-500">Motif de déblocage (tracé)</label>
                              <Input name="overrideReason" className="h-8 w-64 text-xs" placeholder="Raison du déblocage" required />
                            </div>
                          )}
                          <Button type="submit" size="sm" variant={dependencySatisfied ? "accent" : "secondary"}>
                            Émettre
                          </Button>
                        </form>
                      )}
                    </Card>
                  );
                })}
              </div>
            ),
          },
          {
            key: "decompte",
            label: `Décompte (${situations.length})`,
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Avenants ({amendments.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {amendments.length === 0 ? (
                      <p className="text-sm text-graphite-500">Aucun avenant.</p>
                    ) : (
                      amendments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-surface-border p-3 text-sm">
                          <div>
                            <p className="text-graphite-900">Avenant n°{a.number} — {a.reason}</p>
                            <p className="text-xs text-graphite-500">Delta : {formatEuro(a.deltaHt)} HT</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={a.status === "VALIDE" ? "success" : a.status === "REFUSE" ? "danger" : "neutral"}>
                              {AMENDMENT_STATUS_LABELS[a.status]}
                            </Badge>
                            {a.status === "BROUILLON" && (
                              <form action={decideAmendment} className="flex gap-1">
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="amendmentId" value={a.id} />
                                <Button type="submit" name="decision" value="VALIDE" size="sm" variant="accent">Valider</Button>
                                <Button type="submit" name="decision" value="REFUSE" size="sm" variant="secondary">Refuser</Button>
                              </form>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <form action={createAmendment} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                      <input type="hidden" name="siteId" value={site.id} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                        <Select name="lotId" className="h-8 w-28 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">N° *</label>
                        <Input name="number" type="number" min="1" className="h-8 w-16 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Motif *</label>
                        <Input name="reason" className="h-8 w-48 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Delta HT *</label>
                        <Input name="deltaHt" type="number" step="0.01" className="h-8 w-28 text-xs" required />
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Créer</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Pièces de marché</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {marketContracts.length === 0 ? (
                      <p className="text-sm text-graphite-500">Aucun marché saisi pour ce chantier.</p>
                    ) : (
                      marketContracts.map((contract) => {
                        const lot = contract.lotId ? lotsById.get(contract.lotId) : undefined;
                        const clauses = marketClauses.filter((c) => c.contractId === contract.id);
                        return (
                          <div key={contract.id} className="rounded-md border border-surface-border p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-graphite-900">
                                {MARKET_CONTRACT_TYPE_LABELS[contract.contractType]}
                                {lot ? ` — ${lot.number}` : ""}
                              </span>
                              <span className="text-graphite-500">
                                Retenue{" "}
                                {contract.retentionGuaranteeRate
                                  ? `${Math.round(contract.retentionGuaranteeRate * 100)}%`
                                  : "—"}
                                {" · "}Délai paiement {contract.paymentTermDays ? `${contract.paymentTermDays} j` : "—"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-graphite-500">
                              Avance versée : {contract.advanceAmountHt ? formatEuro(contract.advanceAmountHt) : "—"}
                              {" · "}Libération retenue prévue :{" "}
                              {contract.retentionReleaseDueOn ?? "—"}
                              {contract.retentionSubstitutedByCaution ? " (substituée par caution)" : ""}
                            </p>
                            {clauses.length > 0 && (
                              <ul className="mt-1 space-y-0.5 text-xs text-graphite-500">
                                {clauses.map((clause) => (
                                  <li key={clause.id}>
                                    {MARKET_CLAUSE_KIND_LABELS[clause.kind]} — {EXTRACTION_STATUS_LABELS[clause.status]}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    )}
                    <form action={createMarketContract} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                      <input type="hidden" name="siteId" value={site.id} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                        <Select name="lotId" className="h-8 w-36 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Type</label>
                        <Select name="contractType" className="h-8 w-32 text-xs" defaultValue="PRIVE">
                          {MarketContractType.options.map((t) => (
                            <option key={t} value={t}>{MARKET_CONTRACT_TYPE_LABELS[t]}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Mois de référence</label>
                        <Input name="priceReferenceMonth" className="h-8 w-28 text-xs" placeholder="2026-01" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Retenue (%)</label>
                        <Input name="retentionGuaranteeRate" type="number" min="0" max="100" className="h-8 w-20 text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Délai paiement (j)</label>
                        <Input name="paymentTermDays" type="number" min="1" className="h-8 w-24 text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Avance versée (€)</label>
                        <Input name="advanceAmountHt" type="number" min="0" step="0.01" className="h-8 w-28 text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Libération retenue prévue</label>
                        <Input name="retentionReleaseDueOn" type="date" className="h-8 w-36 text-xs" />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-graphite-500">
                        <input type="checkbox" name="retentionSubstitutedByCaution" className="h-3.5 w-3.5" />
                        Substituée par caution
                      </label>
                      <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Lignes de prix (DPGF/BPU)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {priceLines.length === 0 ? (
                      <p className="text-sm text-graphite-500">Aucune ligne de prix saisie.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase text-graphite-500">
                          <tr>
                            <th className="py-1">Code</th>
                            <th>Libellé</th>
                            <th>Unité</th>
                            <th>Qté marché</th>
                            <th>PU HT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {priceLines.map((pl) => (
                            <tr key={pl.id}>
                              <td className="py-1.5 font-mono text-xs">{pl.code}</td>
                              <td>{pl.label}</td>
                              <td>{pl.unit}</td>
                              <td>{pl.quantityMarket}</td>
                              <td>{formatEuro(pl.unitPriceHt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <form action={createPriceLine} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                      <input type="hidden" name="siteId" value={site.id} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot *</label>
                        <Select name="lotId" className="h-8 w-36 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Code *</label>
                        <Input name="code" className="h-8 w-24 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Libellé *</label>
                        <Input name="label" className="h-8 w-40 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Unité *</label>
                        <Input name="unit" className="h-8 w-16 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Qté marché</label>
                        <Input name="quantityMarket" type="number" min="0" step="0.01" className="h-8 w-24 text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">PU HT</label>
                        <Input name="unitPriceHt" type="number" min="0" step="0.01" className="h-8 w-24 text-xs" />
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                    </form>
                  </CardContent>
                </Card>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-graphite-900">Situations</h2>
                  {situations.length === 0 ? (
                    <EmptyState icon={FileText} title="Aucune situation" />
                  ) : (
                    <div className="space-y-3">
                      {situations.map((situation) => {
                        const lines = situationLines.filter((l) => l.situationId === situation.id);
                        const allocations = situationAllocations.filter((a) => a.situationId === situation.id);
                        const logs = reminderLogs.filter((r) => r.situationId === situation.id);
                        return (
                          <Card key={situation.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-graphite-900">
                                Situation n°{situation.number}
                                {situation.isFinal && <Badge tone="accent" className="ml-2">DGD</Badge>}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge>{PAYMENT_STATUS_LABELS[situation.status]}</Badge>
                                <span className="text-sm text-graphite-700">{formatEuro(situation.amountHt)} HT</span>
                              </div>
                            </div>
                            {(situation.retentionAmount || situation.netAmountHt) && (
                              <p className="mt-1 text-xs text-graphite-500">
                                Retenue {formatEuro(situation.retentionAmount)} · Net {formatEuro(situation.netAmountHt)}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-graphite-500">
                              Actualisation :{" "}
                              {hasValidatedActualizationClause && situation.actualizationCoefficient
                                ? `coefficient ${situation.actualizationCoefficient} (mois ${situation.indexMonth ?? "—"})`
                                : "non calculée — aucune clause ACTUALISATION validée"}
                              {situation.advanceRecovered ? ` · Avance récupérée ${formatEuro(situation.advanceRecovered)}` : ""}
                            </p>
                            {logs.length > 0 && (
                              <p className="mt-1 text-xs text-graphite-500">
                                {logs.length} relance{logs.length > 1 ? "s" : ""} envoyée{logs.length > 1 ? "s" : ""} — dernière le{" "}
                                {new Date(logs[0]!.sentAt).toLocaleDateString("fr-FR")} ({logs[0]!.channel})
                              </p>
                            )}
                            {lines.length > 0 && (
                              <table className="mt-2 w-full text-xs">
                                <tbody className="divide-y divide-surface-border">
                                  {lines.map((line) => {
                                    const pl = priceLines.find((p) => p.id === line.priceLineId);
                                    return (
                                      <tr key={line.id}>
                                        <td className="py-1 text-graphite-700">{pl?.label ?? line.priceLineId}</td>
                                        <td className="py-1 text-right text-graphite-500">
                                          {line.quantityMonth} {pl?.unit}
                                        </td>
                                        <td className="py-1 text-right font-medium text-graphite-900">
                                          {formatEuro(line.amountHt)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                            {allocations.length > 0 && (
                              <div className="mt-2 space-y-1 text-xs text-graphite-500">
                                {allocations.map((alloc) => {
                                  const payee = organizations.find((o) => o.id === alloc.payeeOrganizationId);
                                  return (
                                    <p key={alloc.id}>
                                      Ventilation → {payee?.name ?? alloc.payeeOrganizationId} : {formatEuro(alloc.amountHt)}
                                    </p>
                                  );
                                })}
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-4 border-t border-surface-border pt-3">
                              <form action={addSituationLine} className="flex flex-wrap items-end gap-2">
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="situationId" value={situation.id} />
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Ligne de prix</label>
                                  <Select name="priceLineId" className="h-8 w-40 text-xs" required defaultValue="">
                                    <option value="" disabled>Choisir…</option>
                                    {priceLines.map((pl) => (
                                      <option key={pl.id} value={pl.id}>{pl.code} — {pl.label}</option>
                                    ))}
                                  </Select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Quantité du mois</label>
                                  <Input name="quantityMonth" type="number" step="0.01" className="h-8 w-24 text-xs" required />
                                </div>
                                <Button type="submit" size="sm" variant="secondary">Ajouter la ligne</Button>
                              </form>
                              <form action={addSituationAllocation} className="flex flex-wrap items-end gap-2">
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="situationId" value={situation.id} />
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Ventiler vers</label>
                                  <Select name="payeeOrganizationId" className="h-8 w-40 text-xs" required defaultValue="">
                                    <option value="" disabled>Choisir…</option>
                                    {organizations.map((o) => (
                                      <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                  </Select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Montant HT</label>
                                  <Input name="amountHt" type="number" min="0" step="0.01" className="h-8 w-24 text-xs" required />
                                </div>
                                <Button type="submit" size="sm" variant="secondary">Ventiler</Button>
                              </form>
                              <form action={sendReminder} className="flex flex-wrap items-end gap-2">
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="situationId" value={situation.id} />
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Relance</label>
                                  <Select name="channel" className="h-8 w-28 text-xs" defaultValue="EMAIL">
                                    <option value="EMAIL">Email</option>
                                    <option value="WHATSAPP">WhatsApp</option>
                                    <option value="COURRIER">Courrier</option>
                                  </Select>
                                </div>
                                <Button type="submit" size="sm" variant="secondary">Envoyer</Button>
                              </form>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  <form action={createSituation} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="siteId" value={site.id} />
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                      <Select name="lotId" className="h-8 w-36 text-xs" defaultValue="">
                        <option value="">Aucun</option>
                        {lots.map((lot) => (
                          <option key={lot.id} value={lot.id}>{lot.number}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Numéro *</label>
                      <Input name="number" type="number" min="1" className="h-8 w-20 text-xs" required />
                    </div>
                    <label className="flex items-center gap-1 text-xs text-graphite-500">
                      <input type="checkbox" name="isFinal" className="h-3.5 w-3.5" />
                      Situation de solde (DGD)
                    </label>
                    <Button type="submit" size="sm" variant="accent">Nouvelle situation</Button>
                  </form>
                </div>
              </div>
            ),
          },
          {
            key: "execution",
            label: `Exécution`,
            content: (
              <div className="space-y-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-graphite-900">Relances internes</p>
                      <p className="text-xs text-graphite-500">
                        Délai avant relance : {site.internalReminderDays} jours (visa en attente, situation
                        due non transmise, pièce d&apos;agrément manquante) — paramètre de ce chantier.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={updateInternalReminderDays} className="flex items-center gap-1">
                        <input type="hidden" name="siteId" value={site.id} />
                        <Input
                          name="internalReminderDays"
                          type="number"
                          min="1"
                          defaultValue={site.internalReminderDays}
                          className="h-8 w-16 text-xs"
                        />
                        <Button type="submit" size="sm" variant="secondary">Enregistrer</Button>
                      </form>
                      <form action={runInternalReminderCheck}>
                        <input type="hidden" name="siteId" value={site.id} />
                        <Button type="submit" size="sm" variant="secondary">Vérifier les relances</Button>
                      </form>
                    </div>
                  </div>
                </Card>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-graphite-900">
                    Visas en attente ({pendingPlanSubmissions.length})
                  </h2>
                  {pendingPlanSubmissions.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="Aucun visa en attente" />
                  ) : (
                    <div className="space-y-2">
                      {pendingPlanSubmissions.map((p) => {
                        const doc = documents.find((d) => d.id === p.documentId);
                        const opinions = technicalOpinions.filter(
                          (o) => o.documentId === p.documentId && o.status === "EMIS"
                        );
                        return (
                          <Card key={p.id} className="flex items-center justify-between gap-4 p-4">
                            <div>
                              <p className="font-medium text-graphite-900">{doc?.title ?? p.documentId}</p>
                              <p className="text-xs text-graphite-500">
                                Déposé le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                              {opinions.map((o) => (
                                <p key={o.id} className="text-xs text-graphite-500">
                                  Avis {TECHNICAL_OPINION_ISSUER_ROLE_LABELS[o.issuerRole]}
                                  {o.verdict && (
                                    <Badge
                                      tone={o.verdict === "FAVORABLE" ? "success" : o.verdict === "FAVORABLE_AVEC_OBSERVATIONS" ? "neutral" : "danger"}
                                      className="ml-1"
                                    >
                                      {TECHNICAL_OPINION_VERDICT_LABELS[o.verdict]}
                                    </Badge>
                                  )}{" "}— la mention reste affichée, elle ne bloque pas le visa.
                                </p>
                              ))}
                            </div>
                            <form action={reviewPlanSubmission} className="flex gap-1">
                              <input type="hidden" name="siteId" value={site.id} />
                              <input type="hidden" name="submissionId" value={p.id} />
                              <Button type="submit" name="status" value="VISE_BPE" size="sm" variant="accent">
                                Visé BPE
                              </Button>
                              <Button type="submit" name="status" value="VISE_AVEC_REMARQUES" size="sm" variant="secondary">
                                Avec remarques
                              </Button>
                              <Button type="submit" name="status" value="REFUSE" size="sm" variant="danger">
                                Refuser
                              </Button>
                            </form>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {documents.length > 0 && (
                    <form action={createPlanSubmission} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="siteId" value={site.id} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Document</label>
                        <Select name="documentId" className="h-8 w-48 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {documents.map((d) => (
                            <option key={d.id} value={d.id}>{d.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                        <Select name="lotId" className="h-8 w-28 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Déposer pour visa</Button>
                    </form>
                  )}
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-graphite-900">
                    Réserves ouvertes ({openReserves.length})
                  </h2>
                  {openReserves.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="Aucune réserve ouverte" />
                  ) : (
                    <div className="space-y-2">
                      {openReserves.map((r) => (
                        <Card key={r.id} className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-graphite-900">{r.description}</p>
                              <p className="text-xs text-graphite-500">
                                {r.location ?? "—"} · {RESERVE_SEVERITY_LABELS[r.severity]}
                                {r.dueDate ? ` · échéance ${r.dueDate}` : ""}
                              </p>
                            </div>
                            <form action={updateReserveStatus} className="flex gap-1">
                              <input type="hidden" name="siteId" value={site.id} />
                              <input type="hidden" name="reserveId" value={r.id} />
                              <Button type="submit" name="status" value="LEVEE" size="sm" variant="accent">Levée</Button>
                              <Button type="submit" name="status" value="CONTESTEE" size="sm" variant="secondary">Contestée</Button>
                            </form>
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-graphite-500">Corriger</summary>
                            <form action={updateReserveItem} className="mt-2 flex flex-wrap items-end gap-2">
                              <input type="hidden" name="siteId" value={site.id} />
                              <input type="hidden" name="reserveId" value={r.id} />
                              <div>
                                <label className="mb-1 block text-xs text-graphite-500">Local</label>
                                <Input name="location" defaultValue={r.location ?? ""} className="h-8 w-28 text-xs" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-graphite-500">Description *</label>
                                <Input name="description" defaultValue={r.description} className="h-8 w-48 text-xs" required />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-graphite-500">Gravité *</label>
                                <Select name="severity" defaultValue={r.severity} className="h-8 w-28 text-xs" required>
                                  {ReserveSeverity.options.map((s) => (
                                    <option key={s} value={s}>{RESERVE_SEVERITY_LABELS[s]}</option>
                                  ))}
                                </Select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-graphite-500">Échéance</label>
                                <Input name="dueDate" type="date" defaultValue={r.dueDate ?? ""} className="h-8 w-32 text-xs" />
                              </div>
                              <Button type="submit" size="sm" variant="secondary">Mettre à jour</Button>
                            </form>
                          </details>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-graphite-500">Supprimer</summary>
                            <form action={deleteReserveItem} className="mt-2 flex flex-wrap items-end gap-2">
                              <input type="hidden" name="siteId" value={site.id} />
                              <input type="hidden" name="reserveId" value={r.id} />
                              <div>
                                <label className="mb-1 block text-xs text-graphite-500">Motif *</label>
                                <Input name="reason" className="h-8 w-56 text-xs" required />
                              </div>
                              <Button type="submit" size="sm" variant="danger">Supprimer la réserve</Button>
                            </form>
                          </details>
                        </Card>
                      ))}
                    </div>
                  )}
                  <form action={createReserveItem} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="siteId" value={site.id} />
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                      <Select name="lotId" className="h-8 w-28 text-xs" defaultValue="">
                        <option value="">Aucun</option>
                        {lots.map((lot) => (
                          <option key={lot.id} value={lot.id}>{lot.number}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Local</label>
                      <Input name="location" className="h-8 w-28 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Description *</label>
                      <Input name="description" className="h-8 w-48 text-xs" required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Gravité *</label>
                      <Select name="severity" className="h-8 w-28 text-xs" required defaultValue="">
                        <option value="" disabled>Choisir…</option>
                        {ReserveSeverity.options.map((s) => (
                          <option key={s} value={s}>{RESERVE_SEVERITY_LABELS[s]}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Échéance</label>
                      <Input name="dueDate" type="date" className="h-8 w-32 text-xs" />
                    </div>
                    <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                  </form>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-graphite-900">Journal de chantier</h2>
                  {logEntries.length === 0 ? (
                    <p className="text-sm text-graphite-500">Aucune entrée.</p>
                  ) : (
                    <div className="space-y-1">
                      {logEntries.map((l) => (
                        <details key={l.id} className="text-sm">
                          <summary className="cursor-pointer list-none text-graphite-700">
                            <span className="text-graphite-500">{l.entryDate}</span> —{" "}
                            <Badge tone="neutral">{SITE_LOG_ENTRY_KIND_LABELS[l.kind]}</Badge> {l.description}
                          </summary>
                          <form action={updateSiteLogEntry} className="mt-2 flex flex-wrap items-end gap-2">
                            <input type="hidden" name="siteId" value={site.id} />
                            <input type="hidden" name="entryId" value={l.id} />
                            <div>
                              <label className="mb-1 block text-xs text-graphite-500">Date *</label>
                              <Input name="entryDate" type="date" defaultValue={l.entryDate} className="h-8 w-36 text-xs" required />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-graphite-500">Nature *</label>
                              <Select name="kind" defaultValue={l.kind} className="h-8 w-32 text-xs" required>
                                {SiteLogEntryKind.options.map((k) => (
                                  <option key={k} value={k}>{SITE_LOG_ENTRY_KIND_LABELS[k]}</option>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-graphite-500">Description *</label>
                              <Input name="description" defaultValue={l.description} className="h-8 w-56 text-xs" required />
                            </div>
                            <Button type="submit" size="sm" variant="secondary">Mettre à jour</Button>
                          </form>
                          <form action={deleteSiteLogEntry} className="mt-2 flex flex-wrap items-end gap-2">
                            <input type="hidden" name="siteId" value={site.id} />
                            <input type="hidden" name="entryId" value={l.id} />
                            <div>
                              <label className="mb-1 block text-xs text-graphite-500">Motif de suppression *</label>
                              <Input name="reason" className="h-8 w-56 text-xs" required />
                            </div>
                            <Button type="submit" size="sm" variant="danger">Supprimer l&apos;entrée</Button>
                            <span className="text-xs text-graphite-500">
                              Impossible si l&apos;entrée est citée par un document, un avenant ou un CR.
                            </span>
                          </form>
                        </details>
                      ))}
                    </div>
                  )}
                  <form action={createSiteLogEntry} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="siteId" value={site.id} />
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Date *</label>
                      <Input name="entryDate" type="date" className="h-8 w-36 text-xs" required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Nature *</label>
                      <Select name="kind" className="h-8 w-32 text-xs" required defaultValue="">
                        <option value="" disabled>Choisir…</option>
                        {SiteLogEntryKind.options.map((k) => (
                          <option key={k} value={k}>{SITE_LOG_ENTRY_KIND_LABELS[k]}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Description *</label>
                      <Input name="description" className="h-8 w-56 text-xs" required />
                    </div>
                    <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                  </form>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-graphite-900">
                    Comptes-rendus ({meetingNotes.length})
                  </h2>
                  <p className="mb-2 text-xs text-graphite-500">
                    Création depuis le bureau OPC (onglet Bureaux), réservée aux organisations OPC/MOE.
                  </p>
                  {meetingNotes.length === 0 ? (
                    <p className="text-sm text-graphite-500">Aucun compte-rendu.</p>
                  ) : (
                    <div className="space-y-2">
                      {meetingNotes.map((m) => (
                        <Card key={m.id} className="space-y-2 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-graphite-900">
                              {MEETING_KIND_LABELS[m.kind]}{m.number ? ` n°${m.number}` : ""} — {m.meetingDate}
                            </p>
                            <Badge tone={m.status === "VALIDE" ? "success" : "neutral"}>
                              {MEETING_STATUS_LABELS[m.status]}
                            </Badge>
                            <a
                              href={`/chantiers/${site.id}/comptes-rendus/${m.id}/pdf`}
                              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-graphite-500 hover:text-graphite-900"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              Télécharger le PDF
                            </a>
                          </div>
                          {(meetingAttendeesByMeeting.get(m.id) ?? []).length > 0 && (
                            <p className="text-xs text-graphite-500">
                              {(meetingAttendeesByMeeting.get(m.id) ?? [])
                                .map((a) => `${a.name} (${ATTENDEE_STATUS_LABELS[a.status]})`)
                                .join(", ")}
                            </p>
                          )}
                          {(meetingAgendaItemsByMeeting.get(m.id) ?? []).length > 0 && (
                            <ul className="space-y-0.5 text-xs text-graphite-500">
                              {(meetingAgendaItemsByMeeting.get(m.id) ?? []).map((a) => (
                                <li key={a.id}>· {a.text ?? "Référence (tâche/document/journal)"}</li>
                              ))}
                            </ul>
                          )}
                          {(meetingDecisionsByMeeting.get(m.id) ?? []).length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-sm text-graphite-700">
                              {(meetingDecisionsByMeeting.get(m.id) ?? []).map((d) => (
                                <li key={d.id}>— {d.text} {d.taskId && <Badge tone="info" className="ml-1">Tâche créée</Badge>}</li>
                              ))}
                            </ul>
                          )}
                          {m.status === "BROUILLON" && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-graphite-500">Corriger la date</summary>
                              <form action={updateMeetingNote} className="mt-2 flex items-end gap-2">
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="meetingId" value={m.id} />
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Date *</label>
                                  <Input name="meetingDate" type="date" defaultValue={m.meetingDate} className="h-8 w-36 text-xs" required />
                                </div>
                                <Button type="submit" size="sm" variant="secondary">Mettre à jour</Button>
                              </form>
                            </details>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {lots.length > 0 && (
                  <div>
                    <h2 className="mb-2 text-sm font-semibold text-graphite-900">Avancement déclaré</h2>
                    <div className="space-y-1">
                      {lotProgress.slice(0, 8).map((lp) => {
                        const lot = lotsById.get(lp.lotId);
                        return (
                          <p key={lp.id} className="text-sm text-graphite-700">
                            {lot?.number} — {lp.recordDate} : {lp.declaredPercent}%
                          </p>
                        );
                      })}
                    </div>
                    {lots.some((lot) => latestProgressByLot.has(lot.id)) && (
                      <div className="mt-3 space-y-1 border-t border-surface-border pt-3">
                        <p className="text-xs font-medium text-graphite-500">
                          Avancement déclaré vs HT facturé (accepté/payé)
                        </p>
                        {lots
                          .filter((lot) => latestProgressByLot.has(lot.id))
                          .map((lot) => {
                            const progress = latestProgressByLot.get(lot.id)!;
                            const billedHt = billedHtByLot.get(lot.id) ?? 0;
                            const expectedHt = lot.amountHt != null ? (lot.amountHt * progress.declaredPercent) / 100 : null;
                            const gapPercent = expectedHt != null && expectedHt > 0
                              ? Math.round(((billedHt - expectedHt) / expectedHt) * 100)
                              : null;
                            const isLargeGap = gapPercent != null && Math.abs(gapPercent) >= 10;
                            return (
                              <p key={lot.id} className="text-sm text-graphite-700">
                                {lot.number} — déclaré {progress.declaredPercent}%
                                {expectedHt != null ? ` (≈ ${formatEuro(expectedHt)} HT attendu)` : ""} vs{" "}
                                {formatEuro(billedHt)} HT facturé
                                {gapPercent != null && (
                                  <Badge tone={isLargeGap ? "warning" : "neutral"} className="ml-2">
                                    écart {gapPercent > 0 ? "+" : ""}{gapPercent}%
                                  </Badge>
                                )}
                              </p>
                            );
                          })}
                      </div>
                    )}
                    <form action={recordLotProgress} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="siteId" value={site.id} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot *</label>
                        <Select name="lotId" className="h-8 w-28 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Date *</label>
                        <Input name="recordDate" type="date" className="h-8 w-36 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Pourcentage déclaré *</label>
                        <Input name="declaredPercent" type="number" min="0" max="100" className="h-8 w-24 text-xs" required />
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Enregistrer</Button>
                    </form>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "bureaux",
            label: "Bureaux",
            content: (
              <div className="space-y-6">
                {!showOpcBureau && !showCtBetBureau && !showSpsBureau && (
                  <EmptyState
                    icon={ClipboardList}
                    title="Aucun bureau pour l'organisation active"
                    description="OPC, MOE, CT, BET ou SPS actif sur ce chantier pour voir un bureau."
                  />
                )}

                {showOpcBureau && (
                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-graphite-900">Bureau OPC</h2>

                    {openMeetingTasks.length > 0 && (
                      <Card className="p-4">
                        <p className="mb-2 text-xs font-medium text-graphite-500">
                          Décisions précédentes toujours ouvertes
                        </p>
                        <ul className="space-y-0.5 text-sm text-graphite-700">
                          {openMeetingTasks.map((t, i) => (
                            <li key={i}>— {t.title}{t.dueDate ? ` (échéance ${t.dueDate})` : ""}</li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    <div className="space-y-2">
                      {meetingNotes.map((m) => (
                        <Card key={m.id} className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-graphite-900">
                              {MEETING_KIND_LABELS[m.kind]}{m.number ? ` n°${m.number}` : ""} — {m.meetingDate}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge tone={m.status === "VALIDE" ? "success" : "neutral"}>
                                {MEETING_STATUS_LABELS[m.status]}
                              </Badge>
                              {m.status === "BROUILLON" && (
                                <form action={validateMeetingNote}>
                                  <input type="hidden" name="siteId" value={site.id} />
                                  <input type="hidden" name="meetingId" value={m.id} />
                                  <input type="hidden" name="organizationId" value={activeOrg?.id ?? ""} />
                                  <Button type="submit" size="sm" variant="accent">Valider le CR</Button>
                                </form>
                              )}
                              <a
                                href={`/chantiers/${site.id}/comptes-rendus/${m.id}/pdf`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-graphite-500 hover:text-graphite-900"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            </div>
                          </div>
                          {(meetingAgendaItemsByMeeting.get(m.id) ?? []).length > 0 && (
                            <ul className="space-y-0.5 text-xs text-graphite-500">
                              {(meetingAgendaItemsByMeeting.get(m.id) ?? []).map((a) => (
                                <li key={a.id}>· {a.text ?? "Référence (tâche/document/journal)"}</li>
                              ))}
                            </ul>
                          )}
                          {m.status === "BROUILLON" && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-graphite-500">Ajouter un point d&apos;ordre du jour</summary>
                              <form action={addMeetingAgendaItem} className="mt-2 flex flex-wrap items-end gap-2">
                                <input type="hidden" name="siteId" value={site.id} />
                                <input type="hidden" name="meetingId" value={m.id} />
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Texte</label>
                                  <Input name="text" className="h-8 w-56 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-graphite-500">Entrée de journal liée</label>
                                  <Select name="sourceLogEntryId" className="h-8 w-40 text-xs" defaultValue="">
                                    <option value="">Aucune</option>
                                    {logEntries.map((l) => (
                                      <option key={l.id} value={l.id}>{l.entryDate} — {l.description.slice(0, 24)}</option>
                                    ))}
                                  </Select>
                                </div>
                                <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                              </form>
                            </details>
                          )}
                          <details className="text-xs">
                            <summary className="cursor-pointer text-graphite-500">Supprimer le CR</summary>
                            <form action={deleteMeetingNote} className="mt-2 flex flex-wrap items-end gap-2">
                              <input type="hidden" name="siteId" value={site.id} />
                              <input type="hidden" name="meetingId" value={m.id} />
                              <input type="hidden" name="organizationId" value={activeOrg?.id ?? ""} />
                              <div>
                                <label className="mb-1 block text-xs text-graphite-500">Motif *</label>
                                <Input name="reason" className="h-8 w-56 text-xs" required />
                              </div>
                              <Button type="submit" size="sm" variant="danger">Supprimer</Button>
                              <span className="text-xs text-graphite-500">
                                Les tâches encore ouvertes nées de ses décisions seront annulées.
                              </span>
                            </form>
                          </details>
                        </Card>
                      ))}
                    </div>

                    <Card className="p-4">
                      <p className="mb-2 text-sm font-medium text-graphite-900">Nouvelle réunion</p>
                      <form action={createMeetingNote} className="space-y-3">
                        <input type="hidden" name="siteId" value={site.id} />
                        <input type="hidden" name="organizationId" value={activeOrg?.id ?? ""} />
                        <div className="flex flex-wrap items-end gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Nature *</label>
                            <Select name="kind" className="h-8 w-44 text-xs" required defaultValue="OPC">
                              {MeetingKind.options.map((k) => (
                                <option key={k} value={k}>{MEETING_KIND_LABELS[k]}</option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Numéro</label>
                            <Input name="number" type="number" min="1" className="h-8 w-20 text-xs" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Date *</label>
                            <Input name="meetingDate" type="date" className="h-8 w-36 text-xs" required />
                          </div>
                        </div>
                        {siteOrganizations.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs text-graphite-500">Présences</p>
                            <div className="flex flex-wrap gap-2">
                              {siteOrganizations.map((o) => (
                                <div key={o.id} className="flex items-center gap-1">
                                  <span className="text-xs text-graphite-700">{o.legalName}</span>
                                  <Select name={`attendeeStatus:${o.id}`} className="h-8 w-28 text-xs" defaultValue="PRESENT">
                                    {AttendeeStatus.options.map((s) => (
                                      <option key={s} value={s}>{ATTENDEE_STATUS_LABELS[s]}</option>
                                    ))}
                                  </Select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="mb-1 block text-xs text-graphite-500">
                            Décisions (une par ligne — chacune crée une tâche)
                          </label>
                          <textarea
                            name="decisions"
                            rows={3}
                            className="w-full rounded-md border border-surface-border bg-surface-white p-2 text-xs text-graphite-900"
                            placeholder={"Relancer le BET structure\nValider le plan d'exécution lot 02"}
                          />
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Assigner les décisions à</label>
                            <Select name="assignedOrganizationId" className="h-8 w-48 text-xs" defaultValue="">
                              <option value="">Organisation du chantier (défaut)</option>
                              {siteOrganizations.map((o) => (
                                <option key={o.id} value={o.id}>{o.legalName}</option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Échéance des décisions</label>
                            <Input name="decisionsDueDate" type="date" className="h-8 w-36 text-xs" />
                          </div>
                        </div>
                        <Button type="submit" size="sm" variant="accent">Créer la réunion</Button>
                      </form>
                    </Card>

                    {lots.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-graphite-900">Notes de coordination par lot</h3>
                        <div className="space-y-1">
                          {lots.map((lot) =>
                            (lotScheduleNotesByLot.get(lot.id) ?? []).map((n) => (
                              <p key={n.id} className="text-sm text-graphite-700">
                                {lot.number} — semaine du {n.week} : {n.note}
                                {n.needsLotId && ` (besoin : ${lotsById.get(n.needsLotId)?.number ?? n.needsLotId})`}
                              </p>
                            ))
                          )}
                        </div>
                        <form action={createLotScheduleNote} className="mt-2 flex flex-wrap items-end gap-2">
                          <input type="hidden" name="siteId" value={site.id} />
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Lot *</label>
                            <Select name="lotId" className="h-8 w-28 text-xs" required defaultValue="">
                              <option value="" disabled>Choisir…</option>
                              {lots.map((lot) => (
                                <option key={lot.id} value={lot.id}>{lot.number}</option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Semaine du *</label>
                            <Input name="week" type="date" className="h-8 w-36 text-xs" required />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Consigne *</label>
                            <Input name="note" className="h-8 w-56 text-xs" required />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-graphite-500">Besoin d&apos;un autre lot</label>
                            <Select name="needsLotId" className="h-8 w-28 text-xs" defaultValue="">
                              <option value="">Aucun</option>
                              {lots.map((lot) => (
                                <option key={lot.id} value={lot.id}>{lot.number}</option>
                              ))}
                            </Select>
                          </div>
                          <Button type="submit" size="sm" variant="secondary">Ajouter</Button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {showCtBetBureau && (
                  <div className="space-y-3 border-t border-surface-border pt-6">
                    <h2 className="text-sm font-semibold text-graphite-900">Bureau CT / BET</h2>
                    <div className="space-y-2">
                      {ctBetOpinions.length === 0 ? (
                        <p className="text-sm text-graphite-500">Aucun avis déposé.</p>
                      ) : (
                        ctBetOpinions.map((o) => (
                          <Card key={o.id} className="p-4">
                            <div className="flex items-center gap-2">
                              <Badge tone="neutral">{TECHNICAL_OPINION_ISSUER_ROLE_LABELS[o.issuerRole]}</Badge>
                              <Badge tone="neutral">{TECHNICAL_OPINION_KIND_LABELS[o.kind]}</Badge>
                              {o.verdict && <Badge tone={o.verdict === "FAVORABLE" ? "success" : "danger"}>{TECHNICAL_OPINION_VERDICT_LABELS[o.verdict]}</Badge>}
                              <Badge tone={o.status === "EMIS" ? "success" : "neutral"}>{TECHNICAL_OPINION_STATUS_LABELS[o.status]}</Badge>
                              {o.lotId && <span className="text-xs text-graphite-500">{lotsById.get(o.lotId)?.number}</span>}
                            </div>
                            <p className="mt-1 text-sm text-graphite-700">{o.text}</p>
                          </Card>
                        ))
                      )}
                    </div>
                    <form action={createTechnicalOpinion} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="siteId" value={site.id} />
                      <input type="hidden" name="issuerOrganizationId" value={activeOrg?.id ?? ""} />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Rôle *</label>
                        <Select name="issuerRole" className="h-8 w-24 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {TechnicalOpinionIssuerRole.options
                            .filter((r) => (r === "CT" || r === "BET") && activeOrgMissionRoles.has(r))
                            .map((r) => (
                              <option key={r} value={r}>{TECHNICAL_OPINION_ISSUER_ROLE_LABELS[r]}</option>
                            ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                        <Select name="lotId" className="h-8 w-24 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Document</label>
                        <Select name="documentId" className="h-8 w-40 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {documents.map((d) => (
                            <option key={d.id} value={d.id}>{d.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Nature *</label>
                        <Select name="kind" className="h-8 w-28 text-xs" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {TechnicalOpinionKind.options.map((k) => (
                            <option key={k} value={k}>{TECHNICAL_OPINION_KIND_LABELS[k]}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Verdict</label>
                        <Select name="verdict" className="h-8 w-44 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {TechnicalOpinionVerdict.options.map((v) => (
                            <option key={v} value={v}>{TECHNICAL_OPINION_VERDICT_LABELS[v]}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Texte *</label>
                        <Input name="text" className="h-8 w-56 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Statut</label>
                        <Select name="status" className="h-8 w-28 text-xs" defaultValue="EMIS">
                          <option value="BROUILLON">Brouillon</option>
                          <option value="EMIS">Émis</option>
                        </Select>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Déposer l&apos;avis</Button>
                    </form>
                  </div>
                )}

                {showSpsBureau && (
                  <div className="space-y-3 border-t border-surface-border pt-6">
                    <h2 className="text-sm font-semibold text-graphite-900">Bureau SPS</h2>
                    <div className="space-y-2">
                      {spsOpinions.length === 0 ? (
                        <p className="text-sm text-graphite-500">Aucune visite ou observation déposée.</p>
                      ) : (
                        spsOpinions.map((o) => (
                          <Card key={o.id} className="p-4">
                            <div className="flex items-center gap-2">
                              <Badge tone="neutral">{TECHNICAL_OPINION_KIND_LABELS[o.kind]}</Badge>
                              <Badge tone={o.status === "EMIS" ? "success" : "neutral"}>{TECHNICAL_OPINION_STATUS_LABELS[o.status]}</Badge>
                              {o.lotId && <span className="text-xs text-graphite-500">{lotsById.get(o.lotId)?.number}</span>}
                            </div>
                            <p className="mt-1 text-sm text-graphite-700">{o.text}</p>
                          </Card>
                        ))
                      )}
                    </div>
                    <form action={createTechnicalOpinion} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="siteId" value={site.id} />
                      <input type="hidden" name="issuerOrganizationId" value={activeOrg?.id ?? ""} />
                      <input type="hidden" name="issuerRole" value="SPS" />
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                        <Select name="lotId" className="h-8 w-24 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Nature *</label>
                        <Select name="kind" className="h-8 w-28 text-xs" required defaultValue="VISITE">
                          {TechnicalOpinionKind.options.map((k) => (
                            <option key={k} value={k}>{TECHNICAL_OPINION_KIND_LABELS[k]}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Texte *</label>
                        <Input name="text" className="h-8 w-56 text-xs" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Statut</label>
                        <Select name="status" className="h-8 w-28 text-xs" defaultValue="EMIS">
                          <option value="BROUILLON">Brouillon</option>
                          <option value="EMIS">Émis</option>
                        </Select>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Déposer</Button>
                    </form>

                    {ppspsDocuments.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-graphite-500">PPSPS (lecture seule)</p>
                        <ul className="space-y-0.5 text-sm text-graphite-700">
                          {ppspsDocuments.map((d) => (
                            <li key={d.id}>
                              {d.title} — <Badge tone="neutral">{DOCUMENT_STATUS_LABELS[d.status]}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
