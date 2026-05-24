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
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
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
      </div>
    </main>
  );
}
