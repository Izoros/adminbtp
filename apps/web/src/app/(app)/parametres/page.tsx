import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { mockOrganizations } from "@/lib/mock-data";

const activeOrg = mockOrganizations[0];

const DOCUMENT_TEMPLATES = [
  { id: "tpl-1", name: "PPSPS type", category: "Sécurité (préédition)" },
  { id: "tpl-2", name: "Courrier de notification de démarrage", category: "Courrier" },
  { id: "tpl-3", name: "Situation de travaux", category: "Finance" },
  { id: "tpl-4", name: "DOE — Dossier des ouvrages exécutés", category: "Clôture" },
];

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

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Organisation, modèles de documents, circuits de validation et intégrations" />

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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-graphite-500">Raison sociale</label>
                      <Input defaultValue={activeOrg.legalName} disabled />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-graphite-500">SIRET</label>
                      <Input defaultValue={activeOrg.siret ?? "—"} disabled />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-graphite-500">Ville</label>
                      <Input defaultValue={activeOrg.city} disabled />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-graphite-500">Code postal</label>
                      <Input defaultValue={activeOrg.postalCode} disabled />
                    </div>
                  </div>
                  <p className="text-xs text-graphite-500">
                    Champs en lecture seule — Phase 1 (données de démonstration). L&apos;édition sera activée lorsque la
                    persistance réelle sera branchée.
                  </p>
                  <Button variant="secondary" size="sm" disabled>
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>
            ),
          },
          {
            key: "documents",
            label: "Modèles de documents",
            content: (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                    <tr>
                      <th className="px-4 py-2.5">Modèle</th>
                      <th className="px-4 py-2.5">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {DOCUMENT_TEMPLATES.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-surface-subtle">
                        <td className="px-4 py-3 font-medium text-graphite-900">{tpl.name}</td>
                        <td className="px-4 py-3 text-graphite-700">{tpl.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    </div>
  );
}
