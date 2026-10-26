import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getOrganizations } from "@/lib/data/organizations";
import { getSites } from "@/lib/data/sites";
import { getDocumentTemplates } from "@/lib/data/documents";
import { getActiveOrganizationIdCookie, resolveActiveOrganization } from "@/lib/data/organization-context";
import { createDocument, generateDocumentFromTemplate } from "@/lib/actions/documents";
import { DOCUMENT_CATEGORY_LABELS, DocumentCategory } from "@adminbtp/types";

export default async function NouveauDocumentPage() {
  const [organizations, sites, activeOrgCookie] = await Promise.all([
    getOrganizations(),
    getSites(),
    getActiveOrganizationIdCookie(),
  ]);
  const defaultOrg = resolveActiveOrganization(organizations, activeOrgCookie);
  const orgNameById = new Map(organizations.map((o) => [o.id, o.name]));
  const templates = defaultOrg ? await getDocumentTemplates(defaultOrg.id) : [];

  return (
    <div className="space-y-6">
      <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-graphite-500 hover:text-graphite-900">
        <ArrowLeft className="h-4 w-4" />
        Documents
      </Link>

      <PageHeader title="Générer un document" description="Créer un document rattaché à une organisation, éventuellement à un chantier" />

      {organizations.length === 0 ? (
        <Card className="p-4 text-sm text-graphite-500">
          Aucune organisation accessible — impossible de créer un document.
        </Card>
      ) : (
        <>
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Générer avec l&apos;IA depuis un modèle — {defaultOrg?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.map((template) => (
                  <details key={template.id} className="rounded-md border border-surface-border p-3">
                    <summary className="cursor-pointer text-sm font-medium text-graphite-900">
                      {template.name} — {DOCUMENT_CATEGORY_LABELS[template.category]}
                      {template.requiresExpertReview && (
                        <span className="ml-2 text-xs font-normal text-graphite-500">(contrôle expert requis)</span>
                      )}
                    </summary>
                    <form action={generateDocumentFromTemplate} className="mt-3 space-y-3">
                      <input type="hidden" name="organizationId" value={defaultOrg?.id} />
                      <input type="hidden" name="templateId" value={template.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-graphite-500">Titre *</label>
                          <Input name="title" placeholder={template.name} required />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-graphite-500">Chantier</label>
                          <Select name="siteId" defaultValue="">
                            <option value="">Aucun chantier</option>
                            {sites
                              .filter((s) => s.organizationId === template.organizationId)
                              .map((site) => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                              ))}
                          </Select>
                        </div>
                      </div>
                      {template.variables.map((variable) => (
                        <div key={variable}>
                          <label className="mb-1 block text-xs font-medium text-graphite-500">{variable}</label>
                          <Input name={`variable:${variable}`} />
                        </div>
                      ))}
                      <Button type="submit" variant="accent" size="sm">Générer le document</Button>
                    </form>
                  </details>
                ))}
              </CardContent>
            </Card>
          )}

        <Card>
          <CardHeader>
            <CardTitle>Document vierge</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createDocument} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="organizationId" className="mb-1 block text-xs font-medium text-graphite-500">
                    Organisation *
                  </label>
                  <Select id="organizationId" name="organizationId" defaultValue={defaultOrg?.id} required>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="siteId" className="mb-1 block text-xs font-medium text-graphite-500">
                    Chantier
                  </label>
                  <Select id="siteId" name="siteId" defaultValue="">
                    <option value="">Aucun chantier</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} — {orgNameById.get(site.organizationId) ?? "—"}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium text-graphite-500">
                  Titre *
                </label>
                <Input id="title" name="title" placeholder="PPSPS — Réhabilitation collège de Kawéni" required />
              </div>

              <div>
                <label htmlFor="category" className="mb-1 block text-xs font-medium text-graphite-500">
                  Catégorie *
                </label>
                <Select id="category" name="category" defaultValue="COURRIER" required>
                  {DocumentCategory.options.map((category) => (
                    <option key={category} value={category}>
                      {DOCUMENT_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-graphite-500">
                  Un PPSPS naît toujours en statut Préédition — contrôle obligatoire avant toute
                  valeur contractuelle ou de sécurité. Les autres catégories démarrent en
                  Brouillon.
                </p>
              </div>

              <p className="text-xs text-graphite-500">
                Fiche sans contenu ni fichier réel — utile pour tracer un document existant ailleurs.
                Pour un fichier PDF réellement généré et stocké, utilisez un modèle ci-dessus si
                disponible.
              </p>

              <div className="flex gap-2">
                <Button type="submit" variant="accent">
                  Créer le document
                </Button>
                <Link href="/documents">
                  <Button type="button" variant="secondary">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
