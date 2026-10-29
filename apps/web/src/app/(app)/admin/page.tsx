import { FileCheck2, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  grantEntitlement,
} from "@/lib/actions/entitlements";
import { getDirectoryCategories, getDirectoryCompaniesAdmin, getDirectorySources } from "@/lib/data/directory";
import { importDirectoryCsv } from "@/lib/actions/directory";
import { getAllTemplatePurchases, getPremiumDocumentTemplates } from "@/lib/data/templates";
import { approveTemplatePurchaseRequest } from "@/lib/actions/templates";
import { BILLING_MODEL_LABELS, SERVICE_CATEGORY_LABELS } from "@adminbtp/types";

export default async function AdminPage() {
  const [
    organizations,
    requests,
    entitlements,
    catalog,
    categories,
    directoryCategories,
    directoryCompanies,
    directorySources,
    premiumTemplates,
    templatePurchases,
  ] = await Promise.all([
    getOrganizations(),
    getAllAccessRequests(),
    getAllOrganizationEntitlements(),
    getServiceCatalogWithPrices(),
    getServiceCategories(),
    getDirectoryCategories(),
    getDirectoryCompaniesAdmin(),
    getDirectorySources(),
    getPremiumDocumentTemplates(),
    getAllTemplatePurchases(),
  ]);

  const orgName = (id: string) => organizations.find((o) => o.id === id)?.name ?? id;
  const serviceName = (id: string) => catalog.find((c) => c.id === id)?.name ?? id;
  const templateName = (id: string) => premiumTemplates.find((t) => t.id === id)?.name ?? id;
  const categoryLabel = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? SERVICE_CATEGORY_LABELS[cat.code] : "—";
  };

  // Demandes génériques de service (hors achats de modèle premium, traités dans un onglet dédié).
  const genericRequests = requests.filter((r) => !r.documentTemplateCatalogId);
  const pendingRequests = genericRequests.filter((r) => r.status === "PENDING");
  const requestHistory = genericRequests.filter((r) => r.status !== "PENDING");

  const templateRequests = requests.filter((r) => r.documentTemplateCatalogId);
  const pendingTemplateRequests = templateRequests.filter((r) => r.status === "PENDING");
  const templateRequestHistory = templateRequests.filter((r) => r.status !== "PENDING");
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
      <Card>
        <CardHeader>
          <CardTitle>Octroyer directement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-graphite-500">
            Geste commercial ou essai, sans passer par une demande — le quota (optionnel) limite le
            nombre de fiches annuaire distinctes consultées par mois civil pour les services concernés.
          </p>
          <form action={grantEntitlement} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-graphite-500">Organisation</label>
              <Select name="organizationId" className="h-8 w-48 text-xs" required defaultValue="">
                <option value="" disabled>Choisir…</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-graphite-500">Service</label>
              <Select name="serviceId" className="h-8 w-56 text-xs" required defaultValue="">
                <option value="" disabled>Choisir…</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-graphite-500">Échéance (optionnel)</label>
              <Input type="date" name="expiresAt" className="h-8 w-36 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-graphite-500">Quota mensuel (optionnel)</label>
              <Input type="number" name="accessQuota" min="1" className="h-8 w-24 text-xs" placeholder="Illimité" />
            </div>
            <Button type="submit" size="sm" variant="accent">Octroyer</Button>
          </form>
        </CardContent>
      </Card>

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
                      {entitlement.accessQuota ? ` — quota ${entitlement.accessQuota}/mois` : ""}
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

  const annuaireTab = (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {directoryCategories.map((cat) => (
          <Card key={cat.id} className="p-4">
            <p className="text-xs text-graphite-500">{cat.label}</p>
            <p className="text-2xl font-semibold text-graphite-900">
              {directoryCompanies.filter((c) => c.categoryId === cat.id).length}
            </p>
            <p className="text-xs text-graphite-500">Service requis : {cat.serviceCode}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importer des fiches (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-graphite-500">
            Colonnes attendues : category_code, name, siret, trade_code, address, postal_code, city,
            phone, email, website, contact_name, contact_role, contact_email, contact_phone. Codes de
            catégorie : {directoryCategories.map((c) => c.code).join(", ")}. Déduplication par SIRET,
            sinon nom + code postal — aucune fiche dupliquée recréée. Pas d&apos;import XLSX (hors
            scope, voir docs/ROADMAP.md).
          </p>
          <form action={importDirectoryCsv} className="space-y-2">
            <Input name="label" placeholder="Libellé de l'import (ex: Lot annuaire BTP octobre 2026)" required />
            <textarea
              name="csvText"
              required
              rows={6}
              placeholder={"category_code,name,siret,trade_code,address,postal_code,city,phone,email,website\nENTREPRISE_BTP,Exemple SARL,12345678900012,GO,1 rue Test,97600,Mamoudzou,0269600000,contact@exemple.yt,"}
              className="w-full rounded-md border border-surface-border bg-surface-white p-2 font-mono text-xs text-graphite-900"
            />
            <Button type="submit" variant="accent" size="sm">Importer</Button>
          </form>
          {directorySources.length > 0 && (
            <div className="border-t border-surface-border pt-3 text-xs text-graphite-500">
              <p className="mb-1 font-medium text-graphite-700">Derniers imports</p>
              {directorySources.slice(0, 5).map((source) => (
                <p key={source.id}>
                  {source.label} — {new Date(source.importedAt).toLocaleDateString("fr-FR")} :{" "}
                  {source.createdCount} créées, {source.skippedCount} ignorées (doublons),{" "}
                  {source.errorCount} erreurs
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
            <tr>
              <th className="px-4 py-2.5">Fiche</th>
              <th className="px-4 py-2.5">Catégorie</th>
              <th className="px-4 py-2.5">SIRET</th>
              <th className="px-4 py-2.5">Ville</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {directoryCompanies.map((company) => (
              <tr key={company.id} className="hover:bg-surface-subtle">
                <td className="px-4 py-3 font-medium text-graphite-900">{company.name}</td>
                <td className="px-4 py-3 text-graphite-700">
                  {directoryCategories.find((c) => c.id === company.categoryId)?.label ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-graphite-500">{company.siret ?? "—"}</td>
                <td className="px-4 py-3 text-graphite-700">{company.city ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const modelesTab = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">
          Demandes d&apos;achat en attente ({pendingTemplateRequests.length})
        </h2>
        {pendingTemplateRequests.length === 0 ? (
          <EmptyState icon={FileCheck2} title="Aucune demande en attente" />
        ) : (
          <div className="space-y-2">
            {pendingTemplateRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-graphite-900">
                      {templateName(request.documentTemplateCatalogId ?? "")}
                    </p>
                    <p className="text-xs text-graphite-500">
                      {orgName(request.organizationId)} — demandé le{" "}
                      {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    {request.message && <p className="mt-1 text-xs text-graphite-700">« {request.message} »</p>}
                  </div>
                  <Badge tone="info">En attente</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <form action={approveTemplatePurchaseRequest}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <Button type="submit" size="sm" variant="primary">
                      Approuver l&apos;achat
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
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">
          Historique des demandes ({templateRequestHistory.length})
        </h2>
        <Card className="overflow-hidden">
          {templateRequestHistory.length === 0 ? (
            <EmptyState icon={FileCheck2} title="Aucun historique" className="border-none" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                <tr>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Modèle</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5">Décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {templateRequestHistory.map((request) => (
                  <tr key={request.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 text-graphite-900">{orgName(request.organizationId)}</td>
                    <td className="px-4 py-3 text-graphite-700">
                      {templateName(request.documentTemplateCatalogId ?? "")}
                    </td>
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

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">
          Catalogue de modèles premium ({premiumTemplates.length})
        </h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-4 py-2.5">Modèle</th>
                <th className="px-4 py-2.5">Service</th>
                <th className="px-4 py-2.5">Catégorie document</th>
                <th className="px-4 py-2.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {premiumTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-surface-subtle">
                  <td className="px-4 py-3 font-medium text-graphite-900">{template.name}</td>
                  <td className="px-4 py-3 text-graphite-700">{template.serviceCode}</td>
                  <td className="px-4 py-3 text-graphite-700">{template.category}</td>
                  <td className="px-4 py-3">
                    <Badge tone={template.isActive ? "success" : "neutral"}>
                      {template.isActive ? "Actif" : "Retiré"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">
          Achats enregistrés ({templatePurchases.length})
        </h2>
        <Card className="overflow-hidden">
          {templatePurchases.length === 0 ? (
            <EmptyState icon={Package} title="Aucun achat enregistré" className="border-none" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                <tr>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Modèle</th>
                  <th className="px-4 py-2.5">Acheté le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {templatePurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 text-graphite-900">{orgName(purchase.organizationId)}</td>
                    <td className="px-4 py-3 text-graphite-700">{templateName(purchase.templateCatalogId)}</td>
                    <td className="px-4 py-3 text-xs text-graphite-500">
                      {new Date(purchase.purchasedAt).toLocaleDateString("fr-FR")}
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
          { key: "annuaire", label: "Annuaire", content: annuaireTab },
          { key: "modeles", label: `Modèles premium (${pendingTemplateRequests.length})`, content: modelesTab },
        ]}
      />
    </div>
  );
}
