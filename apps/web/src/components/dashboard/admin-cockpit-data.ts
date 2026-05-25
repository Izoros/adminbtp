import { loadOrganizationAccessData } from "@/modules/organizations/services/organization-source";
import { createClient } from "@/lib/supabase/server";
import {
  adminAlerts,
  adminKanbanColumns,
  adminLoadSeries,
  adminMetrics,
  adminRevenueSeries,
} from "@/config/dashboard";
import type { Tables } from "@/types/supabase";

import type {
  AdminCockpitAlert,
  AdminCockpitData,
  AdminCockpitHealthItem,
  AdminCockpitKanbanCard,
  AdminCockpitKanbanColumn,
  AdminCockpitLoadPoint,
  AdminCockpitMetric,
  AdminCockpitOverviewCard,
  AdminCockpitPriority,
  AdminCockpitQuickAction,
  AdminCockpitRevenuePoint,
  AdminCockpitTimeRange,
} from "./admin-cockpit.types";

type ProjectRow = Tables<"projects">;
type DocumentRow = Tables<"documents">;
type SignatureRequestRow = Tables<"signature_requests">;
type PaymentFollowupRow = Tables<"payment_followups">;
type ConsultingMissionRow = Tables<"consulting_missions">;
type SituationRow = Tables<"situations">;
type EmailRow = Tables<"emails">;
type AiSuggestionRow = Tables<"ai_suggestions">;

type AdminCockpitSnapshot = {
  source: "demo" | "supabase";
  sourceMessage: string;
  organizationCount: number;
  projects: Pick<ProjectRow, "id" | "name" | "status" | "updated_at" | "created_at">[];
  documents: Pick<DocumentRow, "id" | "title" | "status" | "updated_at" | "created_at">[];
  signatures: Pick<SignatureRequestRow, "id" | "status" | "updated_at" | "created_at">[];
  followups: Pick<PaymentFollowupRow, "id" | "status" | "step_label" | "scheduled_for" | "updated_at">[];
  consultingMissions: Pick<
    ConsultingMissionRow,
    "id" | "title" | "status" | "sold_hours" | "consumed_hours" | "updated_at" | "created_at"
  >[];
  situations: Pick<SituationRow, "id" | "reference" | "status" | "amount_cents" | "issued_on">[];
  emails: Pick<EmailRow, "id" | "subject" | "classification" | "received_at">[];
  aiSuggestions: Pick<AiSuggestionRow, "id" | "title" | "status" | "created_at">[];
};

export type AdminCockpitOptions = {
  range?: string | string[] | undefined;
};

const adminCockpitRangeLabels: Record<AdminCockpitTimeRange, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
};

const adminCockpitBucketConfig: Record<
  AdminCockpitTimeRange,
  { bucketCount: number; bucketSizeDays: number }
> = {
  "7d": { bucketCount: 7, bucketSizeDays: 1 },
  "30d": { bucketCount: 6, bucketSizeDays: 5 },
  "90d": { bucketCount: 6, bucketSizeDays: 15 },
};

