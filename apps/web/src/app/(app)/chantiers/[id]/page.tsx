import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  mockSites,
  mockOrganizations,
  mockSiteParticipants,
  mockLots,
  mockPhaseInstances,
  mockPhaseTemplates,
  mockDocuments,
  mockMailThreads,
  mockTasks,
} from "@/lib/mock-data";
import {
  SITE_STATUS_LABELS,
  MISSION_ROLE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  MAIL_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from "@adminbtp/types";
import { FileText, Mail as MailIcon, CheckSquare } from "lucide-react";

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
  const site = mockSites.find((s) => s.id === id);
  if (!site) notFound();

  const org = mockOrganizations.find((o) => o.id === site.organizationId);
  const participants = mockSiteParticipants.filter((p) => p.siteId === site.id);
  const lots = mockLots.filter((l) => l.siteId === site.id);
  const phases = mockPhaseInstances.filter((p) => p.siteId === site.id);
  const documents = mockDocuments.filter((d) => d.siteId === site.id);
  const mails = mockMailThreads.filter((m) => m.siteId === site.id);
  const tasks = mockTasks.filter((t) => t.siteId === site.id);

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
                  <CardContent className="space-y-2">
                    {participants.map((p) => {
                      const pOrg = mockOrganizations.find((o) => o.id === p.organizationId);
                      return (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-graphite-900">{pOrg?.name}</span>
                          <Badge tone="info">{MISSION_ROLE_LABELS[p.missionRole]}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Lots</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {lots.length === 0 ? (
                      <p className="text-sm text-graphite-500">Aucun lot défini.</p>
                    ) : (
                      lots.map((lot) => (
                        <div key={lot.id} className="flex items-center justify-between text-sm">
                          <span className="text-graphite-900">{lot.number} — {lot.name}</span>
                          <span className="text-graphite-500">{formatEuro(lot.amountHt)}</span>
                        </div>
                      ))
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
                    const template = mockPhaseTemplates.find((t) => t.id === phase.phaseTemplateId);
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
                        <td className="px-4 py-3 text-right"><Badge>{DOCUMENT_STATUS_LABELS[doc.status]}</Badge></td>
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
        ]}
      />
    </div>
  );
}
