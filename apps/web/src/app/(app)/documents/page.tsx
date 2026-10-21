import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { mockDocuments, mockSites } from "@/lib/mock-data";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS, type DocumentStatus } from "@adminbtp/types";

const STATUS_TONE: Record<DocumentStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  BROUILLON: "neutral",
  PREEDITION: "warning",
  EN_CONTROLE: "info",
  EN_VALIDATION: "info",
  VALIDE: "success",
  ENVOYE: "success",
  ARCHIVE: "neutral",
};

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description={`${mockDocuments.length} documents — modèles, courriers, PPSPS, DOE, situations…`}
        action={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4" />
            Générer un document
          </Button>
        }
      />

      {mockDocuments.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-4 py-2.5">Document</th>
                <th className="px-4 py-2.5">Chantier</th>
                <th className="px-4 py-2.5">Catégorie</th>
                <th className="px-4 py-2.5">Version</th>
                <th className="px-4 py-2.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {mockDocuments.map((doc) => {
                const site = mockSites.find((s) => s.id === doc.siteId);
                return (
                  <tr key={doc.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 font-medium text-graphite-900">{doc.title}</td>
                    <td className="px-4 py-3">
                      {site ? (
                        <Link href={`/chantiers/${site.id}`} className="text-graphite-700 hover:underline">
                          {site.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-graphite-700">{DOCUMENT_CATEGORY_LABELS[doc.category]}</td>
                    <td className="px-4 py-3 text-graphite-700">v{doc.version}</td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[doc.status]}>{DOCUMENT_STATUS_LABELS[doc.status]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="border-chantier-orange/30 bg-chantier-orange-soft/40 p-4">
        <p className="text-sm text-graphite-900">
          <strong>Rappel PPSPS :</strong> tout PPSPS généré par la plateforme est une préédition. Il doit être contrôlé
          et adapté par les personnes compétentes avant toute valeur contractuelle ou de sécurité.
        </p>
      </Card>
    </div>
  );
}
