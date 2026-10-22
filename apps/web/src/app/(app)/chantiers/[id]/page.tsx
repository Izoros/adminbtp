import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Lock, Unlock } from "lucide-react";
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
import { getSituationsBySite, getSituationLines, getSituationAllocations } from "@/lib/data/finance";
import { emitAct } from "@/lib/actions/acts";
import { createMarketContract, createPriceLine } from "@/lib/actions/market";
import { createSituation, addSituationLine, addSituationAllocation } from "@/lib/actions/finance";
import { runAiReview } from "@/lib/actions/document-reviews";
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

  const [marketClauses, priceLines, situationLines, situationAllocations] = await Promise.all([
    getMarketClauses(marketContracts.map((c) => c.id)),
    getPriceLines(lots.map((l) => l.id)),
    getSituationLines(situations.map((s) => s.id)),
    getSituationAllocations(situations.map((s) => s.id)),
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
    participants.filter((p) => p.organizationId === activeOrg?.id).map((p) => p.missionRole)
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
                      const pOrg = organizations.find((o) => o.id === p.organizationId);
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
                  <CardContent className="space-y-1">
                    {lots.length === 0 ? (
                      <p className="text-sm text-graphite-500">Aucun lot défini.</p>
                    ) : (
                      rootLots.map((lot) => (
                        <div key={lot.id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-graphite-900">{lot.number} — {lot.name}</span>
                            <span className="text-graphite-500">{formatEuro(lot.amountHt)}</span>
                          </div>
                          {(childLotsByParent.get(lot.id) ?? []).map((child) => (
                            <div key={child.id} className="ml-5 flex items-center justify-between border-l border-surface-border pl-3 text-sm">
                              <span className="text-graphite-700">{child.number} — {child.name}</span>
                              <span className="text-graphite-500">{formatEuro(child.amountHt)}</span>
                            </div>
                          ))}
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
                        return (
                          <Card key={situation.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-graphite-900">Situation n°{situation.number}</p>
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
                    <Button type="submit" size="sm" variant="accent">Nouvelle situation</Button>
                  </form>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
