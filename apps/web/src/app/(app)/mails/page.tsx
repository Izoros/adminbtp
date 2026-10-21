import { Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { mockMailThreads, mockSites } from "@/lib/mock-data";
import { MAIL_STATUS_LABELS, MAIL_URGENCY_LABELS, type MailUrgency } from "@adminbtp/types";

const URGENCY_TONE: Record<MailUrgency, "neutral" | "warning" | "danger"> = {
  NORMALE: "neutral",
  URGENTE: "warning",
  CRITIQUE: "danger",
};

export default function MailsPage() {
  const sorted = [...mockMailThreads].sort((a, b) => (b.lastMessageAt > a.lastMessageAt ? 1 : -1));

  return (
    <div className="space-y-6">
      <PageHeader title="Mails" description={`${mockMailThreads.length} fils de discussion — boîtes génériques des sociétés clientes`} />

      {sorted.length === 0 ? (
        <EmptyState icon={Mail} title="Aucun mail" />
      ) : (
        <div className="space-y-2">
          {sorted.map((mail) => {
            const site = mockSites.find((s) => s.id === mail.siteId);
            return (
              <Card key={mail.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-graphite-900">{mail.subject}</p>
                    {mail.urgency !== "NORMALE" && (
                      <Badge tone={URGENCY_TONE[mail.urgency]}>{MAIL_URGENCY_LABELS[mail.urgency]}</Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-graphite-500">
                    {mail.fromAddress} {site ? `· ${site.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <Badge>{MAIL_STATUS_LABELS[mail.status]}</Badge>
                  <span className="text-xs text-graphite-500">
                    {new Date(mail.lastMessageAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
