import Link from "next/link";
import { BookUser, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizations } from "@/lib/data/organizations";
import { getActiveOrganizationIdCookie, resolveActiveOrganization } from "@/lib/data/organization-context";
import { getDirectoryCategories, getDirectoryCompaniesBrowse } from "@/lib/data/directory";
import { getOrganizationEntitlements, getServiceCatalogWithPrices } from "@/lib/data/entitlements";
import { getTradeCodes } from "@/lib/data/trades";

function isEntitlementActive(expiresAt?: string) {
  return !expiresAt || new Date(expiresAt) > new Date();
}

export default async function AnnuairePage() {
  const [organizations, activeOrgCookie, categories, catalog, trades, companies] = await Promise.all([
    getOrganizations(),
    getActiveOrganizationIdCookie(),
    getDirectoryCategories(),
    getServiceCatalogWithPrices(),
    getTradeCodes(),
    getDirectoryCompaniesBrowse(),
  ]);
  const activeOrg = resolveActiveOrganization(organizations, activeOrgCookie);
  const entitlements = activeOrg ? await getOrganizationEntitlements(activeOrg.id) : [];

  const activeServiceCodes = new Set(
    entitlements
      .filter((e) => e.status === "ACTIVE" && isEntitlementActive(e.expiresAt))
      .map((e) => catalog.find((c) => c.id === e.serviceId)?.code)
      .filter((code): code is string => Boolean(code))
  );
  const tradesById = new Map(trades.map((t) => [t.id, t]));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Annuaire BTP"
        description={
          activeOrg
            ? `Entreprises, bureaux d'études et fournisseurs — accès réservé aux catégories souscrites par ${activeOrg.name}.`
            : "Entreprises, bureaux d'études et fournisseurs du BTP."
        }
      />

      {!activeOrg ? (
        <EmptyState icon={BookUser} title="Aucune organisation accessible" />
      ) : (
        categories.map((category) => {
          const hasAccess = activeServiceCodes.has(category.serviceCode);
          const categoryCompanies = companies.filter((c) => c.categoryId === category.id);
          return (
            <div key={category.id}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-graphite-900">{category.label}</h2>
                {!hasAccess && <Badge tone="neutral">Non souscrit</Badge>}
              </div>
              {!hasAccess ? (
                <Card className="flex items-center justify-between gap-4 p-4">
                  <p className="text-sm text-graphite-500">
                    Souscrivez à ce service pour consulter les fiches de cette catégorie.
                  </p>
                  <Link href="/services" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    <Lock className="h-4 w-4" />
                    Voir les services
                  </Link>
                </Card>
              ) : categoryCompanies.length === 0 ? (
                <EmptyState icon={BookUser} title="Aucune fiche dans cette catégorie" />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {categoryCompanies.map((company) => {
                    const trade = company.tradeCodeId ? tradesById.get(company.tradeCodeId) : undefined;
                    return (
                      <Link key={company.id} href={`/annuaire/${company.id}`}>
                        <Card className="h-full p-4 transition-shadow hover:shadow-md">
                          <p className="font-medium text-graphite-900">{company.name}</p>
                          <p className="text-xs text-graphite-500">
                            {company.city ?? "—"}
                            {company.postalCode ? ` (${company.postalCode})` : ""}
                          </p>
                          {trade && (
                            <Badge tone="info" className="mt-2">
                              {trade.label}
                            </Badge>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
