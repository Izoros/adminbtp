import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizations } from "@/lib/data/organizations";
import { getSites } from "@/lib/data/sites";

const PLAN_TONE = { DEMO: "neutral", STARTER: "info", PRO: "success", ENTERPRISE: "accent" } as const;

export default async function OrganisationsPage() {
  const [organizations, sites] = await Promise.all([getOrganizations(), getSites()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations clientes"
        description={`${organizations.length} sociétés gérées sur la plateforme`}
        action={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4" />
            Nouvelle organisation
          </Button>
        }
      />

      {organizations.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune organisation" description="Créez votre première société cliente." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-4 py-2.5">Société</th>
                <th className="px-4 py-2.5">Ville</th>
                <th className="px-4 py-2.5">Chantiers</th>
                <th className="px-4 py-2.5">Domaine mail</th>
                <th className="px-4 py-2.5">Abonnement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {organizations.map((org) => {
                const siteCount = sites.filter((s) => s.organizationId === org.id).length;
                return (
                  <tr key={org.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3">
                      <Link href={`/organisations/${org.id}`} className="font-medium text-graphite-900 hover:underline">
                        {org.name}
                      </Link>
                      <p className="text-xs text-graphite-500">{org.siret ?? "SIRET non renseigné"}</p>
                    </td>
                    <td className="px-4 py-3 text-graphite-700">{org.city}</td>
                    <td className="px-4 py-3 text-graphite-700">{siteCount}</td>
                    <td className="px-4 py-3">
                      {org.domain ? (
                        <Badge tone={org.domainVerified ? "success" : "warning"}>
                          {org.domain} {org.domainVerified ? "· vérifié" : "· non vérifié"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-graphite-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={PLAN_TONE[org.subscriptionPlan]}>{org.subscriptionPlan}</Badge>
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
