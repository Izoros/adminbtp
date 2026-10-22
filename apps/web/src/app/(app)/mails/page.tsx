import { Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { getMailThreads } from "@/lib/data/mails";
import { getSites, getAllLots } from "@/lib/data/sites";
import { classifyMailThread } from "@/lib/actions/mail-filing";
import { DemoAIProvider } from "@adminbtp/integrations";
import {
  MAIL_STATUS_LABELS,
  MAIL_URGENCY_LABELS,
  DocumentCategory,
  DOCUMENT_CATEGORY_LABELS,
  type MailUrgency,
} from "@adminbtp/types";

const URGENCY_TONE: Record<MailUrgency, "neutral" | "warning" | "danger"> = {
  NORMALE: "neutral",
  URGENTE: "warning",
  CRITIQUE: "danger",
};

const aiProvider = new DemoAIProvider();

export default async function MailsPage() {
  const [mailThreads, sites, lots] = await Promise.all([getMailThreads(), getSites(), getAllLots()]);
  const sorted = [...mailThreads].sort((a, b) => (b.lastMessageAt > a.lastMessageAt ? 1 : -1));
  const suggestions = await Promise.all(
    sorted.map((mail) => (mail.siteId && mail.status === "NON_TRAITE" ? aiProvider.suggestMailFiling(mail.subject, "") : null)),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Mails" description={`${mailThreads.length} fils de discussion — boîtes génériques des sociétés clientes`} />

      {sorted.length === 0 ? (
        <EmptyState icon={Mail} title="Aucun mail" />
      ) : (
        <div className="space-y-2">
          {sorted.map((mail, index) => {
            const site = sites.find((s) => s.id === mail.siteId);
            const siteLots = mail.siteId ? lots.filter((l) => l.siteId === mail.siteId) : [];
            const suggestion = suggestions[index];
            return (
              <Card key={mail.id} className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-4">
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
                </div>

                {site && mail.status === "NON_TRAITE" && (
                  <form action={classifyMailThread} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                    <input type="hidden" name="threadId" value={mail.id} />
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">
                        Catégorie {suggestion?.suggestedCategory && "(suggestion IA)"}
                      </label>
                      <Select
                        name="category"
                        className="h-8 w-48 text-xs"
                        required
                        defaultValue={suggestion?.suggestedCategory ?? ""}
                      >
                        <option value="" disabled>Choisir…</option>
                        {DocumentCategory.options.map((c) => (
                          <option key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</option>
                        ))}
                      </Select>
                    </div>
                    {siteLots.length > 0 && (
                      <div>
                        <label className="mb-1 block text-xs text-graphite-500">Lot</label>
                        <Select name="lotId" className="h-8 w-28 text-xs" defaultValue="">
                          <option value="">Aucun</option>
                          {siteLots.map((lot) => (
                            <option key={lot.id} value={lot.id}>{lot.number}</option>
                          ))}
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Titre *</label>
                      <Input name="title" defaultValue={mail.subject} className="h-8 w-56 text-xs" required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-graphite-500">Action</label>
                      <Select name="action" className="h-8 w-32 text-xs" defaultValue="TASK">
                        <option value="TASK">Créer une tâche</option>
                        <option value="DOCUMENT">Créer un document</option>
                      </Select>
                    </div>
                    <Button type="submit" size="sm" variant="secondary">Classer</Button>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
