import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import { getOrganizations } from "@/lib/data/organizations";
import { getDocumentTemplates } from "@/lib/data/documents";
import {
  getActiveOrganizationIdCookie,
  resolveActiveOrganization,
} from "@/lib/data/organization-context";
import { DOCUMENT_CATEGORY_LABELS } from "@adminbtp/types";
import { updateOrganizationProfile } from "@/lib/actions/organizations";

const VALIDATION_CIRCUIT = [
  { step: "Préparation", responsible: "Chargé d'affaires" },
  { step: "Contrôle gestionnaire", responsible: "Gestionnaire administratif" },
  { step: "Validation dirigeant", responsible: "Dirigeant" },
  { step: "Signature", responsible: "Signataire habilité (hors WhatsApp)" },
  { step: "Envoi", responsible: "Gestionnaire administratif" },
  { step: "Archivage", responsible: "Automatique" },
];

const INTEGRATIONS = [
  { name: "Odoo", status: "Non connecté", description: "Adaptateur JSON-2 API — synchronisation non bloquante" },
  { name: "Email (générique)", status: "Mode démo", description: "Boîtes génériques des sociétés clientes" },
  { name: "WhatsApp Business", status: "Mode démo", description: "Preuve d'échange — ne vaut pas signature électronique" },
  { name: "IA (génération de documents)", status: "Mode démo", description: "Fournisseur interchangeable" },
  { name: "n8n (automatisations)", status: "Non connecté", description: "Orchestration des workflows multi-outils" },
];

export default async function ParametresPage() {
  const [organizations, activeOrgCookie] = await Promise.all([
    getOrganizations(),
    getActiveOrganizationIdCookie(),
  ]);
  const activeOrg = resolveActiveOrganization(organizations, activeOrgCookie);
  const documentTemplates = activeOrg ? await getDocumentTemplates(activeOrg.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Organisation, modèles de documents, circuits de validation et intégrations" />

      {!activeOrg ? (
        <EmptyState icon={Building2} title="Aucune organisation accessible" />
      ) : (
        <Tabs
          defaultKey="organisation"
          tabs={[
            {
              key: "organisation",
              label: "Organisation",
              content: (
                <Card>
                  <CardHeader>
                    <CardTitle>Profil de l&apos;organisation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form action={updateOrganizationProfile.bind(null, activeOrg.id)} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="legalName" className="mb-1 block text-xs font-medium text-graphite-500">
                            Raison sociale
                          </label>
                          <Input id="legalName" name="legalName" defaultValue={activeOrg.legalName} required />
                        </div>
                        <div>
                          <label htmlFor="siret" className="mb-1 block text-xs font-medium text-graphite-500">
                            SIRET
                          </label>
                          <Input id="siret" name="siret" defaultValue={activeOrg.siret ?? ""} />
                        </div>
                        <div>
                          <label htmlFor="city" className="mb-1 block text-xs font-medium text-graphite-500">
                            Ville
                          </label>
                          <Input id="city" name="city" defaultValue={activeOrg.city ?? ""} />
                        </div>
                        <div>
                          <label htmlFor="postalCode" className="mb-1 block text-xs font-medium text-graphite-500">
                            Code postal
                          </label>
                          <Input id="postalCode" name="postalCode" defaultValue={activeOrg.postalCode ?? ""} />
                        </div>
                      </div>
                      <Button type="submit" variant="secondary" size="sm">
                        Enregistrer
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ),
            },
            {
              key: "documents",
              label: "Modèles de documents",
              content: (
                <Card className="overflow-hidden">
                  {documentTemplates.length === 0 ? (
                    <EmptyState icon={Building2} title="Aucun modèle de document" className="border-none" />
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                        <tr>
                          <th className="px-4 py-2.5">Modèle</th>
                          <th className="px-4 py-2.5">Catégorie</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {documentTemplates.map((tpl) => (
                          <tr key={tpl.id} className="hover:bg-surface-subtle">
                            <td className="px-4 py-3 font-medium text-graphite-900">{tpl.name}</td>
                            <td className="px-4 py-3 text-graphite-700">{DOCUMENT_CATEGORY_LABELS[tpl.category]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
              ),
            },
            {
              key: "validations",
              label: "Circuit de validation",
              content: (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                      <tr>
                        <th className="px-4 py-2.5">Étape</th>
                        <th className="px-4 py-2.5">Responsable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {VALIDATION_CIRCUIT.map((row) => (
                        <tr key={row.step} className="hover:bg-surface-subtle">
                          <td className="px-4 py-3 font-medium text-graphite-900">{row.step}</td>
                          <td className="px-4 py-3 text-graphite-700">{row.responsible}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ),
            },
            {
              key: "integrations",
              label: "Intégrations",
              content: (
                <div className="space-y-2">
                  {INTEGRATIONS.map((integ) => (
                    <Card key={integ.name} className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium text-graphite-900">{integ.name}</p>
                        <p className="text-xs text-graphite-500">{integ.description}</p>
                      </div>
                      <Badge tone={integ.status === "Mode démo" ? "warning" : "neutral"}>{integ.status}</Badge>
                    </Card>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
