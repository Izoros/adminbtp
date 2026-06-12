import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { resolveMailboxForInboundWebhook } from "@/modules/emails/services/supabase-email-data";
import { N8nWorkflowBoard } from "@/modules/emails/components/n8n-workflow-board";

type N8nPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    mailboxAddress?: string;
  }>;
};

export default async function N8nPage({ searchParams }: N8nPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mailboxResolution = await resolveMailboxForInboundWebhook(
    resolvedSearchParams?.organizationId ?? "org_adminbtp_001",
    resolvedSearchParams?.mailboxAddress ?? "client@adminbtp.yt",
  );

  return (
    <ModulePageFrame>
      <N8nWorkflowBoard
        dataOrigin={mailboxResolution.dataOrigin}
        mailboxId={mailboxResolution.mailboxId}
        mailboxCreated={mailboxResolution.mailboxCreated}
        fallbackReason={
          mailboxResolution.mailboxId
            ? undefined
            : "Aucune boite active n'a encore ete resolue pour ce webhook."
        }
      />
    </ModulePageFrame>
  );
}
