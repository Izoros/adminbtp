import Link from "next/link";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AuditLogCsvExportButton } from "@/components/audit/audit-log-csv-export-button";
import { getAuditLogEntries, getAuditLogActionTypes } from "@/lib/data/audit-log";
import { getOrganizations } from "@/lib/data/organizations";
import { getUserFullNames } from "@/lib/data/users";
import type { AuditLogEntry } from "@adminbtp/types";
import { cn } from "@/lib/utils";

const ACTOR_TYPE_LABELS: Record<AuditLogEntry["actorType"], string> = {
  USER: "Utilisateur",
  AUTOMATION: "Automatisation",
  AI: "IA",
};

const ACTOR_TYPE_TONE: Record<AuditLogEntry["actorType"], "neutral" | "info" | "accent"> = {
  USER: "neutral",
  AUTOMATION: "info",
  AI: "accent",
};

interface AuditPageSearchParams {
  organizationId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildAuditHref(filters: AuditPageSearchParams, page: number): string {
  const params = new URLSearchParams();
  if (filters.organizationId) params.set("organizationId", filters.organizationId);
  if (filters.action) params.set("action", filters.action);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/audit?${qs}` : "/audit";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters: AuditPageSearchParams = {
    organizationId: firstValue(rawParams.organizationId) || undefined,
    action: firstValue(rawParams.action) || undefined,
    dateFrom: firstValue(rawParams.dateFrom) || undefined,
    dateTo: firstValue(rawParams.dateTo) || undefined,
    page: firstValue(rawParams.page) || undefined,
  };
  const page = Number.parseInt(filters.page ?? "1", 10) || 1;

  const [organizations, actionTypes, auditPage] = await Promise.all([
    getOrganizations(),
    getAuditLogActionTypes(),
    getAuditLogEntries({
      organizationId: filters.organizationId,
      action: filters.action,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page,
    }),
  ]);

  const actorNames = await getUserFullNames(
    auditPage.entries.map((entry) => entry.actorUserId).filter((id): id is string => Boolean(id))
  );
  const organizationNames = Object.fromEntries(organizations.map((org) => [org.id, org.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'audit"
        description={`${auditPage.total} entrée${auditPage.total > 1 ? "s" : ""} — traçabilité RGPD et preuve des actions sensibles`}
      />

      <Card className="p-4">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {organizations.length > 1 && (
            <div className="space-y-1">
              <label htmlFor="organizationId" className="text-xs font-medium text-graphite-500">
                Organisation
              </label>
              <Select id="organizationId" name="organizationId" defaultValue={filters.organizationId ?? ""}>
                <option value="">Toutes</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="action" className="text-xs font-medium text-graphite-500">
              Type d&apos;action
            </label>
            <Select id="action" name="action" defaultValue={filters.action ?? ""}>
              <option value="">Toutes</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="dateFrom" className="text-xs font-medium text-graphite-500">
              Du
            </label>
            <Input id="dateFrom" type="date" name="dateFrom" defaultValue={filters.dateFrom ?? ""} />
          </div>

          <div className="space-y-1">
            <label htmlFor="dateTo" className="text-xs font-medium text-graphite-500">
              Au
            </label>
            <Input id="dateTo" type="date" name="dateTo" defaultValue={filters.dateTo ?? ""} />
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Filtrer
            </Button>
            <Link href="/audit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Réinitialiser
            </Link>
          </div>
        </form>
      </Card>

      {auditPage.entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Aucune entrée d'audit pour ces filtres"
          description="Les actions sensibles (validations, octrois d'accès, mouvements de crédits…) apparaissent ici au fur et à mesure."
        />
      ) : (
        <>
          <div className="flex justify-end">
            <AuditLogCsvExportButton
              entries={auditPage.entries}
              organizationNames={organizationNames}
              actorNames={actorNames}
            />
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                <tr>
                  <th className="px-4 py-2.5">Horodatage</th>
                  {organizations.length > 1 && <th className="px-4 py-2.5">Organisation</th>}
                  <th className="px-4 py-2.5">Auteur</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Cible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {auditPage.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 whitespace-nowrap text-graphite-700">
                      {new Date(entry.createdAt).toLocaleString("fr-FR", { timeZone: "Indian/Mayotte" })}
                    </td>
                    {organizations.length > 1 && (
                      <td className="px-4 py-3 text-graphite-700">
                        {organizationNames[entry.organizationId] ?? entry.organizationId}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="text-graphite-900">
                        {entry.actorUserId ? actorNames[entry.actorUserId] ?? "Utilisateur inconnu" : "—"}
                      </div>
                      <Badge tone={ACTOR_TYPE_TONE[entry.actorType]} className="mt-1">
                        {ACTOR_TYPE_LABELS[entry.actorType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-graphite-900">{entry.action}</td>
                    <td className="px-4 py-3 text-graphite-500">
                      {entry.targetType} · {entry.targetId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="flex items-center justify-between text-sm text-graphite-500">
            <p>
              Page {auditPage.page} / {auditPage.pageCount}
            </p>
            <div className="flex gap-2">
              <Link
                href={buildAuditHref(filters, Math.max(1, auditPage.page - 1))}
                aria-disabled={auditPage.page <= 1}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  auditPage.page <= 1 && "pointer-events-none opacity-50"
                )}
              >
                Précédent
              </Link>
              <Link
                href={buildAuditHref(filters, Math.min(auditPage.pageCount, auditPage.page + 1))}
                aria-disabled={auditPage.page >= auditPage.pageCount}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  auditPage.page >= auditPage.pageCount && "pointer-events-none opacity-50"
                )}
              >
                Suivant
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
