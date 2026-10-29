import { Store, Building2, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizations } from "@/lib/data/organizations";
import {
  getActiveOrganizationIdCookie,
  resolveActiveOrganization,
} from "@/lib/data/organization-context";
import {
  getAccessRequestsForOrganization,
  getOrganizationEntitlements,
  getServiceCatalogWithPrices,
  getServiceCategories,
} from "@/lib/data/entitlements";
import { getPremiumDocumentTemplates, getTemplatePurchasesForOrganization } from "@/lib/data/templates";
import { requestServiceAccess, cancelAccessRequest } from "@/lib/actions/entitlements";
import { requestTemplatePurchase } from "@/lib/actions/templates";
import {
  BILLING_MODEL_LABELS,
  SERVICE_CATEGORY_LABELS,
  type EntitlementStatus,
} from "@adminbtp/types";

function formatPrice(amountCents: number, currency: string, billingModel: string) {
  if (billingModel === "QUOTE") return "Sur devis";
  if (amountCents === 0) return "Inclus";
  const amount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
  switch (billingModel) {
    case "SUBSCRIPTION_MONTHLY":
      return `${amount} / mois`;
    case "SUBSCRIPTION_ANNUAL":
      return `${amount} / an`;
    case "PER_UNIT":
      return `${amount} / unité`;
    default:
      return amount;
  }
}

const ENTITLEMENT_TONE: Record<EntitlementStatus, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  EXPIRED: "neutral",
  REVOKED: "danger",
};