function cloneStaticCockpitData(sourceMessage: string): AdminCockpitData {
  return {
    source: "demo",
    sourceMessage,
    range: "30d",
    rangeLabel: adminCockpitRangeLabels["30d"],
    updatedAtLabel: buildUpdatedAtLabel(new Date()),
    metrics: adminMetrics.map((metric) => ({ ...metric })),
    overviewCards: [],
    priorities: [],
    healthItems: [],
    quickActions: [],
    loadSeries: adminLoadSeries.map((point) => ({ ...point })),
    revenueSeries: adminRevenueSeries.map((point) => ({ ...point })),
    alerts: adminAlerts.map((alert) => ({ ...alert })),
    kanbanColumns: adminKanbanColumns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => ({ ...card })),
    })),
  };
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDayMonth(value: Date) {
  return formatDate(value, { day: "2-digit", month: "short" });
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, amount: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function subDays(value: Date, amount: number) {
  return addDays(value, -amount);
}

function parseIsoDate(value: string) {
  return new Date(value);
}

function formatDate(value: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", options).format(value);
}

function buildUpdatedAtLabel(value: Date) {
  return formatDate(value, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(value: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)} h`;
}

function normalizeAdminCockpitTimeRange(
  input?: string | string[] | undefined,
): AdminCockpitTimeRange {
  const rawValue = Array.isArray(input) ? input[0] : input;

  if (rawValue === "7d" || rawValue === "30d" || rawValue === "90d") {
    return rawValue;
  }

  return "30d";
}

function getWindowStart(range: AdminCockpitTimeRange, referenceDate = new Date()) {
  const today = startOfDay(referenceDate);

  switch (range) {
    case "7d":
      return subDays(today, 6);
    case "90d":
      return subDays(today, 89);
    case "30d":
    default:
      return subDays(today, 29);
  }
}

function isWithinWindow(value: string, windowStart: Date, windowEndExclusive: Date) {
  const date = parseIsoDate(value);
  return date >= windowStart && date < windowEndExclusive;
}

function formatShortDayLabel(value: string) {
  return formatDate(parseIsoDate(value), { weekday: "short" });
}

function formatShortMonthLabel(value: Date) {
  return formatDate(value, { month: "short" });
}

function formatRelativeEta(value: string) {
  const targetDate = startOfDay(parseIsoDate(value));
  const today = startOfDay(new Date());

  if (targetDate.getTime() === today.getTime()) {
    return "Aujourd'hui";
  }

  if (targetDate.getTime() === addDays(today, 1).getTime()) {
    return "Demain";
  }

  if (today.getTime() > targetDate.getTime()) {
    return "En retard";
  }

  return formatDate(targetDate, { day: "2-digit", month: "short" });
}

function buildMetrics(snapshot: AdminCockpitSnapshot): AdminCockpitMetric[] {
  const activeProjects = snapshot.projects.filter((project) => project.status === "active").length;
  const pendingSignatures = snapshot.signatures.filter(
    (request) =>
      request.status === "pending_internal_validation" ||
      request.status === "pending_signature",
  ).length;
  const draftDocuments = snapshot.documents.filter((document) => document.status === "draft").length;
  const activeFollowups = snapshot.followups.filter(
    (followup) => followup.status === "scheduled" || followup.status === "sent",
  ).length;
  const urgentFollowups = snapshot.followups.filter((followup) =>
    startOfDay(new Date()).getTime() > startOfDay(parseIsoDate(followup.scheduled_for)).getTime(),
  ).length;
  const soldHours = snapshot.consultingMissions.reduce(
    (total, mission) => total + (mission.sold_hours ?? 0),
    0,
  );
  const consumedHours = snapshot.consultingMissions.reduce(
    (total, mission) => total + mission.consumed_hours,
    0,
  );
  const consumedRatio = soldHours > 0 ? Math.round((consumedHours / soldHours) * 100) : 0;

  return [
    {
      label: "Chantiers suivis",
      value: formatCompactCount(snapshot.projects.length),
      delta: `${formatCompactCount(activeProjects)} actifs`,
      tone: "warm",
    },
    {
      label: "Docs a valider",
      value: formatCompactCount(pendingSignatures),
      delta: `${formatCompactCount(draftDocuments)} brouillons`,
      tone: "ink",
    },
    {
      label: "Relances actives",
      value: formatCompactCount(activeFollowups),
      delta: `${formatCompactCount(urgentFollowups)} urgentes`,
      tone: "sage",
    },
    {
      label: "Heures conseil",
      value: formatHours(consumedHours),
      delta: `${consumedRatio} % vendues consommees`,
      tone: "warm",
    },
  ];
}

function buildOverviewCards(
  snapshot: AdminCockpitSnapshot,
  range: AdminCockpitTimeRange,
  windowStart: Date,
  windowEndExclusive: Date,
): AdminCockpitOverviewCard[] {
  const rangeLabel = adminCockpitRangeLabels[range];
  const emailsInWindow = snapshot.emails.filter((email) =>
    isWithinWindow(email.received_at, windowStart, windowEndExclusive),
  );
  const documentsInWindow = snapshot.documents.filter((document) =>
    isWithinWindow(document.updated_at, windowStart, windowEndExclusive),
  );
  const consultingInWindow = snapshot.consultingMissions.filter((mission) =>
    isWithinWindow(mission.updated_at, windowStart, windowEndExclusive),
  );
  const situationsInWindow = snapshot.situations.filter((situation) =>
    isWithinWindow(situation.issued_on, windowStart, windowEndExclusive),
  );
  const aiPending = snapshot.aiSuggestions.filter(
    (suggestion) => suggestion.status === "pending_human_validation",
  ).length;

  return [
    {
      title: "Flux entrants",
      value: formatCompactCount(emailsInWindow.length),
      detail: `${rangeLabel} - inbox et messages clients`,
      tone: "warm",
    },
    {
      title: "Documents manipules",
      value: formatCompactCount(documentsInWindow.length),
      detail: `${rangeLabel} - brouillons et mises a jour`,
      tone: "sage",
    },
    {
      title: "Production conseil",
      value: formatCompactCount(consultingInWindow.length),
      detail: `${rangeLabel} - missions actives ou touchees`,
      tone: "ink",
    },
    {
      title: "Montant emis",
      value: new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(
        situationsInWindow.reduce((total, situation) => total + situation.amount_cents, 0) / 100,
      ),
      detail: `${aiPending} proposition(s) IA encore a valider`,
      tone: "warm",
    },
  ];
}

function buildPriorities(
  snapshot: AdminCockpitSnapshot,
  range: AdminCockpitTimeRange,
): AdminCockpitPriority[] {
  const pendingSignatures = snapshot.signatures.filter(
    (request) =>
      request.status === "pending_internal_validation" ||
      request.status === "pending_signature",
  ).length;
  const activeFollowups = snapshot.followups.filter(
    (followup) => followup.status === "scheduled" || followup.status === "sent",
  ).length;
  const aiPending = snapshot.aiSuggestions.filter(
    (suggestion) => suggestion.status === "pending_human_validation",
  ).length;
  const consultingInProgress = snapshot.consultingMissions.filter(
    (mission) => mission.status === "in_progress" || mission.status === "scheduled",
  ).length;
  const rangeLabel = adminCockpitRangeLabels[range];

  return [
    {
      title: "Debloquer les validations",
      detail: `${pendingSignatures} circuit(s) documentaire(s) demandent une validation interne ou externe.`,
      emphasis: pendingSignatures > 0 ? "Action du jour" : "Sous controle",
      tone: pendingSignatures > 0 ? "rose" : "emerald",
    },
    {
      title: "Prioriser la tresorerie",
      detail: `${activeFollowups} relance(s) active(s) sur ${rangeLabel.toLowerCase()}.`,
      emphasis: activeFollowups > 0 ? "Point cash" : "RAS",
      tone: activeFollowups > 0 ? "amber" : "emerald",
    },
    {
      title: "Arbitrer IA et expertise",
      detail: `${aiPending} proposition(s) IA en attente et ${consultingInProgress} mission(s) conseil en mouvement.`,
      emphasis: aiPending > 0 ? "Validation humaine" : "File fluide",
      tone: aiPending > 0 ? "amber" : "emerald",
    },
  ];
}

function buildHealthItems(
  snapshot: AdminCockpitSnapshot,
  sourceMessage: string,
): AdminCockpitHealthItem[] {
  const activeProjects = snapshot.projects.filter((project) => project.status === "active").length;
  const archivedDocuments = snapshot.documents.filter(
    (document) => document.status === "archived",
  ).length;
  const disputedSituations = snapshot.situations.filter(
    (situation) => situation.status === "disputed",
  ).length;

  return [
    {
      label: "Source",
      value: snapshot.source === "supabase" ? "Live" : "Demo",
      detail: sourceMessage,
      tone: snapshot.source === "supabase" ? "sage" : "warm",
    },
    {
      label: "Perimetre",
      value: `${snapshot.organizationCount} org`,
      detail: `${activeProjects} chantier(s) actif(s) sur le scope courant.`,
      tone: "ink",
    },
    {
      label: "Archive documentaire",
      value: formatCompactCount(archivedDocuments),
      detail: `${disputedSituations} situation(s) litigieuse(s) detectee(s).`,
      tone: disputedSituations > 0 ? "warm" : "sage",
    },
  ];
}

function buildQuickActions(snapshot: AdminCockpitSnapshot): AdminCockpitQuickAction[] {
  const pendingSignatures = snapshot.signatures.filter(
    (request) =>
      request.status === "pending_internal_validation" ||
      request.status === "pending_signature",
  ).length;
  const activeFollowups = snapshot.followups.filter(
    (followup) => followup.status === "scheduled" || followup.status === "sent",
  ).length;
  const unclassifiedEmails = snapshot.emails.filter(
    (email) => email.classification === "unclassified",
  ).length;
  const aiPending = snapshot.aiSuggestions.filter(
    (suggestion) => suggestion.status === "pending_human_validation",
  ).length;

  return [
    {
      label: "Traiter les emails",
      href: "/emails",
      detail: `${unclassifiedEmails} email(s) a qualifier`,
      tone: "warm",
    },
    {
      label: "Relances tresorerie",
      href: "/followups",
      detail: `${activeFollowups} relance(s) active(s)`,
      tone: "sage",
    },
    {
      label: "Valider les signatures",
      href: "/signatures",
      detail: `${pendingSignatures} validation(s) en attente`,
      tone: "ink",
    },
    {
      label: "Revoir les suggestions IA",
      href: "/ai",
      detail: `${aiPending} proposition(s) a arbitrer`,
      tone: "warm",
    },
  ];
}

function buildBucketLabel(bucketStart: Date, bucketEnd: Date, bucketSizeDays: number) {
  if (bucketSizeDays === 1) {
    return formatShortDayLabel(bucketStart.toISOString());
  }

  return `${formatDayMonth(bucketStart)} - ${formatDayMonth(addDays(bucketEnd, -1))}`;
}

function buildLoadSeries(
  snapshot: AdminCockpitSnapshot,
  range: AdminCockpitTimeRange,
): AdminCockpitLoadPoint[] {
  const today = startOfDay(new Date());
  const { bucketCount, bucketSizeDays } = adminCockpitBucketConfig[range];
  const windowStart = getWindowStart(range, today);
  const bucketStarts = Array.from({ length: bucketCount }, (_, index) =>
    addDays(windowStart, index * bucketSizeDays),
  );

  return bucketStarts.map((bucketStart) => {
    const bucketEnd = addDays(bucketStart, bucketSizeDays);

    return {
      label: buildBucketLabel(bucketStart, bucketEnd, bucketSizeDays),
      emails: snapshot.emails.filter((email) =>
        isWithinWindow(email.received_at, bucketStart, bucketEnd),
      ).length,
      documents: snapshot.documents.filter((document) =>
        isWithinWindow(document.updated_at, bucketStart, bucketEnd),
      ).length,
      consulting: snapshot.consultingMissions.filter((mission) =>
        isWithinWindow(mission.updated_at, bucketStart, bucketEnd),
      ).length,
    };
  });
}

function buildRevenueSeries(
  snapshot: AdminCockpitSnapshot,
  range: AdminCockpitTimeRange,
): AdminCockpitRevenuePoint[] {
  const today = startOfDay(new Date());
  const { bucketCount, bucketSizeDays } = adminCockpitBucketConfig[range];
  const windowStart = getWindowStart(range, today);
  const bucketStarts = Array.from({ length: bucketCount }, (_, index) =>
    addDays(windowStart, index * bucketSizeDays),
  );

  return bucketStarts.map((bucketStart) => {
    const bucketEnd = addDays(bucketStart, bucketSizeDays);
    const situations = snapshot.situations.filter((situation) =>
      isWithinWindow(situation.issued_on, bucketStart, bucketEnd),
    );

    return {
      label:
        bucketSizeDays >= 15 ? formatShortMonthLabel(bucketStart) : buildBucketLabel(bucketStart, bucketEnd, bucketSizeDays),
      committed: situations.reduce((total, situation) => total + situation.amount_cents, 0) / 100,
      invoiced:
        situations
          .filter((situation) => situation.status !== "draft")
          .reduce((total, situation) => total + situation.amount_cents, 0) / 100,
    };
  });
}

function buildAlerts(
  snapshot: AdminCockpitSnapshot,
  range: AdminCockpitTimeRange,
  windowStart: Date,
  windowEndExclusive: Date,
): AdminCockpitAlert[] {
  const pendingSignatures = snapshot.signatures.filter(
    (request) =>
      request.status === "pending_internal_validation" ||
      request.status === "pending_signature",
  );
  const activeFollowups = snapshot.followups.filter(
    (followup) => followup.status === "scheduled" || followup.status === "sent",
  );
  const blockedAiSuggestions = snapshot.aiSuggestions.filter(
    (suggestion) =>
      suggestion.status === "pending_human_validation" || suggestion.status === "approved",
  );
  const soldHours = snapshot.consultingMissions.reduce(
    (total, mission) => total + (mission.sold_hours ?? 0),
    0,
  );
  const consumedHours = snapshot.consultingMissions.reduce(
    (total, mission) => total + mission.consumed_hours,
    0,
  );
  const consultingRatio = soldHours > 0 ? Math.round((consumedHours / soldHours) * 100) : 0;
  const recentEmails = snapshot.emails.filter((email) =>
    isWithinWindow(email.received_at, windowStart, windowEndExclusive),
  ).length;
  const rangeLabel = adminCockpitRangeLabels[range];

  return [
    pendingSignatures.length > 0
      ? {
          title: `${pendingSignatures.length} validation(s) a arbitrer`,
          detail:
            "Des signatures internes ou externes sont encore en attente sur le circuit documentaire.",
          tone: "rose",
        }
      : {
          title: "Circuit documentaire fluide",
          detail: "Aucune validation bloquante n'est remontee sur le perimetre courant.",
          tone: "emerald",
        },
    activeFollowups.length > 0
      ? {
          title: `${activeFollowups.length} relance(s) en file active`,
          detail:
            `Le poste tresorerie demande une priorisation sur les suivis ${rangeLabel.toLowerCase()} et deja envoyes.`,
          tone: "amber",
        }
      : {
          title: "Relances stabilisees",
          detail: "Aucune relance active n'est actuellement exposee par la base pour ce scope.",
          tone: "emerald",
        },
    blockedAiSuggestions.length > 0 || consultingRatio >= 80
      ? {
          title: "Capacite expertise sous surveillance",
          detail: `IA a valider : ${blockedAiSuggestions.length}. Charge conseil consommee : ${consultingRatio} %. Flux entrants sur la fenetre : ${recentEmails}.`,
          tone: consultingRatio >= 90 ? "rose" : "amber",
        }
      : {
          title: "Capacite expertise maitrisée",
          detail: "Le pipeline IA et les missions de conseil restent dans une zone confortable.",
          tone: "emerald",
        },
  ];
}

function buildPlaceholderCard(
  title: string,
  meta: string,
  owner: string,
  eta: string,
): AdminCockpitKanbanCard {
  return { title, meta, owner, eta };
}

function buildKanbanColumns(snapshot: AdminCockpitSnapshot): AdminCockpitKanbanColumn[] {
  const incomingCards = snapshot.emails
    .filter((email) => email.classification === "unclassified" || email.classification === "client_message")
    .slice(0, 3)
    .map<AdminCockpitKanbanCard>((email) => ({
      title: email.subject,
      meta: email.classification === "unclassified" ? "Email a qualifier" : "Message client",
      owner: "Gestion admin",
      eta: "Aujourd'hui",
    }));

  const activeCards = [
    ...snapshot.followups
      .filter((followup) => followup.status === "scheduled" || followup.status === "sent")
      .slice(0, 2)
      .map<AdminCockpitKanbanCard>((followup) => ({
        title: followup.step_label,
        meta: "Relance tresorerie",
        owner: "Back-office",
        eta: formatRelativeEta(followup.scheduled_for),
      })),
    ...snapshot.consultingMissions
      .filter((mission) => mission.status === "in_progress" || mission.status === "scheduled")
      .slice(0, 2)
      .map<AdminCockpitKanbanCard>((mission) => ({
        title: mission.title,
        meta: "Mission de conseil",
        owner: "Equipe expertise",
        eta: "Cette semaine",
      })),
  ].slice(0, 4);

  const reviewCards = [
    ...snapshot.signatures
      .filter((request) => request.status === "pending_internal_validation")
      .slice(0, 2)
      .map<AdminCockpitKanbanCard>((request) => ({
        title: `Validation signature ${request.id.slice(0, 8)}`,
        meta: "Circuit de validation",
        owner: "Direction travaux",
        eta: "Sous 48 h",
      })),
    ...snapshot.aiSuggestions
      .filter(
        (suggestion) =>
          suggestion.status === "pending_human_validation" || suggestion.status === "approved",
      )
      .slice(0, 2)
      .map<AdminCockpitKanbanCard>((suggestion) => ({
        title: suggestion.title,
        meta: "Validation humaine IA",
        owner: "Referent metier",
        eta: "Ce soir",
      })),
  ].slice(0, 4);

  const doneCards = [
    ...snapshot.consultingMissions
      .filter((mission) => mission.status === "completed" || mission.status === "invoiced")
      .slice(0, 2)
      .map<AdminCockpitKanbanCard>((mission) => ({
        title: mission.title,
        meta: "Conseil livre",
        owner: "Equipe expertise",
        eta: "Livre",
      })),
    ...snapshot.followups
      .filter((followup) => followup.status === "done")
      .slice(0, 2)
      .map<AdminCockpitKanbanCard>((followup) => ({
        title: followup.step_label,
        meta: "Relance cloturee",
        owner: "Back-office",
        eta: "Livre",
      })),
  ].slice(0, 4);

  return [
    {
      id: "incoming",
      title: "A qualifier",
      accent: "amber",
      cards:
        incomingCards.length > 0
          ? incomingCards
          : [buildPlaceholderCard("Aucun flux entrant en attente", "Inbox", "Gestion admin", "RAS")],
    },
    {
      id: "active",
      title: "En cours",
      accent: "sky",
      cards:
        activeCards.length > 0
          ? activeCards
          : [buildPlaceholderCard("Aucune action active", "Exploitation", "Equipe ops", "RAS")],
    },
    {
      id: "review",
      title: "A arbitrer",
      accent: "rose",
      cards:
        reviewCards.length > 0
          ? reviewCards
          : [buildPlaceholderCard("Aucun arbitrage en attente", "Validation", "Direction", "RAS")],
    },
    {
      id: "done",
      title: "Livrables termines",
      accent: "emerald",
      cards:
        doneCards.length > 0
          ? doneCards
          : [buildPlaceholderCard("Aucun livrable clos recemment", "Historique", "Plateforme", "RAS")],
    },
  ];
}

export function buildAdminCockpitData(
  snapshot: AdminCockpitSnapshot,
  options?: AdminCockpitOptions,
): AdminCockpitData {
  const range = normalizeAdminCockpitTimeRange(options?.range);
  const windowStart = getWindowStart(range);
  const windowEndExclusive = addDays(startOfDay(new Date()), 1);

  return {
    source: snapshot.source,
    sourceMessage: snapshot.sourceMessage,
    range,
    rangeLabel: adminCockpitRangeLabels[range],
    updatedAtLabel: buildUpdatedAtLabel(new Date()),
    metrics: buildMetrics(snapshot),
    overviewCards: buildOverviewCards(snapshot, range, windowStart, windowEndExclusive),
    priorities: buildPriorities(snapshot, range),
    healthItems: buildHealthItems(snapshot, snapshot.sourceMessage),
    quickActions: buildQuickActions(snapshot),
    loadSeries: buildLoadSeries(snapshot, range),
    revenueSeries: buildRevenueSeries(snapshot, range),
    alerts: buildAlerts(snapshot, range, windowStart, windowEndExclusive),
    kanbanColumns: buildKanbanColumns(snapshot),
  };
}

async function loadRowsForAdminCockpit(organizationIds: string[]) {
  const supabase = await createClient();

  if (!supabase || organizationIds.length === 0) {
    return null;
  }

  const [projects, documents, signatures, followups, consultingMissions, situations, emails, aiSuggestions] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id,name,status,updated_at,created_at")
        .in("owner_organization_id", organizationIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id,title,status,updated_at,created_at")
        .in("organization_id", organizationIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("signature_requests")
        .select("id,status,updated_at,created_at")
        .in("organization_id", organizationIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("payment_followups")
        .select("id,status,step_label,scheduled_for,updated_at")
        .in("organization_id", organizationIds)
        .order("scheduled_for", { ascending: true }),
      supabase
        .from("consulting_missions")
        .select("id,title,status,sold_hours,consumed_hours,updated_at,created_at")
        .in("organization_id", organizationIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("situations")
        .select("id,reference,status,amount_cents,issued_on")
        .in("organization_id", organizationIds)
        .order("issued_on", { ascending: false }),
      supabase
        .from("emails")
        .select("id,subject,classification,received_at")
        .in("organization_id", organizationIds)
        .order("received_at", { ascending: false }),
      supabase
        .from("ai_suggestions")
        .select("id,title,status,created_at")
        .in("organization_id", organizationIds)
        .order("created_at", { ascending: false }),
    ]);

  return {
    projects,
    documents,
    signatures,
    followups,
    consultingMissions,
    situations,
    emails,
    aiSuggestions,
  };
}

export async function loadAdminCockpitData(
  options?: AdminCockpitOptions,
): Promise<AdminCockpitData> {
  const supabase = await createClient();
  const organizationAccess = await loadOrganizationAccessData(supabase);

  if (organizationAccess.source === "demo") {
    const staticData = cloneStaticCockpitData(organizationAccess.sourceDetail);
    const range = normalizeAdminCockpitTimeRange(options?.range);

    return {
      ...staticData,
      range,
      rangeLabel: adminCockpitRangeLabels[range],
      updatedAtLabel: buildUpdatedAtLabel(new Date()),
    };
  }

  const organizationIds = organizationAccess.organizations.map((organization) => organization.id);

  if (organizationIds.length === 0) {
    return buildAdminCockpitData(
      {
        source: "supabase",
        sourceMessage: organizationAccess.sourceDetail,
        organizationCount: 0,
        projects: [],
        documents: [],
        signatures: [],
        followups: [],
        consultingMissions: [],
        situations: [],
        emails: [],
        aiSuggestions: [],
      },
      options,
    );
  }

  const rows = await loadRowsForAdminCockpit(organizationIds);

  if (!rows) {
    const staticData = cloneStaticCockpitData(
      "Lecture serveur indisponible pour le cockpit admin. Affichage du mode demonstration.",
    );
    const range = normalizeAdminCockpitTimeRange(options?.range);

    return {
      ...staticData,
      range,
      rangeLabel: adminCockpitRangeLabels[range],
      updatedAtLabel: buildUpdatedAtLabel(new Date()),
    };
  }

  const hasReadError =
    rows.projects.error ||
    rows.documents.error ||
    rows.signatures.error ||
    rows.followups.error ||
    rows.consultingMissions.error ||
    rows.situations.error ||
    rows.emails.error ||
    rows.aiSuggestions.error;

  if (hasReadError) {
    return buildAdminCockpitData(
      {
        source: "supabase",
        sourceMessage:
          "Supabase est accessible, mais une partie des indicateurs admin n'a pas pu etre chargee.",
        organizationCount: organizationAccess.organizations.length,
        projects: [],
        documents: [],
        signatures: [],
        followups: [],
        consultingMissions: [],
        situations: [],
        emails: [],
        aiSuggestions: [],
      },
      options,
    );
  }

  return buildAdminCockpitData(
    {
      source: "supabase",
      sourceMessage: `${organizationAccess.organizations.length} organisation(s) consolidee(s) dans le cockpit admin.`,
      organizationCount: organizationAccess.organizations.length,
      projects: rows.projects.data ?? [],
      documents: rows.documents.data ?? [],
      signatures: rows.signatures.data ?? [],
      followups: rows.followups.data ?? [],
      consultingMissions: rows.consultingMissions.data ?? [],
      situations: rows.situations.data ?? [],
      emails: rows.emails.data ?? [],
      aiSuggestions: rows.aiSuggestions.data ?? [],
    },
    options,
  );
}
