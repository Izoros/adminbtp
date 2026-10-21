import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSites } from "@/lib/data/sites";
import { getOrganizations } from "@/lib/data/organizations";
import { SITE_STATUS_LABELS, type SiteStatus } from "@adminbtp/types";

const STATUS_TONE: Record<SiteStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  ETUDE: "neutral",
  CONSULTATION: "neutral",
  PREPARATION: "info",
  EN_COURS: "info",
  RECEPTION: "warning",
  GPA: "warning",
  CLOTURE: "success",
  SUSPENDU: "danger",
};

function formatEuro(amount?: number) {
  if (amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

export default async function ChantiersPage() {
  const [sites, organizations] = await Promise.all([getSites(), getOrganizations()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chantiers"
        description={`${sites.length} chantiers suivis`}
        action={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4" />
            Nouveau chantier
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {sites.map((site) => {
          const org = organizations.find((o) => o.id === site.organizationId);
          return (
            <Link key={site.id} href={`/chantiers/${site.id}`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-graphite-500">{site.reference}</p>
                    <h3 className="font-medium text-graphite-900">{site.name}</h3>
                    <p className="text-xs text-graphite-500">{org?.name} — {site.city}</p>
                  </div>
                  <Badge tone={STATUS_TONE[site.status]}>{SITE_STATUS_LABELS[site.status]}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-graphite-500">
                  <span>Budget HT : {formatEuro(site.budgetHt)}</span>
                  <span>Fin prévue : {site.endDateEstimated ?? "—"}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