export default async function ServicesPage() {
  const [organizations, activeOrgCookie, categories, catalog, premiumTemplates] = await Promise.all([
    getOrganizations(),
    getActiveOrganizationIdCookie(),
    getServiceCategories(),
    getServiceCatalogWithPrices(),
    getPremiumDocumentTemplates(),
  ]);
  const activeOrg = resolveActiveOrganization(organizations, activeOrgCookie);

  const [entitlements, accessRequests, templatePurchases] = activeOrg
    ? await Promise.all([
        getOrganizationEntitlements(activeOrg.id),
        getAccessRequestsForOrganization(activeOrg.id),
        getTemplatePurchasesForOrganization(activeOrg.id),
      ])
    : [[], [], []];

  const entitlementByService = new Map(entitlements.map((e) => [e.serviceId, e]));
  const pendingRequestByService = new Map(
    accessRequests.filter((r) => r.status === "PENDING" && !r.documentTemplateCatalogId).map((r) => [r.serviceId, r])
  );
  const purchasedTemplateIds = new Set(templatePurchases.map((p) => p.templateCatalogId));
  const pendingTemplateRequestByTemplate = new Map(
    accessRequests
      .filter((r) => r.status === "PENDING" && r.documentTemplateCatalogId)
      .map((r) => [r.documentTemplateCatalogId as string, r])
  );
  const activePremiumTemplates = premiumTemplates.filter((t) => t.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services & options"
        description={
          activeOrg
            ? `Catalogue de services premium pour ${activeOrg.name} — toute activation est soumise à validation par un Super Administrateur.`
            : "Catalogue de services premium."
        }
      />

      {!activeOrg ? (
        <EmptyState icon={Building2} title="Aucune organisation accessible" />
      ) : catalog.length === 0 ? (
        <EmptyState icon={Store} title="Catalogue vide" />
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const items = catalog.filter((item) => item.categoryId === category.id);
            if (items.length === 0) return null;
            return (
              <div key={category.id}>
                <h2 className="mb-2 text-sm font-semibold text-graphite-900">
                  {SERVICE_CATEGORY_LABELS[category.code]}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const entitlement = entitlementByService.get(item.id);
                    const pendingRequest = pendingRequestByService.get(item.id);
                    return (
                      <Card key={item.id} className="flex flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-graphite-900">{item.name}</h3>
                          {entitlement && (
                            <Badge tone={ENTITLEMENT_TONE[entitlement.status]}>
                              {entitlement.status === "ACTIVE"
                                ? "Actif"
                                : entitlement.status === "SUSPENDED"
                                  ? "Suspendu"
                                  : entitlement.status === "REVOKED"
                                    ? "Révoqué"
                                    : "Expiré"}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-xs text-graphite-500">{item.description}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs text-graphite-500">
                          <span>{BILLING_MODEL_LABELS[item.billingModel]}</span>
                          <span className="font-medium text-graphite-900">
                            {item.currentPrice
                              ? formatPrice(item.currentPrice.amountCents, item.currentPrice.currency, item.billingModel)
                              : "—"}
                          </span>
                        </div>
                        {entitlement?.expiresAt && entitlement.status === "ACTIVE" && (
                          <p className="mt-1 text-xs text-graphite-500">
                            Échéance : {new Date(entitlement.expiresAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                        <div className="mt-3">
                          {entitlement?.status === "ACTIVE" ? null : pendingRequest ? (
                            <form action={cancelAccessRequest.bind(null, pendingRequest.id)}>
                              <Badge tone="info" className="mb-2 block w-fit">
                                Demande en attente
                              </Badge>
                              <Button type="submit" size="sm" variant="secondary">
                                Annuler la demande
                              </Button>
                            </form>
                          ) : (
                            <form action={requestServiceAccess}>
                              <input type="hidden" name="organizationId" value={activeOrg.id} />
                              <input type="hidden" name="serviceId" value={item.id} />
                              <Button type="submit" size="sm" variant="accent">
                                Demander l&apos;activation
                              </Button>
                            </form>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle>Historique des demandes</CardTitle>
            </CardHeader>
            <CardContent>
              {accessRequests.length === 0 ? (
                <p className="text-sm text-graphite-500">Aucune demande pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {accessRequests.map((request) => {
                    const template = request.documentTemplateCatalogId
                      ? premiumTemplates.find((t) => t.id === request.documentTemplateCatalogId)
                      : undefined;
                    const service = catalog.find((c) => c.id === request.serviceId);
                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between gap-4 border-b border-surface-border pb-2 text-sm last:border-none last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-graphite-900">
                            {template ? template.name : service?.name ?? request.serviceId}
                          </p>
                          <p className="text-xs text-graphite-500">
                            {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                            {request.adminNote ? ` — ${request.adminNote}` : ""}
                          </p>
                        </div>
                        <Badge
                          tone={
                            request.status === "APPROVED"
                              ? "success"
                              : request.status === "REJECTED"
                                ? "danger"
                                : request.status === "CANCELLED"
                                  ? "neutral"
                                  : "info"
                          }
                        >
                          {request.status === "PENDING"
                            ? "En attente"
                            : request.status === "APPROVED"
                              ? "Approuvée"
                              : request.status === "REJECTED"
                                ? "Refusée"
                                : "Annulée"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-graphite-900">
              Modèles de documents premium
            </h2>
            <p className="mb-3 text-xs text-graphite-500">
              Un modèle acheté reste utilisable même s&apos;il est ensuite retiré du catalogue —
              l&apos;achat est définitif, propre à {activeOrg.name}, jamais transféré à une autre
              organisation. Aucun paiement réel n&apos;est prélevé ici : &laquo;&nbsp;Acheter&nbsp;&raquo;
              crée une demande soumise à validation par un Super Administrateur, comme pour les
              autres services du catalogue.
            </p>
            {activePremiumTemplates.length === 0 ? (
              <EmptyState icon={FileText} title="Aucun modèle premium au catalogue" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activePremiumTemplates.map((template) => {
                  const isPurchased = purchasedTemplateIds.has(template.id);
                  const pendingRequest = pendingTemplateRequestByTemplate.get(template.id);
                  return (
                    <Card key={template.id} className="flex flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-graphite-900">{template.name}</h3>
                        {isPurchased && <Badge tone="success">Déjà acheté</Badge>}
                      </div>
                      {template.description && (
                        <p className="mt-1 text-xs text-graphite-500">{template.description}</p>
                      )}
                      <p className="mt-2 text-xs text-graphite-500">Service : {template.serviceCode}</p>
                      <div className="mt-3">
                        {isPurchased ? (
                          <p className="text-xs text-graphite-500">
                            Génération disponible depuis l&apos;écran Documents.
                          </p>
                        ) : pendingRequest ? (
                          <form action={cancelAccessRequest.bind(null, pendingRequest.id)}>
                            <Badge tone="info" className="mb-2 block w-fit">
                              Demande d&apos;achat en attente
                            </Badge>
                            <Button type="submit" size="sm" variant="secondary">
                              Annuler la demande
                            </Button>
                          </form>
                        ) : (
                          <form action={requestTemplatePurchase}>
                            <input type="hidden" name="organizationId" value={activeOrg.id} />
                            <input type="hidden" name="templateCatalogId" value={template.id} />
                            <Button type="submit" size="sm" variant="accent">
                              Acheter
                            </Button>
                          </form>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
