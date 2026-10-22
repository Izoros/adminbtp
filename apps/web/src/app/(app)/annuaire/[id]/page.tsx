import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Phone, Mail, Globe, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizations } from "@/lib/data/organizations";
import { getActiveOrganizationIdCookie, resolveActiveOrganization } from "@/lib/data/organization-context";
import {
  getDirectoryCategories,
  getDirectoryCompaniesBrowse,
  getDirectoryCompanyContacts,
  getDirectoryCompanyDetail,
  type DirectoryCompanyDetail,
} from "@/lib/data/directory";
import { getTradeCodes } from "@/lib/data/trades";
import type { DirectoryContact } from "@adminbtp/types";

export default async function AnnuaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [organizations, activeOrgCookie, categories, trades, companies] = await Promise.all([
    getOrganizations(),
    getActiveOrganizationIdCookie(),
    getDirectoryCategories(),
    getTradeCodes(),
    getDirectoryCompaniesBrowse(),
  ]);

  // Les colonnes de navigation (nom, ville, catégorie) sont visibles dès que RLS autorise la
  // ligne — si absente ici, soit la fiche n'existe pas, soit l'organisation n'y a pas accès.
  const browseRow = companies.find((c) => c.id === id);
  if (!browseRow) notFound();

  const activeOrg = resolveActiveOrganization(organizations, activeOrgCookie);
  const category = categories.find((c) => c.id === browseRow.categoryId);
  const trade = browseRow.tradeCodeId ? trades.find((t) => t.id === browseRow.tradeCodeId) : undefined;

  let detail: DirectoryCompanyDetail | null = null;
  let contacts: DirectoryContact[] = [];
  let errorMessage: string | null = null;

  if (activeOrg) {
    try {
      detail = await getDirectoryCompanyDetail(activeOrg.id, id);
      contacts = await getDirectoryCompanyContacts(activeOrg.id, id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : null;
      errorMessage = message || "Consultation refusée.";
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/annuaire" className="inline-flex items-center gap-1.5 text-sm text-graphite-500 hover:text-graphite-900">
        <ArrowLeft className="h-4 w-4" />
        Annuaire
      </Link>

      <PageHeader
        title={browseRow.name}
        description={category?.label}
        action={trade ? <Badge tone="info">{trade.label}</Badge> : undefined}
      />

      {!activeOrg ? (
        <EmptyState icon={Building2} title="Aucune organisation accessible" />
      ) : errorMessage ? (
        <Card className="border-status-danger/30 bg-status-danger/5 p-4 text-sm text-graphite-900">
          {errorMessage}
        </Card>
      ) : detail ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-graphite-700">
              {detail.siret && <p>SIRET : <span className="font-mono text-xs">{detail.siret}</span></p>}
              {(detail.address || detail.city) && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-graphite-500" />
                  {[detail.address, detail.postalCode, detail.city].filter(Boolean).join(", ")}
                </p>
              )}
              {detail.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-graphite-500" />
                  {detail.phone}
                </p>
              )}
              {detail.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-graphite-500" />
                  {detail.email}
                </p>
              )}
              {detail.website && (
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-graphite-500" />
                  <a href={detail.website} target="_blank" rel="noreferrer" className="text-chantier-orange hover:underline">
                    {detail.website}
                  </a>
                </p>
              )}
              {detail.notes && <p className="text-xs text-graphite-500">{detail.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-graphite-500">Aucun contact renseigné.</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="text-sm">
                      <p className="font-medium text-graphite-900">
                        {contact.fullName}
                        {contact.isPrimary && (
                          <Badge tone="accent" className="ml-2">
                            Principal
                          </Badge>
                        )}
                      </p>
                      {contact.role && <p className="text-xs text-graphite-500">{contact.role}</p>}
                      {contact.email && <p className="text-xs text-graphite-700">{contact.email}</p>}
                      {contact.phone && <p className="text-xs text-graphite-700">{contact.phone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
