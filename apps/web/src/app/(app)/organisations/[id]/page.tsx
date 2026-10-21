import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockOrganizations, mockSites } from "@/lib/mock-data";
import { SITE_STATUS_LABELS } from "@adminbtp/types";

export default async function OrganisationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = mockOrganizations.find((o) => o.id === id);
  if (!org) notFound();

  const sites = mockSites.filter((s) => s.organizationId === org.id);

  return (
    <div className="space-y-6">
      <Link href="/organisations" className="inline-flex items-center gap-1.5 text-sm text-graphite-500 hover:text-graphite-900">
        <ArrowLeft className="h-4 w-4" />
        Organisations clientes
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-graphite-900">{org.name}</h1>
        <p className="text-sm text-graphite-500">
          {org.legalName} — {org.city} {org.postalCode}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Identité légale</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-graphite-700">
            <p>SIRET : {org.siret ?? "non renseigné"}</p>
            <p>Pays : {org.country}</p>
            <p>Abonnement : <Badge>{org.subscriptionPlan}</Badge></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Domaine mail</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-graphite-700">
            <p>{org.domain ?? "Aucun domaine configuré"}</p>
            {org.domain && (
              <Badge tone={org.domainVerified ? "success" : "warning"}>
                {org.domainVerified ? "Vérifié" : "Non vérifié — à valider avant provisionnement"}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Chantiers</CardTitle></CardHeader>
          <CardContent className="text-sm text-graphite-700">{sites.length} chantier(s) suivi(s)</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Chantiers de l&apos;organisation</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {sites.length === 0 ? (
            <p className="text-sm text-graphite-500">Aucun chantier pour cette organisation.</p>
          ) : (
            sites.map((site) => (
              <Link
                key={site.id}
                href={`/chantiers/${site.id}`}
                className="flex items-center justify-between rounded-md border border-surface-border px-3 py-2 text-sm hover:bg-surface-subtle"
              >
                <span className="font-medium text-graphite-900">{site.name}</span>
                <Badge>{SITE_STATUS_LABELS[site.status]}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
