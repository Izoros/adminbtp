import { BellRing } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { mockSituations, mockSites } from "@/lib/mock-data";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "@adminbtp/types";

const STATUS_TONE: Record<PaymentStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  A_ETABLIR: "neutral",
  TRANSMIS: "info",
  EN_VERIFICATION: "info",
  ACCEPTE: "success",
  CONTESTE: "danger",
  PAYE: "success",
};

function isOverdue(dueDate?: string, paidAt?: string) {
  if (!dueDate || paidAt) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export default function RelancesPage() {
  const sorted = [...mockSituations].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const overdueCount = sorted.filter((s) => isOverdue(s.dueDate, s.paidAt)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relances"
        description={`${mockSituations.length} situations suivies — règles de relance configurables par contrat/marché`}
      />

      {overdueCount > 0 && (
        <Card className="border-status-danger/30 bg-status-danger/5 p-4">
          <p className="text-sm text-graphite-900">
            <strong>{overdueCount} échéance{overdueCount > 1 ? "s" : ""}</strong> dépassée
            {overdueCount > 1 ? "s" : ""} sans règlement. Vérifiez les règles de relance applicables à chaque marché.
          </p>
        </Card>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={BellRing} title="Aucune situation à suivre" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-4 py-2.5">Chantier</th>
                <th className="px-4 py-2.5">Situation</th>
                <th className="px-4 py-2.5">Montant HT</th>
                <th className="px-4 py-2.5">Échéance</th>
                <th className="px-4 py-2.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {sorted.map((sit) => {
                const site = mockSites.find((s) => s.id === sit.siteId);
                const overdue = isOverdue(sit.dueDate, sit.paidAt);
                return (
                  <tr key={sit.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 font-medium text-graphite-900">{site?.name ?? sit.siteId}</td>
                    <td className="px-4 py-3 text-graphite-700">Situation n°{sit.number}</td>
                    <td className="px-4 py-3 text-graphite-700">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(sit.amountHt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={overdue ? "font-medium text-status-danger" : "text-graphite-700"}>
                        {sit.dueDate ? new Date(sit.dueDate).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[sit.status]}>{PAYMENT_STATUS_LABELS[sit.status]}</Badge>
                      {sit.disputeReason && (
                        <p className="mt-1 text-xs text-graphite-500">{sit.disputeReason}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
