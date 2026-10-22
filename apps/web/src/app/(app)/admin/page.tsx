import { FileCheck2, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizations } from "@/lib/data/organizations";
import {
  getAllAccessRequests,
  getAllOrganizationEntitlements,
  getServiceCatalogWithPrices,
  getServiceCategories,
} from "@/lib/data/entitlements";
import {
  approveAccessRequest,
  rejectAccessRequest,
  suspendEntitlement,
  reactivateEntitlement,
  revokeEntitlement,
  extendEntitlement,
} from "@/lib/actions/entitlements";
import { BILLING_MODEL_LABELS, SERVICE_CATEGORY_LABELS } from "@adminbtp/types";

export default async function AdminPage() {
  const [organizations, requests, entitlements, catalog, categories] = await Promise.all([
    getOrganizations(),
    getAllAccessRequests(),
    getAllOrganizationEntitlements(),
    getServiceCatalogWithPrices(),
    getServiceCategories(),
  ]);

  const orgName = (id: string) => organizations.find((o) => o.id === id)?.name ?? id;
  const serviceName = (id: string) => catalog.find((c) => c.id === id)?.name ?? id;
  const categoryLabel = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? SERVICE_CATEGORY_LABELS[cat.code] : "—";
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const requestHistory = requests.filter((r) => r.status !== "PENDING");
  const activeEntitlements = entitlements.filter((e) => e.status === "ACTIVE" || e.status === "SUSPENDED");
  const pastEntitlements = entitlements.filter((e) => e.status === "EXPIRED" || e.status === "REVOKED");

  const overview = (
    <div className="grid gap-3 md:grid-cols-4">
      <Card className="p-4">
        <p className="text-xs text-graphite-500">Organisations clientes</p>
        <p className="text-2xl font-semibold text-graphite-900">{organizations.length}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-graphite-500">Demandes en attente</p>
        <p className="text-2xl font-semibold text-graphite-900">{pendingRequests.length}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-graphite-500">Entitlements actifs</p>
        <p className="text-2xl font-semibold text-graphite-900">
          {entitlements.filter((e) => e.status === "ACTIVE").length}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-graphite-500">Services au catalogue</p>
        <p className="text-2xl font-semibold text-graphite-900">{catalog.length}</p>
      </Card>
      <p className="col-span-full text-xs text-graphite-500">
        Ces compteurs reflètent l&apos;état des droits d&apos;accès enregistrés, pas des montants encaissés réels.
      </p>
    </div>
  );

  const demandesTab = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">En attente ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <EmptyState icon={FileCheck2} title="Aucune demande en attente" />
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-graphite-900">{serviceName(request.serviceId)}</p>
                    <p className="text-xs text-graphite-500">
                      {orgName(request.organizationId)} — demandé le{" "}
                      {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    {request.message && <p className="mt-1 text-xs text-graphite-700">« {request.message} »</p>}
                  </div>
                  <Badge tone="info">En attente</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <form action={approveAccessRequest} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500" htmlFor={`exp-${request.id}`}>
                        Échéance (optionnel)
                      </label>
                      <Input id={`exp-${request.id}`} type="date" name="expiresAt" className="h-8 w-40 text-xs" />
                    </div>
                    <Button type="submit" size="sm" variant="primary">
                      Approuver et activer
                    </Button>
                  </form>
                  <form action={rejectAccessRequest}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      Refuser
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Historique ({requestHistory.length})</h2>
        <Card className="overflow-hidden">
          {requestHistory.length === 0 ? (
            <EmptyState icon={FileCheck2} title="Aucun historique" className="border-none" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                <tr>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Service</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5">Décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {requestHistory.map((request) => (
                  <tr key={request.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 text-graphite-900">{orgName(request.organizationId)}</td>
                    <td className="px-4 py-3 text-graphite-700">{serviceName(request.serviceId)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "danger" : "neutral"}>
                        {request.status === "APPROVED" ? "Approuvée" : request.status === "REJECTED" ? "Refusée" : "Annulée"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-graphite-500">
                      {request.adminDecisionAt ? new Date(request.adminDecisionAt).toLocaleDateString("fr-FR") : "—"}
                      {request.adminNote ? ` — ${request.adminNote}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );

  const entitlementsTab = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Actifs / suspendus ({activeEntitlements.length})</h2>
        {activeEntitlements.length === 0 ? (
          <EmptyState icon={Package} title="Aucun entitlement actif" />
        ) : (
          <div className="space-y-2">
            {activeEntitlements.map((entitlement) => (
              <Card key={entitlement.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-graphite-900">{serviceName(entitlement.serviceId)}</p>
                    <p className="text-xs text-graphite-500">
                      {orgName(entitlement.organizationId)}
                      {entitlement.expiresAt
                        ? ` — échéance ${new Date(entitlement.expiresAt).toLocaleDateString("fr-FR")}`
                        : " — sans échéance"}
                    </p>
                  </div>
                  <Badge tone={entitlement.status === "ACTIVE" ? "success" : "warning"}>
                    {entitlement.status === "ACTIVE" ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  {entitlement.status === "ACTIVE" ? (
                    <form action={suspendEntitlement}>
                      <input type="hidden" name="organizationId" value={entitlement.organizationId} />
                      <input type="hidden" name="serviceId" value={entitlement.serviceId} />
                      <Button type="submit" size="sm" variant="secondary">
                        Suspendre
                      </Button>
                    </form>
                  ) : (
                    <form action={reactivateEntitlement}>
                      <input type="hidden" name="organizationId" value={entitlement.organizationId} />
                      <input type="hidden" name="serviceId" value={entitlement.serviceId} />
                      <Button type="submit" size="sm" variant="primary">
                        Réactiver
                      </Button>
                    </form>
                  )}
                  <form action={extendEntitlement} className="flex items-end gap-2">
                    <input type="hidden" name="organizationId" value={entitlement.organizationId} />
                    <input type="hidden" name="serviceId" value={entitlement.serviceId} />
                    <Input type="date" name="newExpiresAt" required className="h-8 w-36 text-xs" />
                    <Button type="submit" size="sm" variant="secondary">
                      Prolonger
                    </Button>
                  </form>
                  <form action={revokeEntitlement}>
                    <input type="hidden" name="organizationId" value={entitlement.organizationId} />
                    <input type="hidden" name="serviceId" value={entitlement.serviceId} />
                    <Button type="submit" size="sm" variant="danger">
                      Révoquer
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Expirés / révoqués ({pastEntitlements.length})</h2>
        <Card className="overflow-hidden">
          {pastEntitlements.length === 0 ? (
            <EmptyState icon={Package} title="Aucun historique" className="border-none" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                <tr>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Service</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pastEntitlements.map((entitlement) => (
                  <tr key={entitlement.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 text-graphite-900">{orgName(entitlement.organizationId)}</td>
                    <td className="px-4 py-3 text-graphite-700">{serviceName(entitlement.serviceId)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={entitlement.status === "REVOKED" ? "danger" : "neutral"}>
                        {entitlement.status === "REVOKED" ? "Révoqué" : "Expiré"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-graphite-500">{entitlement.revokeReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );

  const catalogueTab = (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
          <tr>
            <th className="px-4 py-2.5">Service</th>
            <th className="px-4 py-2.5">Catégorie</th>
            <th className="px-4 py-2.5">Modèle tarifaire</th>
            <th className="px-4 py-2.5">Validation requise</th>
            <th className="px-4 py-2.5">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {catalog.map((item) => (
            <tr key={item.id} className="hover:bg-surface-subtle">
              <td className="px-4 py-3 font-medium text-graphite-900">{item.name}</td>
              <td className="px-4 py-3 text-graphite-700">{categoryLabel(item.categoryId)}</td>
              <td className="px-4 py-3 text-graphite-700">{BILLING_MODEL_LABELS[item.billingModel]}</td>
              <td className="px-4 py-3">
                <Badge tone={item.requiresAdminApproval ? "warning" : "success"}>
                  {item.requiresAdminApproval ? "Oui" : "Non (auto)"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Actif" : "Inactif"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Catalogue, demandes d'activation et entitlements — réservé au Super Administrateur."
      />
      <Tabs
        defaultKey="overview"
        tabs={[
          { key: "overview", label: "Vue d'ensemble", content: overview },
          { key: "demandes", label: `Demandes (${pendingRequests.length})`, content: demandesTab },
          { key: "entitlements", label: "Entitlements", content: entitlementsTab },
          { key: "catalogue", label: "Catalogue", content: catalogueTab },
        ]}
      />
    </div>
  );
}
