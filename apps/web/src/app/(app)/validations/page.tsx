import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getValidationRecords } from "@/lib/data/validations";
import { getDocuments } from "@/lib/data/documents";
import { approveValidation, refuseValidation } from "@/lib/actions/validations";

const STEP_LABELS: Record<string, string> = {
  PREPARATION: "Préparation",
  CONTROLE_GESTIONNAIRE: "Contrôle gestionnaire",
  VALIDATION_DIRIGEANT: "Validation dirigeant",
  SIGNATURE: "Signature",
  ENVOI: "Envoi",
  ARCHIVAGE: "Archivage",
};

export default async function ValidationsPage() {
  const [validations, documents] = await Promise.all([getValidationRecords(), getDocuments()]);
  const pending = validations.filter((v) => !v.decision);
  const decided = validations.filter((v) => v.decision);

  return (
    <div className="space-y-6">
      <PageHeader title="Validations" description="Circuit préparation → contrôle → validation dirigeant → signature → envoi → archivage" />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">En attente ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Aucune validation en attente" />
        ) : (
          <div className="space-y-2">
            {pending.map((v) => {
              const doc = documents.find((d) => d.id === v.documentId);
              return (
                <Card key={v.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-graphite-900">{doc?.title ?? v.documentId}</p>
                    <p className="text-xs text-graphite-500">Étape : {STEP_LABELS[v.step]}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={refuseValidation.bind(null, v.id)}>
                      <Button type="submit" size="sm" variant="secondary">Refuser</Button>
                    </form>
                    <form action={approveValidation.bind(null, v.id)}>
                      <Button type="submit" size="sm" variant="primary">Approuver</Button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Historique ({decided.length})</h2>
        <div className="space-y-2">
          {decided.map((v) => {
            const doc = documents.find((d) => d.id === v.documentId);
            return (
              <Card key={v.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-graphite-900">{doc?.title ?? v.documentId}</p>
                  <p className="text-xs text-graphite-500">
                    {STEP_LABELS[v.step]} · {v.decidedAt && new Date(v.decidedAt).toLocaleDateString("fr-FR")}
                  </p>
                  {v.whatsappProofUrl && (
                    <p className="mt-1 text-xs text-graphite-500">
                      Preuve WhatsApp jointe — ne constitue pas une signature électronique.
                    </p>
                  )}
                </div>
                <Badge tone={v.decision === "APPROUVE" ? "success" : v.decision === "REFUSE" ? "danger" : "warning"}>
                  {v.decision}
                </Badge>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
